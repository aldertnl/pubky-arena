import * as Atoms from '@/atoms';
import { SinglePostParticipants } from '../SinglePostParticipants';

import { SinglePostDrawerProps } from './SinglePostDrawer.types';

export const SinglePostDrawer = ({ postId }: SinglePostDrawerProps) => {
  return (
    <Atoms.Container overrideDefaults className="flex flex-col gap-6">
      <SinglePostParticipants postId={postId} />
    </Atoms.Container>
  );
};
