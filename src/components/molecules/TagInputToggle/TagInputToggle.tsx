'use client';

import { AnimatePresence, motion } from 'motion/react';
import * as Libs from '@/libs';
import type { TagInputToggleProps } from './TagInputToggle.types';

const SUBTLE_ENTER_TRANSITION = { duration: 0.12, ease: 'easeOut' } as const;
const SUBTLE_EXIT_TRANSITION = { duration: 0.12, ease: 'easeInOut' } as const;

export function TagInputToggle({
  showInput,
  inputContent,
  addButtonContent,
  widthByState,
  containerClassName,
  inputWrapperClassName,
  addButtonWrapperClassName,
}: TagInputToggleProps) {
  const currentContent = showInput ? inputContent : addButtonContent;
  if (!currentContent) return null;

  const inputInitial = { opacity: 0.75, scale: 0.99 };
  const inputAnimate = { opacity: 1, scale: 1, transition: SUBTLE_ENTER_TRANSITION };
  const inputExit = { opacity: 0.75, scale: 0.99, transition: SUBTLE_EXIT_TRANSITION };

  const addButtonInitial = { opacity: 0.75, scale: 0.99 };
  const addButtonAnimate = { opacity: 1, scale: 1, transition: SUBTLE_ENTER_TRANSITION };
  const addButtonExit = { opacity: 0.75, scale: 0.99, transition: SUBTLE_EXIT_TRANSITION };

  const toggleContent = (
    <AnimatePresence initial={false}>
      {showInput ? (
        <motion.div
          key="tag-input"
          initial={inputInitial}
          animate={inputAnimate}
          exit={inputExit}
          className={Libs.cn('shrink-0', inputWrapperClassName)}
        >
          {inputContent}
        </motion.div>
      ) : (
        <motion.div
          key="add-button"
          initial={addButtonInitial}
          animate={addButtonAnimate}
          exit={addButtonExit}
          className={Libs.cn('inline-flex h-full w-full items-center justify-center', addButtonWrapperClassName)}
        >
          {addButtonContent}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!widthByState) {
    return toggleContent;
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: showInput ? widthByState.input : widthByState.addButton }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={Libs.cn('overflow-hidden rounded-md border border-dashed border-input shadow-sm', containerClassName)}
    >
      {toggleContent}
    </motion.div>
  );
}
