import OpenAI from 'openai';
import type { JokeStyle, JokeCategory, JokeGradeResponse, GeneratedPrompt, AISetNotes, Joke } from '@/types';

// Initialize Grok (xAI) client - PRIMARY
const grok = process.env.XAI_API_KEY
  ? new OpenAI({ 
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    })
  : null;

// Initialize OpenAI client - FALLBACK
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Helper for chat completion with fallback (Grok first, then OpenAI)
async function chatCompletion(
  messages: { role: 'system' | 'user'; content: string }[],
  options: { temperature?: number; max_tokens?: number; json?: boolean } = {}
): Promise<string> {
  const providers = [];
  
  // Grok first (primary)
  if (grok) providers.push({ client: grok, model: 'grok-2-latest', name: 'Grok' });
  // OpenAI as fallback
  if (openai) providers.push({ client: openai, model: 'gpt-4o-mini', name: 'OpenAI' });
  
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set XAI_API_KEY or OPENAI_API_KEY in environment.');
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying ${provider.name}...`);
      
      const response = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 500,
        ...(options.json && provider.name === 'OpenAI' ? { response_format: { type: 'json_object' as const } } : {}),
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('Empty response from API');
      
      console.log(`[AI] ${provider.name} succeeded`);
      return content;
    } catch (err: any) {
      console.error(`[AI] ${provider.name} failed:`, err?.message || err);
      
      if (err?.status === 401) {
        console.error(`[AI] ${provider.name}: Invalid API key`);
      } else if (err?.status === 429) {
        console.error(`[AI] ${provider.name}: Rate limit or quota exceeded`);
      } else if (err?.status === 402 || err?.message?.includes('quota') || err?.message?.includes('billing')) {
        console.error(`[AI] ${provider.name}: Billing/credit issue`);
      }
      
      lastError = err;
    }
  }

  throw lastError || new Error('All AI providers failed');
}

export async function generateJokePrompt(
  category: JokeCategory,
  style: JokeStyle,
  favoriteComedians: string[] = [],
  usedPromptHashes: string[] = []
): Promise<GeneratedPrompt> {
  const comedianInfluence = favoriteComedians.length > 0
    ? `Draw from the sensibilities of: ${favoriteComedians.join(', ')}.`
    : '';

  const prompt = `You're a comedy writing coach giving a comedian their next writing assignment.

Generate ONE direct, specific prompt for a ${style} joke about ${category === 'freeform' ? 'any topic' : category}.

${comedianInfluence}

Rules:
- Be DIRECT. No "Imagine a world where..." or "How do you feel about..."
- Give them a specific angle, observation, or premise to explore
- The prompt should be a launchpad, not a complete joke setup
- Keep it punchy - one or two sentences max
- Examples of GOOD prompts:
  - "The worst part about going to the gym in January"
  - "Dating apps but you're being brutally honest in your bio"
  - "The passive-aggressive notes your roommate leaves"
  - "What your Uber driver is actually thinking"

Respond with ONLY the prompt text. Nothing else.`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.95, max_tokens: 100 }
  );

  return {
    prompt: content || 'Write about the most annoying thing that happened to you this week.',
    category,
    style,
  };
}

export async function gradeJoke(
  jokeText: string,
  prompt: string | null,
  style: JokeStyle,
  favoriteComedians: string[] = []
): Promise<JokeGradeResponse> {
  const comedianContext = favoriteComedians.length > 0
    ? `The comedian admires: ${favoriteComedians.join(', ')}.`
    : '';

  const systemPrompt = `You're a brutally honest comedy coach. Your job is to grade jokes like a real comedy club booker would judge them - honestly, not kindly.

${comedianContext}

Scoring (be HONEST - most jokes are 4-6, not 7-8):
- 1-2: Not a joke. No structure, no punchline, or completely misses
- 3-4: Has an idea but the execution is weak. Predictable or poorly constructed
- 5-6: Decent joke. Works but won't kill. Room for improvement
- 7-8: Strong joke. Would get real laughs from a crowd
- 9-10: Exceptional. Tight, original, memorable. Reserve these for truly great jokes

Don't be nice. Don't pad scores. A 5 is fine - it means "keep working on it."
If the joke sucks, say so. That's how comedians get better.`;

  const userPrompt = `${prompt ? `Prompt: "${prompt}"` : 'Freeform submission (no prompt).'}

Style: ${style}

Joke:
"${jokeText}"

Grade this joke. Be honest - what score does it actually deserve? What specifically works or doesn't work? Give actionable tips, not generic advice.

Respond in JSON format:
{
  "score": <number 1-10>,
  "tips": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "analysis": "What works, what doesn't, and why"
}`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7, json: true }
  );

  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      score: Math.min(10, Math.max(1, result.score || 5)),
      tips: result.tips || ['Keep writing and experimenting.'],
      analysis: result.analysis || 'Unable to provide detailed analysis.',
    };
  } catch (parseErr) {
    console.error('[AI] Failed to parse grade response:', content);
    return {
      score: 5,
      tips: ['Keep writing and experimenting.'],
      analysis: 'Unable to provide detailed analysis due to a parsing error.',
    };
  }
}

