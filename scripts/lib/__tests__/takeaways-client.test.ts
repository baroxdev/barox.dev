import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGeminiTakeawaysClient } from '../takeaways-client.ts'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  } as Response
}

function candidateResponse(takeaways: unknown) {
  return jsonResponse({
    candidates: [
      { content: { parts: [{ text: JSON.stringify(takeaways) }] } },
    ],
  })
}

describe('createGeminiTakeawaysClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs the title/body prompt to the Gemini API with the key and default model', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(candidateResponse(['A.', 'B.', 'C.']))
    vi.stubGlobal('fetch', fetchMock)

    const client = createGeminiTakeawaysClient('test-key')
    await client.generate({ title: 'My Post', body: 'Some plain text.' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=test-key',
    )
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string) as {
      contents: { parts: { text: string }[] }[]
    }
    expect(body.contents[0]?.parts[0]?.text).toContain('My Post')
    expect(body.contents[0]?.parts[0]?.text).toContain('Some plain text.')
  })

  it('uses a custom model when one is passed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(candidateResponse(['A.', 'B.', 'C.']))
    vi.stubGlobal('fetch', fetchMock)

    const client = createGeminiTakeawaysClient('test-key', 'gemini-custom')
    await client.generate({ title: 'T', body: 'B' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/models/gemini-custom:generateContent')
  })

  it('returns the parsed takeaways array on a valid 3-5 item response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(candidateResponse(['A.', 'B.', 'C.', 'D.'])),
    )

    const client = createGeminiTakeawaysClient('test-key')
    const result = await client.generate({ title: 'T', body: 'B' })

    expect(result).toEqual(['A.', 'B.', 'C.', 'D.'])
  })

  it('throws when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({}, false, 429)),
    )

    const client = createGeminiTakeawaysClient('test-key')

    await expect(client.generate({ title: 'T', body: 'B' })).rejects.toThrow(
      /429/,
    )
  })

  it('throws when the response has too few takeaways', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(candidateResponse(['A.'])))

    const client = createGeminiTakeawaysClient('test-key')

    await expect(
      client.generate({ title: 'T', body: 'B' }),
    ).rejects.toThrow(/3-5/)
  })

  it('throws when the response has too many takeaways', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        candidateResponse(['A.', 'B.', 'C.', 'D.', 'E.', 'F.']),
      ),
    )

    const client = createGeminiTakeawaysClient('test-key')

    await expect(
      client.generate({ title: 'T', body: 'B' }),
    ).rejects.toThrow(/3-5/)
  })

  it('throws when a candidate item is an empty string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(candidateResponse(['A.', '', 'C.'])),
    )

    const client = createGeminiTakeawaysClient('test-key')

    await expect(client.generate({ title: 'T', body: 'B' })).rejects.toThrow()
  })

  it('throws when the response has no candidate text at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})))

    const client = createGeminiTakeawaysClient('test-key')

    await expect(
      client.generate({ title: 'T', body: 'B' }),
    ).rejects.toThrow(/no candidate text/)
  })
})
