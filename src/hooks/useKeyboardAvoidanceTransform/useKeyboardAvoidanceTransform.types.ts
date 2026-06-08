import type { CSSProperties } from 'react';

export interface UseKeyboardAvoidanceTransformOptions {
  /**
   * Minimum space to keep between the element bottom and the visual viewport bottom.
   * Default: 16px.
   */
  bottomMargin?: number;
  /**
   * Height difference needed to treat the visual viewport shrink as a keyboard.
   * Default: 150px.
   */
  threshold?: number;
}

export interface UseKeyboardAvoidanceTransformResult {
  isKeyboardVisible: boolean;
  keyboardAvoidanceOffset: number;
  keyboardAvoidanceStyle: CSSProperties | undefined;
}
