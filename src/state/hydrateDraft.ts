import { expandCombinedThemeFile } from '../domain/opencode/exportTheme'
import { decodeThemeInstallPayload } from '../domain/share/themeInstallCodec'
import { buildSharedDraftId, parseThemeShareLocation } from '../domain/share/themeShareLink'
import { createDraftFromResolvedThemes } from '../domain/theme/createDraftFromResolvedThemes'
import type { ThemeDraft } from '../domain/theme/model'
import { buildThemeNameFromSlug } from '../domain/theme/themeName'
import { loadCurrentDraft } from '../persistence/drafts-db'
import { getSystemPreferredThemeMode } from './systemThemeMode'

export type HydratedDraftSource = 'default' | 'persisted' | 'shared'

export type HydratedDraftResult = {
  draft: ThemeDraft | null
  source: HydratedDraftSource
}

export async function getHydratedDraft() {
  const sharedTheme = parseThemeShareLocation(window.location)
  const persisted = await loadCurrentDraft()

  if (sharedTheme) {
    const sharedDraftId = buildSharedDraftId(sharedTheme)

    if (persisted?.draft.id === sharedDraftId) {
      return {
        draft: persisted.draft,
        source: 'shared',
      } satisfies HydratedDraftResult
    }

    try {
      const decodedTheme = await decodeThemeInstallPayload(sharedTheme.encodedPayload, sharedTheme.themeSlug)

      return {
        draft: createDraftFromResolvedThemes({
          id: sharedDraftId,
          name: buildThemeNameFromSlug(sharedTheme.themeSlug),
          activeMode: getSystemPreferredThemeMode(),
          themes: expandCombinedThemeFile(decodedTheme.themeFile),
        }),
        source: 'shared',
      } satisfies HydratedDraftResult
    } catch {
      // Fall through to persisted state if the hash is invalid.
    }
  }

  return {
    draft: persisted?.draft ?? null,
    source: persisted ? 'persisted' : 'default',
  } satisfies HydratedDraftResult
}
