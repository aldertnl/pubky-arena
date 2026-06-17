'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/atoms/Container/Container';
import { Typography } from '@/atoms/Typography/Typography';

/**
 * Shared "This collection is empty." message used by the single-collection and
 * bookmarks feeds. Both surfaces are collection-style libraries, so an empty
 * one should read the same — and notably NOT fall through to the generic
 * timeline "No posts found" copy.
 */
export function CollectionEmptyState() {
  const t = useTranslations('collections.single');

  return (
    <Container overrideDefaults data-testid="collection-items-empty" className="w-full">
      <Typography overrideDefaults className="text-center text-base font-medium text-muted-foreground">
        {t('empty')}
      </Typography>
    </Container>
  );
}
