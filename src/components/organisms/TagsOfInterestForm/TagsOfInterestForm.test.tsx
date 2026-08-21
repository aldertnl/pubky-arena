import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ROUTES, ONBOARDING_ROUTES } from '@/app/routes';
import { STARTER_PACK_MAX_TAGS } from '@/config/nexus';
import { useOnboardingStore } from '@/stores/onboarding/onboarding.store';
import { TagsOfInterestForm } from './TagsOfInterestForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const ACTIVE_PUBKY = 'form-test-pubky';
vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: { currentUserPubky: string | null }) => unknown) =>
    selector({ currentUserPubky: ACTIVE_PUBKY }),
}));

const POPULAR_TAGS = ['bitcoin', 'art', 'music'];
vi.mock('@/hooks/useHotTags/useHotTags', () => ({
  useHotTags: vi.fn(() => ({
    tags: POPULAR_TAGS.map((name) => ({ name, count: 10 })),
    rawTags: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/molecules/TagInput/TagInput', () => ({
  TagInput: ({
    onTagAdd,
    currentTagsCount,
    maxTags,
  }: {
    onTagAdd: (tag: string) => void;
    currentTagsCount?: number;
    maxTags?: number;
  }) => (
    <input
      data-testid="tag-input"
      data-current-count={currentTagsCount}
      data-max-tags={maxTags}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onTagAdd((e.target as HTMLInputElement).value);
        }
      }}
    />
  ),
}));

describe('TagsOfInterestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.setState({
      hasHydrated: true,
      interestTags: [],
      experienceCompletedByPubky: {},
    });
  });

  it('renders the illustration, both sections, the tag input, and navigation', () => {
    render(<TagsOfInterestForm />);

    expect(screen.getByAltText('Tags of interest')).toBeInTheDocument();
    expect(screen.getByText('Popular interests')).toHaveTextContent('Popular interests (0 selected)');
    expect(screen.getByText('Select which topics you find interesting.')).toBeInTheDocument();
    expect(screen.getByText('Your interests')).toBeInTheDocument();
    expect(screen.getByText('Add other topics you like.')).toBeInTheDocument();
    const tagInput = screen.getByTestId('tag-input');
    expect(tagInput).toHaveAttribute('data-max-tags', String(STARTER_PACK_MAX_TAGS));
    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('seeds the selection from the persisted store tags', () => {
    useOnboardingStore.setState({ interestTags: ['bitcoin', 'satoshi'] });

    render(<TagsOfInterestForm />);

    expect(screen.getByTestId('popular-tag-bitcoin')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('interest-tag-satoshi')).toBeInTheDocument();
    expect(screen.getByText('Popular interests')).toHaveTextContent('Popular interests (1 selected)');
  });

  it('sanitizes an invalid persisted seed instead of trusting it', () => {
    useOnboardingStore.setState({ interestTags: [' Bitcoin ', 'bitcoin', 'bad tag', 'a'.repeat(21)] });

    render(<TagsOfInterestForm />);

    expect(screen.getByTestId('popular-tag-bitcoin')).toHaveAttribute('aria-pressed', 'true');
    expect(useOnboardingStore.getState().interestTags).toEqual(['bitcoin']);
  });

  it('syncs every selection change to the store without navigating', () => {
    render(<TagsOfInterestForm />);

    fireEvent.click(screen.getByTestId('popular-tag-art'));

    expect(useOnboardingStore.getState().interestTags).toEqual(['art']);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves the selection when navigating Back to the profile step', () => {
    render(<TagsOfInterestForm />);

    fireEvent.click(screen.getByTestId('popular-tag-bitcoin'));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(mockPush).toHaveBeenCalledWith(ONBOARDING_ROUTES.PROFILE);
    const state = useOnboardingStore.getState();
    expect(state.interestTags).toEqual(['bitcoin']);
    expect(state.experienceCompletedByPubky[ACTIVE_PUBKY]).toBeUndefined();
  });

  it('marks completion and navigates home on Continue', () => {
    render(<TagsOfInterestForm />);

    fireEvent.click(screen.getByTestId('popular-tag-bitcoin'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    const state = useOnboardingStore.getState();
    expect(state.interestTags).toEqual(['bitcoin']);
    expect(state.experienceCompletedByPubky[ACTIVE_PUBKY]).toBe(true);
    expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.HOME);
  });
});
