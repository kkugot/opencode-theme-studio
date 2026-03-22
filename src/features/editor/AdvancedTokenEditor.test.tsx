import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEME_TOKEN_NAMES, type ThemeTokens } from '../../domain/theme/model'
import { AdvancedTokenEditor } from './AdvancedTokenEditor'

function createTokens() {
  const tokens = {} as ThemeTokens

  THEME_TOKEN_NAMES.forEach((token, index) => {
    tokens[token] = `#${(index + 1).toString(16).padStart(6, '0')}`
  })

  return tokens
}

describe('AdvancedTokenEditor', () => {
  it('renders every theme token in the tuner', () => {
    const tokens = createTokens()

    render(
      <AdvancedTokenEditor
        resolvedTokens={tokens}
        derivedTokens={tokens}
        overrides={{}}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    )

    const renderedValues = screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value)

    expect(renderedValues).toHaveLength(THEME_TOKEN_NAMES.length)
    expect([...renderedValues].sort()).toEqual(Object.values(tokens).sort())
  })
})
