import { type IconName, iconNames } from 'lucide-react/dynamic.js';

export const LUCIDE_ICON_NAMES: readonly IconName[] = iconNames;

const LUCIDE_ICON_NAME_SET = new Set<string>(LUCIDE_ICON_NAMES);

export function isLucideIconName(name: string | null | undefined): name is IconName {
  return typeof name === 'string' && LUCIDE_ICON_NAME_SET.has(name);
}