export async function generateSuggestedSet(
  jokes: Joke[],
  targetDuration: 5 | 10 | 15,
  favoriteComedians: string[] = []
): Promise<{ jokeIds: string[]; reasoning: string }> {
  const comedianContext = favoriteComedians.length > 0
    ? `The comedian admires: ${favoriteComedians.join(', ')}. Consider their set-building approaches.`
    : '';

  const jokeSummaries = jokes.map((j, i) => ({
    index: i,
    id: j.id,
    text: j.joke_text.substring(0, 200),
    score: j.score,
    style: j.style,
    category: j.category,
    duration: j.duration_seconds,
  }));

  const prompt = `You're building a ${targetDuration}-minute standup set from these jokes.

${comedianContext}

Available jokes:
${JSON.stringify(jokeSummaries, null, 2)}

Target: ${targetDuration} minutes (${targetDuration * 60} seconds)

Build the set:
1. Open strong - hook them early
2. Build momentum with your best stuff
3. Vary style and topics for flow
4. Close on your best closer
5. Add ~20% buffer for reactions/transitions
6. Prioritize higher scores but maintain variety

Respond in JSON:
{
  "selectedJokeIds": ["id1", "id2", ...],
  "reasoning": "Brief explanation of order and choices"
}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, json: true }
  );

  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      jokeIds: result.selectedJokeIds || [],
      reasoning: result.reasoning || 'Set generated based on scores and variety.',
    };
  } catch (parseErr) {
    console.error('[AI] Failed to parse set response:', content);
    return {
      jokeIds: jokes.slice(0, 5).map(j => j.id),
      reasoning: 'Set generated based on scores and variety.',
    };
  }
}

export async function generateSetNotes(
  jokes: Joke[],
  setName: string
): Promise<AISetNotes> {
  const jokeDetails = jokes.map((j, i) => ({
    index: i + 1,
    text: j.joke_text,
    style: j.style,
  }));

  const prompt = `You're a comedy performance coach. Create performance notes for this set called "${setName}".

Set list:
${jokeDetails.map(j => `${j.index}. [${j.style}] ${j.text}`).join('\n\n')}

Generate:
1. Opening suggestions: 2-3 ways to warm up/intro
2. Closing suggestions: 2-3 strong closers or callbacks
3. Callback opportunities: Where earlier jokes can be referenced
4. Stage directions: Physicality, timing, delivery notes per joke
5. Recovery lines: 3-4 lines if something bombs
6. General notes: Flow observations and tips

Respond in JSON:
{
  "opening_suggestions": ["suggestion 1", "suggestion 2"],
  "closing_suggestions": ["suggestion 1", "suggestion 2"],
  "callback_opportunities": [
    {"from_joke_index": 1, "to_joke_index": 3, "suggestion": "description"}
  ],
  "stage_directions": [
    {"joke_index": 1, "direction": "specific direction"}
  ],
  "audience_recovery_lines": ["line 1", "line 2"],
  "general_notes": "Overall observations"
}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, json: true }
  );

  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      opening_suggestions: result.opening_suggestions || [],
      closing_suggestions: result.closing_suggestions || [],
      callback_opportunities: result.callback_opportunities || [],
      stage_directions: result.stage_directions || [],
      audience_recovery_lines: result.audience_recovery_lines || [],
      general_notes: result.general_notes || '',
    };
  } catch (parseErr) {
    console.error('[AI] Failed to parse notes response:', content);
    return {
      opening_suggestions: [],
      closing_suggestions: [],
      callback_opportunities: [],
      stage_directions: [],
      audience_recovery_lines: [],
      general_notes: 'Unable to generate notes due to a parsing error.',
    };
  }
}
