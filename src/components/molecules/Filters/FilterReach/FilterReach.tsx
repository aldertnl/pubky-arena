'use client';

import * as React from 'react';
import { HeartHandshake, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UsersRound2 } from '@/icons';
import { REACH, type ReachType } from '@/stores/home/home.types';
import { FilterRadioGroup } from '../FilterRadioGroup/FilterRadioGroup';
import { BaseFilterProps } from '../Filters.types';

export type FilterReachProps = BaseFilterProps<ReachType> & {
  /**
   * Disable specific reach options (e.g. following/friends when logged out on Hot).
   * Combined with `disabled`: an item is disabled if either applies.
   */
  disabledReachKeys?: readonly ReachType[];
};

export function FilterReach({
  selectedTab,
  defaultSelectedTab = REACH.ALL,
  onTabChange,
  disabled,
  disabledReachKeys,
}: FilterReachProps) {
  const t = useTranslations('filters.reach');
  const items = React.useMemo(() => {
    const disabledReachSet = new Set(disabledReachKeys ?? []);
    const itemDisabled = (key: ReachType) => Boolean(disabled) || disabledReachSet.has(key);
    return [
      {
        key: REACH.ALL,
        label: t('all'),
        icon: Radio,
        ...(itemDisabled(REACH.ALL) ? { disabled: true as const } : {}),
      },
      {
        key: REACH.FOLLOWING,
        label: t('following'),
        icon: UsersRound2,
        ...(itemDisabled(REACH.FOLLOWING) ? { disabled: true as const } : {}),
      },
      {
        key: REACH.FRIENDS,
        label: t('friends'),
        icon: HeartHandshake,
        ...(itemDisabled(REACH.FRIENDS) ? { disabled: true as const } : {}),
      },
    ];
  }, [t, disabled, disabledReachKeys]);
  return (
    <FilterRadioGroup
      title={t('title')}
      items={items}
      selectedValue={selectedTab}
      defaultValue={defaultSelectedTab}
      onChange={onTabChange}
      testId="filter-reach-radiogroup"
      dataCy="filter-reach-radiogroup"
    />
  );
}
