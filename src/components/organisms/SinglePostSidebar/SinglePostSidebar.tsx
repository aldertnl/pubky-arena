import { Container } from '@/atoms/Container';
import { FeedbackCard } from '@/organisms/FeedbackCard';
import { SinglePostParticipants } from '../SinglePostParticipants';

import { SinglePostSidebarProps } from './SinglePostSidebar.types';

export const SinglePostSidebar = ({ postId }: SinglePostSidebarProps) => {
  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      <SinglePostParticipants postId={postId} />
      <FeedbackCard />
    </Container>
  );
};
