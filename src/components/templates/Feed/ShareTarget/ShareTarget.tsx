'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Organisms from '@/organisms';
import * as Libs from '@/libs';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';
import { APP_ROUTES } from '@/app/routes';

export function ShareTarget() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('share');
  const { isFullyAuthenticated, isLoading: isAuthLoading } = Hooks.useAuthStatus();
  const { requireAuth } = Hooks.useRequireAuth();

  const [initialContent, setInitialContent] = useState('');
  const [initialAttachments, setInitialAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compose content from URL search params and retrieve cached files
  useEffect(() => {
    const title = searchParams.get('title') ?? undefined;
    const text = searchParams.get('text') ?? undefined;
    const url = searchParams.get('url') ?? undefined;
    const hasFiles = searchParams.get('hasFiles') === 'true';

    const content = Libs.composeShareContent({ title, text, url });
    setInitialContent(content);

    if (hasFiles) {
      Libs.getSharedFiles()
        .then((files) => {
          if (files.length > 0) {
            setInitialAttachments(files);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleSuccess = useCallback(() => {
    router.push(APP_ROUTES.HOME);
  }, [router]);

  const handleCancel = useCallback(() => {
    router.push(APP_ROUTES.HOME);
  }, [router]);

  const handleSignIn = useCallback(() => {
    requireAuth(() => {
      // After sign-in, the user stays on this page with the shared content
    });
  }, [requireAuth]);

  // Show loading while checking auth or loading shared content
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Atoms.Spinner />
      </div>
    );
  }

  // Unauthenticated: show sign-in prompt with content preview
  if (!isFullyAuthenticated) {
    return (
      <Organisms.ContentLayout>
        <Atoms.Container className="mx-auto w-full max-w-2xl gap-6 p-4">
          <Atoms.Container className="flex-row items-center justify-between" overrideDefaults>
            <Atoms.Typography as="h2" size="lg">
              {t('title')}
            </Atoms.Typography>
            <Atoms.Button variant="ghost" size="sm" onClick={handleCancel}>
              {t('cancel')}
            </Atoms.Button>
          </Atoms.Container>

          <Atoms.Container className="gap-4 rounded-lg border border-border p-4">
            <Atoms.Typography as="p" className="text-muted-foreground">
              {t('signInRequired')}
            </Atoms.Typography>

            {/* Preview of shared content */}
            {initialContent && (
              <Atoms.Container className="rounded-md bg-muted p-3">
                <Atoms.Typography as="p" className="line-clamp-4 whitespace-pre-wrap text-sm">
                  {initialContent}
                </Atoms.Typography>
              </Atoms.Container>
            )}

            {initialAttachments.length > 0 && (
              <Atoms.Typography as="p" className="text-sm text-muted-foreground">
                {t('attachmentsCount', { count: initialAttachments.length })}
              </Atoms.Typography>
            )}

            <Atoms.Button onClick={handleSignIn} className="w-full">
              {t('signIn')}
            </Atoms.Button>
          </Atoms.Container>
        </Atoms.Container>
      </Organisms.ContentLayout>
    );
  }

  // Authenticated: show the post input
  return (
    <Organisms.ContentLayout>
      <Atoms.Container className="mx-auto w-full max-w-2xl gap-4 p-4">
        <Atoms.Container className="flex-row items-center justify-between" overrideDefaults>
          <Atoms.Typography as="h2" size="lg">
            {t('title')}
          </Atoms.Typography>
          <Atoms.Button variant="ghost" size="sm" onClick={handleCancel}>
            {t('cancel')}
          </Atoms.Button>
        </Atoms.Container>

        <Organisms.PostInput
          dataCy="share-target-post-input"
          variant={POST_INPUT_VARIANT.POST}
          expanded={true}
          onSuccess={handleSuccess}
          initialContent={initialContent}
          initialAttachments={initialAttachments.length > 0 ? initialAttachments : undefined}
        />
      </Atoms.Container>
    </Organisms.ContentLayout>
  );
}
