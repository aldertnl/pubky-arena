import type * as React from 'react';

export interface TagInputToggleProps {
  /** Whether the input state is active (otherwise the add button state is shown). */
  showInput: boolean;
  /** Content rendered for the input state. */
  inputContent?: React.ReactNode;
  /** Content rendered for the add button state. */
  addButtonContent?: React.ReactNode;
  /** Optional fixed widths (px) for input and add button states. */
  widthByState?: {
    input: number;
    addButton: number;
  };
  /** Optional className applied to the outer wrapper container. */
  containerClassName?: string;
  /** Optional className applied to the input state wrapper. */
  inputWrapperClassName?: string;
  /** Optional className applied to the add button state wrapper. */
  addButtonWrapperClassName?: string;
}
