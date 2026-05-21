import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ONBOARDING_ROUTES } from '@/app/routes';
import { HeaderHome } from './HeaderHome';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({ join: 'Join' })[key] ?? key,
}));

// Mock molecules
vi.mock('@/molecules/Header/Header', () => {
  return {
    HeaderSocialLinks: () => <div data-testid="header-social-links">Social Links</div>,
  };
});

vi.mock('@/molecules/HeaderButtonSignIn/HeaderButtonSignIn', () => {
  return {
    HeaderButtonSignIn: () => <button data-testid="header-button-sign-in">Sign in</button>,
  };
});

vi.mock('@/atoms/Button/Button', () => {
  return {
    Button: ({
      children,
      id,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      id?: string;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <button id={id} data-testid={id} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

// Mock atoms
vi.mock('@/atoms/Container/Container', () => {
  return {
    Container: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  };
});

describe('HeaderHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    vi.stubGlobal('IntersectionObserver', undefined);
  });

  it('renders social links and sign in button', () => {
    render(<HeaderHome />);

    expect(screen.getByTestId('header-social-links')).toBeInTheDocument();
    expect(screen.getByTestId('header-button-sign-in')).toBeInTheDocument();
    expect(screen.queryByTestId('header-join-btn')).not.toBeInTheDocument();
  });

  it('applies correct container classes', () => {
    const { container } = render(<HeaderHome />);
    const containerElement = container.firstChild as HTMLElement;

    expect(containerElement).toHaveClass('flex-1', 'flex-row', 'items-center', 'justify-end');
  });

  it('passes through additional props', () => {
    render(<HeaderHome data-testid="custom-header-home" className="custom-class" />);

    const container = screen.getByTestId('custom-header-home');
    expect(container).toHaveClass('custom-class');
  });

  it('shows join button when the hero landing section is no longer active', () => {
    const observedElements: Element[] = [];
    let observerCallback: IntersectionObserverCallback | undefined;

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe(element: Element) {
        observedElements.push(element);
      }

      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    document.body.innerHTML = '<section id="landing-hero-section"></section>';

    render(<HeaderHome />);

    expect(observedElements).toHaveLength(1);
    expect(screen.queryByTestId('header-join-btn')).not.toBeInTheDocument();

    act(() => {
      observerCallback?.(
        [
          {
            target: observedElements[0] as Element,
            isIntersecting: false,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    const joinButton = screen.getByTestId('header-join-btn');
    expect(joinButton).toHaveTextContent('Join');

    fireEvent.click(joinButton);
    expect(mockPush).toHaveBeenCalledWith(ONBOARDING_ROUTES.HUMAN);
  });
});

describe('HeaderHome - Snapshots', () => {
  it('matches snapshot for default HeaderHome', () => {
    const { container } = render(<HeaderHome />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom className', () => {
    const { container } = render(<HeaderHome className="custom-class" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
