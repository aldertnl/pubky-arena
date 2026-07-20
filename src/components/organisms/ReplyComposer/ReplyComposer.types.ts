import type { PostInputProps } from '@/organisms/PostInput/PostInput.types';

export interface ReplyComposerProps {
  postId: string;
  resetKey: number;
  onSuccess: (replyId: string) => void;
  onContentChange: NonNullable<PostInputProps['onContentChange']>;
  presentation?: 'dialog' | 'page';
}
