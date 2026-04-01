import { Container } from '@/atoms/Container';
import { SinglePostParticipants } from '../SinglePostParticipants';

import { SinglePostDrawerProps } from './SinglePostDrawer.types';

export const SinglePostDrawer = ({ postId }: SinglePostDrawerProps) => {
  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      <SinglePostParticipants postId={postId} />
    </Container>
  );
};
