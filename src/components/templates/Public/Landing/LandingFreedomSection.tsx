import type { LucideIcon } from 'lucide-react';
import { Activity, Columns3, PencilLine, Tags } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Container } from '@/atoms/Container/Container';
import { Heading } from '@/atoms/Heading/Heading';
import { Typography } from '@/atoms/Typography/Typography';
import { LANDING_FREEDOM_SECTION_ID } from './Landing.constants';

const FEATURES: Array<{ key: 'creation' | 'browsing' | 'feeds' | 'tagging'; Icon: LucideIcon }> = [
  { key: 'creation', Icon: PencilLine },
  { key: 'browsing', Icon: Columns3 },
  { key: 'feeds', Icon: Activity },
  { key: 'tagging', Icon: Tags },
];

export function LandingFreedomSection() {
  const t = useTranslations('landing.freedom');

  return (
    <section id={LANDING_FREEDOM_SECTION_ID} className="relative z-0 min-h-svh scroll-mt-[48px] py-20 sm:py-24">
      <Container size="container" className="gap-10 px-6">
        <Container className="mx-0 max-w-[760px] gap-5">
          <Typography as="span" size="xs" className="text-brand tracking-[1.2px] uppercase">
            {t('eyebrow')}
          </Typography>
          <Heading level={2} size="xl" className="max-w-[680px] text-4xl sm:text-6xl lg:max-w-none lg:whitespace-nowrap">
            {t.rich('title', {
              highlight: (chunks) => (
                <>
                  <br className="sm:hidden" />
                  <span className="text-brand">{chunks}</span>
                </>
              ),
            })}
          </Heading>
          <Typography size="md" className="max-w-[680px] text-muted-foreground sm:text-xl">
            {t('description')}
          </Typography>
        </Container>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map(({ key, Icon }) => (
            <article key={key} className="flex items-start gap-5 rounded-md bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand">
                <Icon className="size-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <Typography as="h3" size="lg" className="text-xl">
                  {t(`features.${key}.title`)}
                </Typography>
                <Typography size="md" className="mt-1 text-muted-foreground">
                  {t(`features.${key}.description`)}
                </Typography>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
