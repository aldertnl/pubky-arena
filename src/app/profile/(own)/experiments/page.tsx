'use client';

import * as Atoms from '@/atoms';
import * as Core from '@/core';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import * as Organisms from '@/organisms';

export default function ProfileExperimentsPage() {
  const { privacy } = Core.useSettingsStore();
  const { setShowMusicLibraryProfileSummary } = Hooks.useSettingsActions();
  const {
    items,
    draft,
    consent,
    error,
    isLoading,
    isSaving,
    isUpdatingConsent,
    setDraftField,
    addDraftAsItem,
    removeItem,
    clearDraft,
    setConsent,
    refresh,
  } = Hooks.useMusicLibrary();

  return (
    <Atoms.Container className="mt-6 gap-4 lg:mt-0">
      <Atoms.Card className="gap-4">
        <Atoms.CardHeader className="gap-3">
          <Atoms.Container overrideDefaults={true} className="flex min-w-0 items-start gap-3 sm:items-center">
            <Atoms.Container
              overrideDefaults={true}
              className="flex size-12 items-center justify-center rounded-full bg-brand/12"
            >
              <Libs.FlaskConical className="size-6 text-brand" />
            </Atoms.Container>
            <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
              <Atoms.Typography as="h1" size="2xl" className="break-words">
                Experiments
              </Atoms.Typography>
              <Atoms.Typography as="p" className="break-words text-sm text-muted-foreground">
                Hackathon features live here first so the main profile navigation stays stable.
              </Atoms.Typography>
            </Atoms.Container>
          </Atoms.Container>
        </Atoms.CardHeader>
      </Atoms.Card>

      <Atoms.Card>
        <Atoms.CardHeader className="gap-3">
          <Atoms.Container
            overrideDefaults={true}
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
              <Atoms.CardTitle>Music Snapshot Sidebar</Atoms.CardTitle>
              <Atoms.CardDescription className="break-words">
                Toggle the `MusicLibraryProfileSummary` shown in the right profile sidebar.
              </Atoms.CardDescription>
            </Atoms.Container>
            <Atoms.Switch
              aria-label="Show music snapshot in right sidebar"
              checked={privacy.showMusicLibraryProfileSummary}
              onCheckedChange={(checked) => void setShowMusicLibraryProfileSummary(checked)}
              className="shrink-0"
            />
          </Atoms.Container>
        </Atoms.CardHeader>
        <Atoms.CardContent className="pt-0">
          <Atoms.Typography as="p" className="break-words text-sm text-muted-foreground">
            Turn this on to show the music snapshot in the desktop profile sidebar, or off to hide it.
          </Atoms.Typography>
        </Atoms.CardContent>
      </Atoms.Card>

      {error ? (
        <Atoms.Card className="gap-0 border-destructive/40 bg-destructive/5">
          <Atoms.CardContent className="pt-6">
            <Atoms.Typography as="p" className="text-sm font-medium text-destructive">
              {error}
            </Atoms.Typography>
          </Atoms.CardContent>
        </Atoms.Card>
      ) : null}

      <Organisms.MusicLibraryList
        items={items}
        isLoading={isLoading}
        isSaving={isSaving}
        onRefreshAction={() => void refresh()}
        onDeleteAction={(id) => void removeItem(id)}
      >
        <Organisms.MusicLibraryForm
          draft={draft}
          isLoading={isLoading}
          isSaving={isSaving}
          onDraftFieldChange={setDraftField}
          onSubmitAction={() => void addDraftAsItem()}
          onResetAction={clearDraft}
        />
      </Organisms.MusicLibraryList>

      <Organisms.MusicLibraryConsent
        consent={consent}
        isSaving={isUpdatingConsent}
        onConsentChangeAction={setConsent}
      />
    </Atoms.Container>
  );
}
