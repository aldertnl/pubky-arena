import { PageHeader } from '@/atoms/PageHeader/PageHeader';
import { PageSubtitle } from '@/atoms/PageSubtitle/PageSubtitle';
import { PageTitle } from '@/molecules/Page/Page';

export const TagsOfInterestHeader = () => {
  return (
    <PageHeader>
      <PageTitle size="large">
        {'Tags of '}
        <span className="text-brand">{'interest.'}</span>
      </PageTitle>
      <PageSubtitle>{'Select topics to get suggestions on who to follow.'}</PageSubtitle>
    </PageHeader>
  );
};
