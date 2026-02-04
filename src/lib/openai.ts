import OpenAI from 'openai';
import type { JokeStyle, JokeCategory, JokeGradeResponse, GeneratedPrompt, AISetNotes, Joke } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 150,
  });

  return {
    prompt: response.choices[0].message.content?.trim() || 'Write a joke about something that happened to you today.',
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

Respond in this exact JSON format:
{
  "score": <number>,
  "tips": ["tip 1", "tip 2", "tip 3"],
  "analysis": "Brief analysis here"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    score: Math.min(10, Math.max(1, result.score || 5)),
    tips: result.tips || ['Keep writing and experimenting!'],
    analysis: result.analysis || 'Unable to provide detailed analysis.',
  };
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

Respond in this exact JSON format:
{
  "selectedJokeIds": ["id1", "id2", ...],
  "reasoning": "Brief explanation of your choices and suggested order"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    jokeIds: result.selectedJokeIds || [],
    reasoning: result.reasoning || 'Set generated based on scores and variety.',
  };
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

Respond in this exact JSON format:
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    opening_suggestions: result.opening_suggestions || [],
    closing_suggestions: result.closing_suggestions || [],
    callback_opportunities: result.callback_opportunities || [],
    stage_directions: result.stage_directions || [],
    audience_recovery_lines: result.audience_recovery_lines || [],
    general_notes: result.general_notes || '',
  };
}
