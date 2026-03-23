import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { serializeThemeFile, exportCombinedThemeFile, exportThemeFile } from '../../domain/opencode/exportTheme'
import { createDefaultThemeDraft } from '../../domain/theme/createDefaultThemeDraft'
import { THEME_TOKEN_NAMES, type ThemeMode, type ThemeTokens } from '../../domain/theme/model'
import { selectExportCombinedThemeFile, selectExportThemeFile } from '../../state/selectors'
import { JsonThemeEditor } from './JsonThemeEditor'

function buildProps(activeMode: ThemeMode = 'dark') {
  const draft = createDefaultThemeDraft()
  draft.activeMode = activeMode

  return {
    themeFile: selectExportThemeFile(draft, activeMode),
    combinedThemeFile: selectExportCombinedThemeFile(draft),
    tokenNames: [...THEME_TOKEN_NAMES],
    activeMode,
    onChange: vi.fn(),
  }
}

describe('JsonThemeEditor', () => {
  it('applies a valid single-mode edit to the active mode and normalizes values', () => {
    const props = buildProps('light')
    const nextTheme = {
      ...props.themeFile.theme,
      text: '#ABC',
    }

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(exportThemeFile(nextTheme), null, 2),
      },
    })

    const payload = props.onChange.mock.lastCall?.[0]

    expect(payload.dark).toBeUndefined()
    expect(payload.light).toEqual(
      expect.objectContaining({
        text: '#aabbcc',
      }),
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('applies a valid combined edit and resolves defs references', () => {
    const props = buildProps('dark')
    const darkTheme = {
      ...selectExportThemeFile(createDefaultThemeDraft(), 'dark').theme,
      text: 'dark-text',
    }
    const lightTheme = {
      ...selectExportThemeFile(createDefaultThemeDraft(), 'light').theme,
      text: 'light-text',
    }

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(
          {
            $schema: 'https://opencode.ai/theme.json',
            defs: {
              'dark-text': 'teal',
              'light-text': '#EEE',
            },
            theme: exportCombinedThemeFile(darkTheme as typeof props.themeFile.theme, lightTheme as typeof props.themeFile.theme).theme,
          },
          null,
          2,
        ),
      },
    })

    const payload = props.onChange.mock.lastCall?.[0]

    expect(payload.dark).toEqual(
      expect.objectContaining({
        text: '#008080',
      }),
    )
    expect(payload.light).toEqual(
      expect.objectContaining({
        text: '#eeeeee',
      }),
    )
  })

  it('applies a dark-only combined edit and leaves light mode unchanged', () => {
    const props = buildProps('dark')
    const darkOnlyTheme = Object.fromEntries(
      props.tokenNames.map((token) => [token, { dark: token === 'text' ? 'teal' : props.combinedThemeFile.theme[token].dark }]),
    )

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(
          {
            $schema: 'https://opencode.ai/theme.json',
            theme: darkOnlyTheme,
          },
          null,
          2,
        ),
      },
    })

    const payload = props.onChange.mock.lastCall?.[0]

    expect(payload.dark).toEqual(
      expect.objectContaining({
        text: '#008080',
      }),
    )
    expect(payload.light).toBeUndefined()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('applies a light-only combined edit and leaves dark mode unchanged', () => {
    const props = buildProps('dark')
    const lightOnlyTheme = Object.fromEntries(
      props.tokenNames.map((token) => [token, { light: token === 'text' ? 'teal' : props.combinedThemeFile.theme[token].light }]),
    )

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(
          {
            $schema: 'https://opencode.ai/theme.json',
            theme: lightOnlyTheme,
          },
          null,
          2,
        ),
      },
    })

    const payload = props.onChange.mock.lastCall?.[0]

    expect(payload.dark).toBeUndefined()
    expect(payload.light).toEqual(
      expect.objectContaining({
        text: '#008080',
      }),
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the current mixed-format validation error', () => {
    const props = buildProps('dark')

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(
          {
            $schema: 'https://opencode.ai/theme.json',
            theme: {
              ...props.themeFile.theme,
              text: {
                dark: '#111111',
                light: '#eeeeee',
              },
            },
          },
          null,
          2,
        ),
      },
    })

    expect(props.onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      '`theme` cannot mix single-mode strings with combined dark/light objects',
    )
  })

  it('shows the current circular defs validation error', () => {
    const props = buildProps('dark')

    render(<JsonThemeEditor {...props} />)

    fireEvent.change(screen.getByLabelText('Theme JSON editor'), {
      target: {
        value: JSON.stringify(
          {
            $schema: 'https://opencode.ai/theme.json',
            defs: {
              loopA: 'loopB',
              loopB: 'loopA',
            },
            theme: {
              ...props.themeFile.theme,
              text: 'loopA',
            },
          },
          null,
          2,
        ),
      },
    })

    expect(props.onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Token `text` has a circular `defs` reference at `loopA`')
  })

  it('reformats valid JSON on blur using the serialized theme shape', () => {
    const props = buildProps('dark')
    const nextTheme = {
      ...props.themeFile.theme,
      text: '#ABC',
    }
    const expectedFormatted = serializeThemeFile(exportCombinedThemeFile(
      {
        ...props.themeFile.theme,
        text: '#aabbcc',
      },
      Object.fromEntries(
        Object.entries(props.combinedThemeFile.theme).map(([token, value]) => [token, value.light]),
      ) as ThemeTokens,
    )).trimEnd()

    function ControlledEditor() {
      const [darkTheme, setDarkTheme] = useState<ThemeTokens>(props.themeFile.theme)
      const [lightTheme, setLightTheme] = useState<ThemeTokens>(
        Object.fromEntries(
          Object.entries(props.combinedThemeFile.theme).map(([token, value]) => [token, value.light]),
        ) as ThemeTokens,
      )

      return (
        <JsonThemeEditor
          {...props}
          combinedThemeFile={exportCombinedThemeFile(darkTheme, lightTheme)}
          onChange={(modeThemes) => {
            props.onChange(modeThemes)

            if (modeThemes.dark) {
              setDarkTheme((current) => ({
                ...current,
                ...modeThemes.dark,
              }))
            }

            if (modeThemes.light) {
              setLightTheme((current) => ({
                ...current,
                ...modeThemes.light,
              }))
            }
          }}
        />
      )
    }

    render(<ControlledEditor />)

    const textarea = screen.getByLabelText('Theme JSON editor') as HTMLTextAreaElement

    fireEvent.focus(textarea)
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify(exportThemeFile(nextTheme)),
      },
    })
    fireEvent.blur(textarea)

    expect(textarea.value).toBe(expectedFormatted)
  })

  it('auto grows the textarea to fit the current JSON content', () => {
    const scrollHeightGetter = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(320)

    render(<JsonThemeEditor {...buildProps('dark')} />)

    expect((screen.getByLabelText('Theme JSON editor') as HTMLTextAreaElement).style.height).toBe('320px')

    scrollHeightGetter.mockRestore()
  })

  it('copies the current JSON text', async () => {
    const props = buildProps('dark')
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    })

    render(<JsonThemeEditor {...props} />)

    const textarea = screen.getByLabelText('Theme JSON editor') as HTMLTextAreaElement

    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(textarea.value)
    })
  })
})
