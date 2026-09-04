'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

type TagCountMode = 'labels' | 'applications';
const PostTagCountContext = createContext<TagCountMode>('labels');

/** Keeps a ranking surface's score and its native post action count consistent. */
export function PostTagCountProvider({ mode, children }: PropsWithChildren<{ mode: TagCountMode }>) {
  return <PostTagCountContext.Provider value={mode}>{children}</PostTagCountContext.Provider>;
}

export function usePostTagCountMode() {
  return useContext(PostTagCountContext);
}
