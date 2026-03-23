import { describe, expect, it, vi } from 'vitest'
import { createDefaultThemeDraft } from '../domain/theme/createDefaultThemeDraft'
import { THEME_TOKEN_NAMES } from '../domain/theme/model'
import { selectExportThemeFile } from '../state/selectors'
import { applyJsonModeThemes } from './themeEditorPageHelpers'

describe('applyJsonModeThemes', () => {
  it('merges partial mode updates into the current resolved theme', () => {
    const draft = createDefaultThemeDraft()
    const replaceModeDraft = vi.fn()
    const currentDarkTheme = selectExportThemeFile(draft, 'dark').theme

    applyJsonModeThemes(
      draft,
      [...THEME_TOKEN_NAMES],
      {
        dark: {
          text: '#008080',
        },
      },
      replaceModeDraft,
    )

    expect(replaceModeDraft).toHaveBeenCalledTimes(1)
    expect(replaceModeDraft).toHaveBeenCalledWith('dark', {
      ...draft.modes.dark,
      tokenOverrides: {
        ...currentDarkTheme,
        text: '#008080',
      },
    })
  })

  it('skips replacements when a partial update does not change the resolved theme', () => {
    const draft = createDefaultThemeDraft()
    const replaceModeDraft = vi.fn()

    applyJsonModeThemes(
      draft,
      [...THEME_TOKEN_NAMES],
      {
        dark: {
          text: selectExportThemeFile(draft, 'dark').theme.text,
        },
      },
      replaceModeDraft,
    )

    expect(replaceModeDraft).not.toHaveBeenCalled()
  })
})
