import { redirect } from 'next/navigation';

export default async function DynamicProfileExperimentsPage({ params }: { params: Promise<{ pubky: string }> }) {
  const { pubky } = await params;

  redirect(`/profile/${pubky}/posts`);
}
