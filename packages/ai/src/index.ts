import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '@untold/env/server';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

export const storyDirectionSchema = z.object({
  premise: z
    .string()
    .describe('One or two sentences describing what this story could become.'),
  genre: z
    .string()
    .describe(
      'A short label for the shape of the story, e.g. "A nostalgic coming-of-age story".',
    ),
  directions: z
    .array(
      z.object({
        title: z.string().describe('A short, evocative name for this path.'),
        description: z
          .string()
          .describe('One sentence describing where this direction goes.'),
      }),
    )
    .length(3),
});

export type StoryDirectionSuggestion = z.infer<typeof storyDirectionSchema>;

const SYSTEM_PROMPT = [
  'You are the creative writing companion inside Untold, a storytelling app.',
  'The user remains the author: you propose possibilities, you never decide',
  'for them, and you never invent facts about their real life or memories.',
  "Given someone's raw, unpolished notes, help them see what their story",
  'could become.',
].join(' ');

function languageSystemPrompt(language?: string): string {
  return language
    ? ` Write entirely in ${language} — every word of your output, not just the prose.`
    : '';
}

// generateText has no structured-output guardrail, so models default to
// chatty preamble ("Here's a possible opening...") and markdown separators.
// The UI renders this output directly as story prose, so it must be clean.
const RAW_OUTPUT_INSTRUCTION = [
  'Output ONLY the requested text itself — no preamble, no commentary about',
  'the notes, no acknowledgement of the request, no closing remarks, no',
  'titles or headings, and no markdown formatting or separators (no ***,',
  'no ---, no code fences). Begin directly with the first word of the',
  'actual content and end with its last word.',
].join(' ');

export function isAiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

function getGoogleProvider() {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not configured — add it to apps/server/.env',
    );
  }
  return createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
}

export async function suggestStoryDirections(input: {
  notes: string;
  topic?: string;
  storyType?: string;
  language?: string;
}): Promise<StoryDirectionSuggestion> {
  const google = getGoogleProvider();

  const prompt = [
    `Notes: ${input.notes}`,
    input.topic ? `Topic: ${input.topic}` : null,
    input.storyType ? `Story type: ${input.storyType}` : null,
    '',
    'Propose one premise for what this could become, and exactly three',
    'different directions it could take.',
  ]
    .filter(Boolean)
    .join('\n');

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: storyDirectionSchema,
    system: `${SYSTEM_PROMPT}${languageSystemPrompt(input.language)}`,
    prompt,
  });

  return object;
}

export async function generateStoryDraft(input: {
  notes: string[];
  title?: string;
  topic?: string;
  aiInstructions?: string;
  language?: string;
  existingContent?: string;
}): Promise<string> {
  const google = getGoogleProvider();

  const instruction = input.existingContent
    ? [
        'Continue the chapter directly from where it leaves off, turning',
        'the new notes above into the next one to two paragraphs. Do not',
        'repeat or rewrite anything already written above — write only the',
        'new continuation text.',
      ].join(' ')
    : [
        'Write a short opening passage (one to two paragraphs) turning',
        'these notes into the start of a real chapter.',
      ].join(' ');

  const prompt = [
    input.title ? `Working title: ${input.title}` : null,
    input.topic ? `Topic: ${input.topic}` : null,
    input.aiInstructions
      ? `Direction to follow: ${input.aiInstructions}`
      : null,
    input.existingContent
      ? `\nChapter written so far:\n${input.existingContent}`
      : null,
    '',
    input.existingContent ? 'New notes to continue from:' : 'Notes:',
    ...input.notes.map((note, index) => `${index + 1}. ${note}`),
    '',
    instruction,
    "Stay true to the notes' facts and tone — don't invent new events.",
  ]
    .filter(Boolean)
    .join('\n');

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: `${SYSTEM_PROMPT}${languageSystemPrompt(input.language)} ${RAW_OUTPUT_INSTRUCTION}`,
    prompt,
  });

  return text.trim();
}

export async function generateSynopsis(input: {
  notes: string[];
  title?: string;
  topic?: string;
  language?: string;
}): Promise<string> {
  const google = getGoogleProvider();

  const prompt = [
    input.title ? `Working title: ${input.title}` : null,
    input.topic ? `Topic: ${input.topic}` : null,
    '',
    'Notes:',
    ...input.notes.map((note, index) => `${index + 1}. ${note}`),
    '',
    'Write one short sentence (max 30 words) that could sit under the title',
    'as a synopsis — the kind of line a reader sees before deciding to read',
    'the story.',
  ]
    .filter(Boolean)
    .join('\n');

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: `${SYSTEM_PROMPT}${languageSystemPrompt(input.language)} ${RAW_OUTPUT_INSTRUCTION}`,
    prompt,
  });

  return text.trim();
}
