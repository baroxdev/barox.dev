import { GoogleGenAI, Type } from '@google/genai'

/** Gemini's free-tier flash model — cheap/fast enough for a script that
 * only ever runs once per new post. Overridable via GEMINI_MODEL since
 * Gemini's model lineup moves faster than this file will get updated. */
const DEFAULT_MODEL = 'gemini-3.6-flash'

export interface TakeawaysInput {
  title: string
  /** Plain text, markdown/JSX already stripped — see stripMarkdown in sync-takeaways.ts. */
  body: string
}

export interface TakeawaysClient {
  generate: (input: TakeawaysInput) => Promise<string[]>
}

function buildPrompt({ title, body }: TakeawaysInput): string {
  return `You are writing the "Key Takeaways" box shown at the very top of a blog post, before the reader has read the article.

Title: ${title}

Post body (plain text):
${body}

Write 3 to 5 short, concrete, one-sentence takeaways a reader would get from this specific post. State the actual point made — avoid generic filler like "this post covers X" or "learn about Y". Return only the takeaways themselves, one per array item.`
}

/** True for a well-formed response: 3-5 non-empty strings. Anything else
 * (malformed JSON, wrong count, empty items) is treated the same as an API
 * failure by the caller — warn and skip, never write a bad value in. */
function isValidTakeaways(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.length <= 5 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  )
}

/**
 * Uses the official @google/genai SDK's `models.generateContent` (the
 * stable, documented content-generation call) rather than the newer
 * `interactions` surface (agentic, multi-step, streaming-first) — this
 * script just needs one prompt in, one JSON array out.
 */
export function createGeminiTakeawaysClient(
  apiKey: string,
  model: string = DEFAULT_MODEL,
): TakeawaysClient {
  const ai = new GoogleGenAI({ apiKey })

  return {
    async generate(input) {
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(input),
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      })

      const text = response.text
      if (!text) throw new Error('Gemini response had no text output')

      const parsed: unknown = JSON.parse(text)
      if (!isValidTakeaways(parsed)) {
        throw new Error(
          'Gemini response was not a 3-5 item array of non-empty strings',
        )
      }

      return parsed
    },
  }
}
