import { useEffect, useState } from 'react'
import { clearThemeShareLocation } from '../domain/share/themeShareLink'
import { saveCurrentDraft } from '../persistence/drafts-db'
import { getHydratedDraft } from '../state/hydrateDraft'
import { DraftPersistenceBoundary } from '../state/persistence'
import { ThemeStoreProvider } from '../state/theme-store'
import { useThemeStoreActions } from '../state/theme-store-hooks'
import { ThemeEditorPage } from './ThemeEditorPage'

function AppContent() {
  const { hydrateDraft } = useThemeStoreActions()
  const [startupSource, setStartupSource] = useState<Awaited<ReturnType<typeof getHydratedDraft>>['source'] | null>(null)

  useEffect(() => {
    void getHydratedDraft().then(async ({ draft, source }) => {
      setStartupSource(source)

      if (draft) {
        hydrateDraft(draft)
      }

      if (source === 'shared' && draft) {
        try {
          await saveCurrentDraft(draft)
          clearThemeShareLocation()
        } catch {
          return
        }
      }
    })
  }, [hydrateDraft])

  return (
    <DraftPersistenceBoundary>
      <ThemeEditorPage startupSource={startupSource} />
    </DraftPersistenceBoundary>
  )
}

export function App() {
  return (
    <ThemeStoreProvider>
      <AppContent />
    </ThemeStoreProvider>
  )
}
