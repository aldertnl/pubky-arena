import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SinglePost } from './SinglePost';

vi.mock('@/molecules', () => ({
  MobileFooter: () => <div data-testid="mobile-footer">MobileFooter</div>,
}));

vi.mock('@/organisms', () => ({
  ContentLayout: ({
    children,
    leftSidebarContent,
    rightSidebarContent,
    leftDrawerContent,
    rightDrawerContent,
    feedVariant,
    classNameWrapperContent,
  }: {
    children: React.ReactNode;
    leftSidebarContent?: React.ReactNode;
    rightSidebarContent?: React.ReactNode;
    leftDrawerContent?: React.ReactNode;
    rightDrawerContent?: React.ReactNode;
    feedVariant?: string;
    classNameWrapperContent?: string;
  }) => (
    <div data-testid="content-layout" data-feed-variant={feedVariant} data-wrapper-class-name={classNameWrapperContent}>
      {leftSidebarContent && <div data-testid="left-sidebar">{leftSidebarContent}</div>}
      {rightSidebarContent && <div data-testid="right-sidebar">{rightSidebarContent}</div>}
      {leftDrawerContent && <div data-testid="left-drawer">{leftDrawerContent}</div>}
      {rightDrawerContent && <div data-testid="right-drawer">{rightDrawerContent}</div>}
      {children}
    </div>
  ),
  SinglePostLeftSidebar: () => <div data-testid="single-post-left-sidebar">SinglePostLeftSidebar</div>,
  SinglePostSidebar: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-sidebar" data-post-id={postId}>
      SinglePostSidebar
    </div>
  ),
  SinglePostLeftDrawer: () => <div data-testid="single-post-left-drawer">SinglePostLeftDrawer</div>,
  SinglePostDrawer: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-drawer" data-post-id={postId}>
      SinglePostDrawer
    </div>
  ),
  SinglePostContent: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-content" data-post-id={postId}>
      SinglePostContent
    </div>
  ),
}));

vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>();
  return {
    ...actual,
    TIMELINE_FEED_VARIANT: {
      ...actual.TIMELINE_FEED_VARIANT,
      BOOKMARKS: 'bookmarks',
    },
  };
});

describe('SinglePost', () => {
  it('renders content layout and mobile shell', () => {
    render(<SinglePost postId="author:post-1" />);

    expect(screen.getByTestId('content-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-footer')).toBeInTheDocument();
  });

  it('renders SinglePostLeftSidebar in left sidebar', () => {
    render(<SinglePost postId="author:post-1" />);

    expect(screen.getByTestId('single-post-left-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('left-sidebar')).toContainElement(screen.getByTestId('single-post-left-sidebar'));
  });

  it('renders SinglePostLeftDrawer in left drawer', () => {
    render(<SinglePost postId="author:post-1" />);

    expect(screen.getByTestId('single-post-left-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('left-drawer')).toContainElement(screen.getByTestId('single-post-left-drawer'));
  });

  it('renders SinglePostSidebar in right sidebar with postId', () => {
    render(<SinglePost postId="author:post-123" />);

    expect(screen.getByTestId('single-post-sidebar')).toHaveAttribute('data-post-id', 'author:post-123');
  });

  it('renders SinglePostDrawer in right drawer with postId', () => {
    render(<SinglePost postId="author:post-123" />);

    expect(screen.getByTestId('single-post-drawer')).toHaveAttribute('data-post-id', 'author:post-123');
  });

  it('renders SinglePostContent with postId', () => {
    render(<SinglePost postId="author:post-123" />);

    expect(screen.getByTestId('single-post-content')).toHaveAttribute('data-post-id', 'author:post-123');
  });

  it('passes BOOKMARKS feed variant to content layout', () => {
    render(<SinglePost postId="author:post-1" />);

    expect(screen.getByTestId('content-layout')).toHaveAttribute('data-feed-variant', 'bookmarks');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePost postId="author:post-1" />);
    expect(container).toMatchSnapshot();
  });
});
