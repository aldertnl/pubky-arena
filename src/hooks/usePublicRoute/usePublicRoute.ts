'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { isExplorePublicRoute } from '@/app/routes';
import type { UsePublicRouteResult } from './usePublicRoute.types';

export type { UsePublicRouteResult } from './usePublicRoute.types';

/**
 * Hook for checking if the current route is a public browse surface.
 *
 * Includes dynamic public routes (single post, another user's profile) plus
 * /hot and /search for logged-out exploration.
 *
 * This hook only handles route awareness. It does NOT check authentication status.
 * Use this in combination with `useRequireAuth` when you need both.
 */
export function usePublicRoute(): UsePublicRouteResult {
  const pathname = usePathname();

  const isPublicRoute = useMemo(() => isExplorePublicRoute(pathname), [pathname]);

  return { isPublicRoute };
}
