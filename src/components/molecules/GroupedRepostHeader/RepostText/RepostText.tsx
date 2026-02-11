import * as Atoms from '@/atoms';
import { NAME_TOKEN } from './RepostText.constants';
import type { RepostTextProps } from './RepostText.types';

/**
 * RepostText
 *
 * Renders [prefix][name][suffix] by splitting the template on NAME_TOKEN and injecting the name.
 * The caller pre-truncates the name (e.g. 5 chars mobile, 15 chars desktop); this component does not truncate.
 * Ensures non-breaking space before suffix when suffix does not start with comma.
 *
 * Used by GroupedRepostHeader with different templates and name lengths per breakpoint:
 *
 * | Breakpoint | Template               | Name length | Example (short name)           | Example (long name)                  |
 * |------------|------------------------|-------------|--------------------------------|--------------------------------------|
 * | < 640px    | mobileReposted         | 5 chars     | "Alice, others reposted"        | "Al..., others reposted"             |
 * | 640–768px  | mobileReposted         | 15 chars    | "Alice, others reposted"        | "AliceWithVeryL..., others reposted" |
 * | ≥ 768px    | youAndOthersReposted  | 15 chars    | "Alice and 2 others reposted this" | "AliceWithVeryL... and 2 others reposted this" |
 * | single     | singleReposted        | 15 chars    | "Alice reposted"                | "AliceWithVeryL... reposted"         |
 *
 * Template format: translation returns string with NAME_TOKEN (e.g. "__REPOSTER_NAME__ reposted").
 * Comma suffixes (e.g. "Alice, others reposted") get no leading space; others get \u00A0 before suffix.
 */
export function RepostText({ template, name }: RepostTextProps) {
  const [prefix = '', suffix = ''] = template.split(NAME_TOKEN);
  const suffixText = suffix.startsWith(',') ? suffix : suffix.trimStart();

  return (
    <>
      {prefix}
      <Atoms.Typography
        as="span"
        className="shrink-0 text-base leading-6 font-bold text-foreground"
        overrideDefaults
        data-testid="repost-text-name"
      >
        {name}
      </Atoms.Typography>
      {suffixText && (
        <>
          {!suffix.startsWith(',') && '\u00A0'}
          <Atoms.Typography
            as="span"
            className="shrink-0 text-base leading-6 font-bold text-foreground"
            overrideDefaults
          >
            {suffixText}
          </Atoms.Typography>
        </>
      )}
    </>
  );
}
