import type { SnapshotSerializer } from 'vitest';
import { RADIX_ID_REGEX, RADIX_ID_TEST_REGEX } from './utils.constants';

/**
 * Vitest snapshot serializer that normalizes Radix UI generated IDs.
 * Replaces dynamic Radix IDs (e.g., "radix-_r_12345") with a normalized placeholder.
 *
 * @see https://github.com/pubky/pubky-app/issues/1101
 *
 * @example
 * // In test setup (e.g., vitest.setup.ts):
 * import { radixIdSerializer } from '@/libs/utils/radixIdSerializer';
 * expect.addSnapshotSerializer(radixIdSerializer);
 */
export const radixIdSerializer: SnapshotSerializer = {
  test: (val): val is string => typeof val === 'string' && RADIX_ID_TEST_REGEX.test(val),
  serialize: (val, config, indentation, depth, refs, printer) => {
    const normalized = (val as string).replace(RADIX_ID_REGEX, 'radix-normalized');
    return printer(normalized, config, indentation, depth, refs);
  },
};
