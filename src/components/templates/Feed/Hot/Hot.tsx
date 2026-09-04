'use client';

import { Arena } from '@/organisms/Arena/Arena';
import { ContentLayout } from '@/organisms/ContentLayout/ContentLayout';

export function Hot() {
  return (
    <ContentLayout
      showLeftSidebar={false}
      showRightSidebar={false}
      showLeftMobileButton={false}
      showRightMobileButton={false}
      hasGradientBackground={false}
      className="overflow-visible pb-24 lg:pb-12"
      classNameWrapperContent="gap-0 lg:overflow-visible"
      disableWideShellLayout
    >
      <Arena />
    </ContentLayout>
  );
}
