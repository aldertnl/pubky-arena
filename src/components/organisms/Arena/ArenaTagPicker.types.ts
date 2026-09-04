import { z } from 'zod';
import { TAG_MAX_LENGTH } from '@/config/posts';
import { isValidTagLabel } from '@/libs/utils/utils';
import type { NexusHotTag } from '@/services/nexus/nexus.types';

export const arenaTagSchema = z.object({
  tag: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidTagLabel, {
      message: `Enter a tag of up to ${TAG_MAX_LENGTH} characters, without spaces, commas, or colons.`,
    }),
});

export type ArenaTagForm = z.infer<typeof arenaTagSchema>;

export interface ArenaTagPickerProps {
  topic?: string;
  topics: NexusHotTag[];
  timeframeLabel: string;
  onTopic: (topic: string) => void;
}
