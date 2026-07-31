'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/app/routes';
import { FeedController } from '@/controllers/feed/feed';
import { useToast } from '@/molecules/Toaster/use-toast';
import type { CustomFeedFormValues, UseCustomFeedFormParams } from './useCustomFeedForm.types';

export function useCustomFeedForm({ mode, feed }: UseCustomFeedFormParams) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const tDialog = useTranslations('dialogs.customFeed');
  const { toast } = useToast();

  const submit = async (values: CustomFeedFormValues): Promise<boolean> => {
    if (loading || (mode === 'edit' && !feed)) return false;

    setLoading(true);

    try {
      if (mode === 'create') {
        const createdFeed = await FeedController.commitCreate({
          ...values,
          content: values.content === 'ALL' ? null : values.content,
        });

        toast({
          title: tDialog('feedCreated', {
            name: createdFeed.name,
          }),
        });
        router.push(`${APP_ROUTES.FEED}/${createdFeed.id}`);

        return true;
      }

      if (!feed) return false;

      const currentFeedHref = `${APP_ROUTES.FEED}/${feed.id}`;
      const updatedFeed = await FeedController.commitUpdate({
        feedId: feed.id,
        changes: {
          ...values,
          content: values.content === 'ALL' ? null : values.content,
        },
      });

      toast({
        title: tDialog('feedEdited', {
          name: updatedFeed.name,
        }),
      });

      if (pathname === currentFeedHref && updatedFeed.id !== feed.id) {
        router.replace(`${APP_ROUTES.FEED}/${updatedFeed.id}`);
      }

      return true;
    } catch {
      toast({
        variant: 'error',
        description: mode === 'create' ? tDialog('feedCreateError') : tDialog('feedEditError'),
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFeed = async (): Promise<boolean> => {
    if (loading || mode !== 'edit' || !feed) return false;

    setLoading(true);

    try {
      const currentFeedHref = `${APP_ROUTES.FEED}/${feed.id}`;

      await FeedController.commitDelete({
        feedId: feed.id,
      });
      toast({
        title: tDialog('feedDeleted', {
          name: feed.name,
        }),
      });

      if (pathname === currentFeedHref) {
        router.replace(APP_ROUTES.HOME);
      }

      return true;
    } catch {
      toast({
        variant: 'error',
        description: tDialog('feedDeleteError'),
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submit,
    deleteFeed,
  };
}
