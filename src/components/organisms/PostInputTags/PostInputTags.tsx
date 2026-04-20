'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import { POST_MAX_TAGS } from '@/config';
import type { PostInputTagsProps } from './PostInputTags.types';

export function PostInputTags({ tags, onTagsChange, maxTags = POST_MAX_TAGS, disabled = false }: PostInputTagsProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);

  const isAtLimit = tags.length >= maxTags;
  const isDisabled = disabled || isAtLimit;

  const handleTagAdd = (tag: string) => {
    // Duplicate check is handled by useTagInput internally
    onTagsChange([...tags, tag]);
  };

  const handleInputBlur = () => {
    // Will be called by TagInput when input loses focus and is empty
    setIsAddingTag(false);
  };

  const handleCloseInput = () => {
    setIsAddingTag(false);
  };

  return (
    <Atoms.Container overrideDefaults className="flex flex-col gap-1">
      <Atoms.Container overrideDefaults className="flex flex-wrap items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {/* Add tag input - keep visible but disabled during loading */}
          {isAddingTag ? (
            <motion.div
              key="tag-input"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              className="shrink-0"
            >
              <Molecules.TagInput
                onTagAdd={handleTagAdd}
                existingTags={tags.map((tag) => ({ label: tag }))}
                showCloseButton={!disabled}
                onClose={handleCloseInput}
                disabled={disabled}
                maxTags={maxTags}
                currentTagsCount={tags.length}
                onBlur={disabled ? undefined : handleInputBlur}
                enableApiSuggestions
                excludeFromApiSuggestions={tags}
                addOnSuggestionClick
                className="w-42 shrink-0"
              />
            </motion.div>
          ) : (
            /* Add button - disabled when at limit or disabled */
            <motion.div key="add-button" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} exit={{ opacity: 0.5 }}>
              <Molecules.PostTagAddButton
                onClick={() => {
                  setIsAddingTag(true);
                }}
                disabled={isDisabled}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Atoms.Container>
    </Atoms.Container>
  );
}
