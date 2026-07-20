import { buildCompositeId } from '@/models/models.utils';
import { ReplyPage } from '@/templates/Post/Reply/ReplyPage';

interface PostReplyPageProps {
  params: Promise<{
    userId: string;
    postId: string;
  }>;
}

export default async function PostReplyPage({ params }: PostReplyPageProps) {
  const { userId, postId } = await params;
  const compositeId = buildCompositeId({ pubky: userId, id: postId });

  return <ReplyPage postId={compositeId} />;
}
