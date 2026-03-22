import { describe, expect, it } from 'vitest'
import { clearThemeShareLocation, parseThemeShareLocation } from './themeShareLink'

describe('themeShareLink', () => {
  it('parses shared themes from search params', () => {
    expect(parseThemeShareLocation({ search: '?shared-theme=encoded-payload', hash: '' })).toEqual({
      themeSlug: 'shared-theme',
      encodedPayload: 'encoded-payload',
    })
  })

  it('clears share params and hash fragments from the current url', () => {
    window.history.replaceState(null, '', '/editor?shared-theme=encoded-payload#legacy')

    clearThemeShareLocation()

    expect(window.location.pathname).toBe('/editor')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
  })
})
