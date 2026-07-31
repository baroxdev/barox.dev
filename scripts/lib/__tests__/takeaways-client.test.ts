import { afterEach, describe, expect, it, vi } from 'vitest'

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}))

// The real @google/genai SDK makes network calls internally, so it's mocked
// at the module level rather than mocking fetch — this pins the test to
// the SDK's public surface (models.generateContent), not its transport.
vi.mock('@google/genai', () => ({
  // A real `function`, not an arrow — the mock is invoked via `new` in the
  // source (`new GoogleGenAI(...)`), and arrow functions can never be
  // constructors.
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent: generateContentMock } }
  }),
  Type: { ARRAY: 'ARRAY', STRING: 'STRING' },
}))

const { createGeminiTakeawaysClient } = await import('../takeaways-client.ts')

function textResponse(takeaways: unknown) {
  return { text: JSON.stringify(takeaways) }
}

describe('createGeminiTakeawaysClient', () => {
  afterEach(() => {
    generateContentMock.mockReset()
  })

  it('calls models.generateContent with the title/body prompt, default model, and JSON array response config', async () => {
    generateContentMock.mockResolvedValue(textResponse(['A.', 'B.', 'C.']))

    const client = createGeminiTakeawaysClient('test-key')
    const result = await client.generate({
      title: 'My Post',
      body: 'Some plain text.',
    })

    expect(result).toEqual(['A.', 'B.', 'C.'])
    expect(generateContentMock).toHaveBeenCalledTimes(1)

    const [params] = generateContentMock.mock.calls[0] as [
      {
        model: string
        contents: string
        config: { responseMimeType: string; responseSchema: unknown }
      },
    ]
    expect(params.model).toBe('gemini-3.6-flash')
    expect(params.contents).toContain('My Post')
    expect(params.contents).toContain('Some plain text.')
    expect(params.config.responseMimeType).toBe('application/json')
    expect(params.config.responseSchema).toEqual({
      type: 'ARRAY',
      items: { type: 'STRING' },
    })
  })

  it('uses a custom model when one is passed', async () => {
    generateContentMock.mockResolvedValue(textResponse(['A.', 'B.', 'C.']))

    const client = createGeminiTakeawaysClient('test-key', 'gemini-custom')
    await client.generate({ title: 'T', body: 'B' })

    const [params] = generateContentMock.mock.calls[0] as [{ model: string }]
    expect(params.model).toBe('gemini-custom')
  })

  it('returns the parsed takeaways array on a valid 3-5 item response', async () => {
    generateContentMock.mockResolvedValue(
      textResponse(['A.', 'B.', 'C.', 'D.']),
    )

    const client = createGeminiTakeawaysClient('test-key')
    const result = await client.generate({ title: 'T', body: 'B' })

    expect(result).toEqual(['A.', 'B.', 'C.', 'D.'])
  })

  it('throws when the response has no text output', async () => {
    generateContentMock.mockResolvedValue({ text: undefined })

    const client = createGeminiTakeawaysClient('test-key')

    await expect(
      client.generate({ title: 'T', body: 'B' }),
    ).rejects.toThrow(/no text output/)
  })

  it('throws when the response has too few takeaways', async () => {
    generateContentMock.mockResolvedValue(textResponse(['A.']))

    const client = createGeminiTakeawaysClient('test-key')

    await expect(client.generate({ title: 'T', body: 'B' })).rejects.toThrow(
      /3-5/,
    )
  })

  it('throws when the response has too many takeaways', async () => {
    generateContentMock.mockResolvedValue(
      textResponse(['A.', 'B.', 'C.', 'D.', 'E.', 'F.']),
    )

    const client = createGeminiTakeawaysClient('test-key')

    await expect(client.generate({ title: 'T', body: 'B' })).rejects.toThrow(
      /3-5/,
    )
  })

  it('throws when a candidate item is an empty string', async () => {
    generateContentMock.mockResolvedValue(textResponse(['A.', '', 'C.']))

    const client = createGeminiTakeawaysClient('test-key')

    await expect(client.generate({ title: 'T', body: 'B' })).rejects.toThrow()
  })

  it('propagates a rejected generateContent call (e.g. rate limiting) as-is', async () => {
    generateContentMock.mockRejectedValue(new Error('429 Too Many Requests'))

    const client = createGeminiTakeawaysClient('test-key')

    await expect(
      client.generate({ title: 'T', body: 'B' }),
    ).rejects.toThrow(/429/)
  })
})
