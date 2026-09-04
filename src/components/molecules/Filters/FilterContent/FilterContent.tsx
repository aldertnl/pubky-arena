'use client';

import { CONTENT, type ContentType } from '@/stores/home/home.types';
import { FilterRadioGroup } from '../FilterRadioGroup/FilterRadioGroup';
import { BaseFilterProps } from '../Filters.types';
import { CONTENT_FILTER_OPTIONS } from './FilterContent.constants';

interface FilterContentProps extends BaseFilterProps<ContentType> {
  disabledTabs?: ContentType[];
}
export function FilterContent({
  selectedTab,
  defaultSelectedTab = CONTENT.ALL,
  onTabChange,
  disabled,
  disabledTabs = [],
}: FilterContentProps) {
  const items = CONTENT_FILTER_OPTIONS.map((item) => ({
    ...item,
    disabled: disabled || disabledTabs.includes(item.key) ? true : undefined,
  }));
  return (
    <FilterRadioGroup
      title={'Content'}
      items={items}
      selectedValue={selectedTab}
      defaultValue={defaultSelectedTab}
      onChange={onTabChange}
    />
  );
}
