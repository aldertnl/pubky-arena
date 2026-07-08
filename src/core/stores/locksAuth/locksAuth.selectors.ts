import { ZustandGet } from '../stores.types';
import { LocksAuthStore } from './locksAuth.types';

export const createLocksAuthSelectors = (get: ZustandGet<LocksAuthStore>) => ({
  /** Authenticated to the Lock Server when a live session is held. */
  selectIsLocksAuthenticated: () => get().session !== null,
  selectLocksSession: () => get().session,
  selectLocksSessionSecret: () => get().locksSessionSecret,
});
