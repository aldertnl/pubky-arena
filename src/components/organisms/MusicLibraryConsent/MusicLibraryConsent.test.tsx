import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MusicLibraryConsent } from './MusicLibraryConsent';

describe('MusicLibraryConsent', () => {
  it('renders required consent copy', () => {
    render(
      <MusicLibraryConsent
        consent={{ marketingEnabled: false, buyerSharingEnabled: false }}
        onConsentChangeAction={vi.fn()}
      />,
    );

    expect(screen.getByText('Music Library Consent')).toBeInTheDocument();
    expect(
      screen.getByText(/External recommendation, advertising, or buyer access is blocked until you opt in\./),
    ).toBeInTheDocument();
    expect(screen.getByText('Consent can be revoked anytime')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });

  it('disables buyer sharing until marketing consent is enabled', () => {
    render(
      <MusicLibraryConsent
        consent={{ marketingEnabled: false, buyerSharingEnabled: false }}
        onConsentChangeAction={vi.fn()}
      />,
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeDisabled();
  });

  it('calls the change handler when toggles are clicked', () => {
    const onConsentChangeAction = vi.fn();

    render(
      <MusicLibraryConsent
        consent={{ marketingEnabled: true, buyerSharingEnabled: false }}
        onConsentChangeAction={onConsentChangeAction}
      />,
    );

    const switches = screen.getAllByRole('switch');

    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);

    expect(onConsentChangeAction).toHaveBeenCalledWith('buyerSharingEnabled', true);
    expect(onConsentChangeAction).toHaveBeenCalledWith('marketingEnabled', false);
  });
});
