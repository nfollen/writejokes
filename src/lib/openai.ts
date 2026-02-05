import OpenAI from 'openai';
import type { JokeStyle, JokeCategory, JokeGradeResponse, GeneratedPrompt, AISetNotes, Joke } from '@/types';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Grok (xAI) client as fallback
const grok = process.env.XAI_API_KEY
  ? new OpenAI({ 
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    })
  : null;

// Helper to get working client
function getClient(): { client: OpenAI; model: string; provider: string } {
  if (openai) {
    return { client: openai, model: 'gpt-4o-mini', provider: 'openai' };
  }
  if (grok) {
    return { client: grok, model: 'grok-2-latest', provider: 'grok' };
  }
  throw new Error('No AI provider configured. Set OPENAI_API_KEY or XAI_API_KEY.');
}

// Helper for chat completion with fallback
async function chatCompletion(
  messages: { role: 'system' | 'user'; content: string }[],
  options: { temperature?: number; max_tokens?: number; json?: boolean } = {}
): Promise<string> {
  const providers = [];
  
  if (openai) providers.push({ client: openai, model: 'gpt-4o-mini', name: 'OpenAI' });
  if (grok) providers.push({ client: grok, model: 'grok-2-latest', name: 'Grok' });
  
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set OPENAI_API_KEY or XAI_API_KEY in environment.');
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
      
      // Log specific error types
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
    ? `The prompt should be inspired by the comedic sensibilities of: ${favoriteComedians.join(', ')}.`
    : '';

  const prompt = `You are a comedy writing coach. Generate a single creative joke prompt for a comedian to write a ${style} joke about ${category === 'freeform' ? 'any topic' : category}.

${comedianInfluence}

The prompt should:
- Be specific enough to inspire creativity but open enough for interpretation
- Challenge the comedian to find unexpected angles
- Be suitable for a ${style} format
- Not be a joke itself, but a springboard for comedy

Respond with ONLY the prompt text, nothing else. Keep it under 100 words.`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.9, max_tokens: 150 }
  );

  return {
    prompt: content || 'Write a joke about something that happened to you today.',
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
    ? `Consider the user admires these comedians: ${favoriteComedians.join(', ')}. Grade with their comedic sensibilities in mind.`
    : '';

  const systemPrompt = `You are an experienced comedy coach and talent scout. Your job is to grade jokes honestly but constructively, helping comedians improve.

${comedianContext}

Grade the joke on a scale of 1-10 where:
- 1-3: Needs significant work (weak premise, predictable punchline, poor structure)
- 4-5: Shows potential but has clear issues to address
- 6-7: Solid joke with room for improvement
- 8-9: Strong joke, minor tweaks could make it great
- 10: Exceptional, ready for a special

Be honest but encouraging. Even great comedians bomb sometimes.`;

  const userPrompt = `${prompt ? `Prompt given: "${prompt}"` : 'This was a freeform submission (no prompt).'}

Style: ${style}

Joke submitted:
"${jokeText}"

Provide:
1. A score from 1-10
2. 3-5 specific, actionable tips to improve this joke
3. A brief analysis of what works and what doesn't

Respond in this exact JSON format (no markdown, just JSON):
{
  "score": <number>,
  "tips": ["tip 1", "tip 2", "tip 3"],
  "analysis": "Brief analysis here"
}`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7, json: true }
  );

  try {
    // Try to parse JSON, handling potential markdown wrapping
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      score: Math.min(10, Math.max(1, result.score || 5)),
      tips: result.tips || ['Keep writing and experimenting!'],
      analysis: result.analysis || 'Unable to provide detailed analysis.',
    };
  } catch (parseErr) {
    console.error('[AI] Failed to parse grade response:', content);
    return {
      score: 5,
      tips: ['Keep writing and experimenting!'],
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

  const prompt = `You are a comedy set-building expert. Create an optimized ${targetDuration}-minute set from these jokes.

${comedianContext}

Available jokes:
${JSON.stringify(jokeSummaries, null, 2)}

Target duration: ${targetDuration} minutes (${targetDuration * 60} seconds)

Consider:
1. Start strong - hook the audience early
2. Build momentum with your strongest material
3. Vary the style and topics for flow
4. End on your best closer
5. Account for transitions and audience reaction time (add ~20% to pure joke time)
6. Prioritize higher-scored jokes but consider variety

Respond in this exact JSON format (no markdown, just JSON):
{
  "selectedJokeIds": ["id1", "id2", ...],
  "reasoning": "Brief explanation of your choices and suggested order"
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

  const prompt = `You are a comedy performance coach. Create detailed performance notes for this set called "${setName}".

Set list (in order):
${jokeDetails.map(j => `${j.index}. [${j.style}] ${j.text}`).join('\n\n')}

Generate comprehensive performance notes including:

1. Opening suggestions: 2-3 ways to introduce the set/warm up the crowd
2. Closing suggestions: 2-3 strong closers or callbacks to end on
3. Callback opportunities: Identify jokes that can reference earlier material for callbacks
4. Stage directions: Specific physicality, timing, or delivery notes for each joke
5. Audience recovery lines: 3-4 lines to use if a joke bombs
6. General notes: Overall flow observations and tips

Respond in this exact JSON format (no markdown, just JSON):
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
