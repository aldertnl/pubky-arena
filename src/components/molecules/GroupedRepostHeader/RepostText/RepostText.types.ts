export interface RepostTextProps {
  /** Translation template containing NAME_TOKEN placeholder */
  template: string;
  /** The name to display (pre-truncated by caller for mobile/desktop breakpoints) */
  name: string;
}
