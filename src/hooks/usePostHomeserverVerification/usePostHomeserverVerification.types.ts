export type PostHomeserverVerificationStatus = 'idle' | 'checking' | 'verified' | 'not_found' | 'error';

export type UsePostHomeserverVerificationResult = {
  status: PostHomeserverVerificationStatus;
  verify: () => Promise<void>;
  isVerified: boolean;
};
