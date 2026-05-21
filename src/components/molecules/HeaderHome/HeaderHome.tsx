'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { UserRoundPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ONBOARDING_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { LANDING_HERO_SECTION_ID } from '@/templates/Public/Landing/Landing.constants';
import { HeaderSocialLinks } from '../Header/Header';
import { HeaderButtonSignIn } from '../HeaderButtonSignIn/HeaderButtonSignIn';

export const HeaderHome = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();
  const t = useTranslations('landing');
  const [showJoinButton, setShowJoinButton] = React.useState(false);

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const heroSection = document.getElementById(LANDING_HERO_SECTION_ID);

    if (!heroSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find(({ target }) => target === heroSection);

        if (entry) {
          setShowJoinButton(!entry.isIntersecting);
        }
      },
      {
        rootMargin: '-30% 0px -35% 0px',
        threshold: 0,
      },
    );

    observer.observe(heroSection);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleJoin = () => {
    router.push(ONBOARDING_ROUTES.HUMAN);
  };

  return (
    <Container className="flex-1 flex-row items-center justify-end" {...props}>
      <HeaderSocialLinks />
      {showJoinButton && (
        <Button id="header-join-btn" variant="brand" onClick={handleJoin} className="mr-3 gap-2">
          <UserRoundPlus className="size-4" />
          {t('join')}
        </Button>
      )}
      <HeaderButtonSignIn />
    </Container>
  );
};
