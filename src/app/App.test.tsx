import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultThemeDraft } from '../domain/theme/createDefaultThemeDraft'
import { clearThemeShareLocation } from '../domain/share/themeShareLink'
import { saveCurrentDraft } from '../persistence/drafts-db'
import { getHydratedDraft } from '../state/hydrateDraft'
import { App } from './App'

vi.mock('../state/hydrateDraft', () => ({
  getHydratedDraft: vi.fn(),
}))

vi.mock('../persistence/drafts-db', () => ({
  saveCurrentDraft: vi.fn(),
}))

vi.mock('../domain/share/themeShareLink', () => ({
  clearThemeShareLocation: vi.fn(),
}))

vi.mock('../state/persistence', () => ({
  DraftPersistenceBoundary: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('./ThemeEditorPage', () => ({
  ThemeEditorPage: ({ startupSource }: { startupSource?: string | null }) => (
    <div data-testid="theme-editor-page">{startupSource ?? 'pending'}</div>
  ),
}))

function createDeferredPromise() {
  let resolvePromise: () => void = () => {}
  let rejectPromise: (reason?: unknown) => void = () => {}

  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  }
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('App', () => {
  it('persists shared drafts before clearing the share url', async () => {
    const sharedDraft = createDefaultThemeDraft()
    const saveDeferred = createDeferredPromise()

    vi.mocked(getHydratedDraft).mockResolvedValue({
      draft: sharedDraft,
      source: 'shared',
    })
    vi.mocked(saveCurrentDraft).mockReturnValue(saveDeferred.promise)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('theme-editor-page')).toHaveTextContent('shared')
    })

    expect(saveCurrentDraft).toHaveBeenCalledWith(sharedDraft)
    expect(clearThemeShareLocation).not.toHaveBeenCalled()

    saveDeferred.resolve()

    await waitFor(() => {
      expect(clearThemeShareLocation).toHaveBeenCalledOnce()
    })
  })

  it('keeps the share url intact when saving the shared draft fails', async () => {
    vi.mocked(getHydratedDraft).mockResolvedValue({
      draft: createDefaultThemeDraft(),
      source: 'shared',
    })
    vi.mocked(saveCurrentDraft).mockRejectedValue(new Error('save failed'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('theme-editor-page')).toHaveTextContent('shared')
    })

    await waitFor(() => {
      expect(saveCurrentDraft).toHaveBeenCalledOnce()
    })

    expect(clearThemeShareLocation).not.toHaveBeenCalled()
  })
})
