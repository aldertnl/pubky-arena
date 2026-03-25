import * as Atoms from '@/atoms';
import * as Organisms from '@/organisms';
import { SinglePostParticipants } from '../SinglePostParticipants';

import { SinglePostSidebarProps } from './SinglePostSidebar.types';

export const SinglePostSidebar = ({ postId }: SinglePostSidebarProps) => {
  return (
    <Atoms.Container overrideDefaults className="flex flex-col gap-6">
      <SinglePostParticipants postId={postId} />
      <Organisms.FeedbackCard />
    </Atoms.Container>
  );
};
