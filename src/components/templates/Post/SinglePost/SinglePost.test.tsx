import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SinglePost } from './SinglePost';

vi.mock('@/organisms/ContentLayout', () => ({
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
}));

vi.mock('@/organisms/SinglePostLeftSidebar', () => ({
  SinglePostLeftSidebar: () => <div data-testid="single-post-left-sidebar">SinglePostLeftSidebar</div>,
  SinglePostLeftDrawer: () => <div data-testid="single-post-left-drawer">SinglePostLeftDrawer</div>,
}));

vi.mock('@/organisms/SinglePostSidebar', () => ({
  SinglePostSidebar: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-sidebar" data-post-id={postId}>
      SinglePostSidebar
    </div>
  ),
}));

vi.mock('@/organisms/SinglePostDrawer', () => ({
  SinglePostDrawer: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-drawer" data-post-id={postId}>
      SinglePostDrawer
    </div>
  ),
}));

vi.mock('@/organisms/SinglePostContent', () => ({
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
  };
});

describe('SinglePost', () => {
  it('renders content layout shell', () => {
    render(<SinglePost postId="author:post-1" />);

    expect(screen.getByTestId('content-layout')).toBeInTheDocument();
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

  it('matches snapshot', () => {
    const { container } = render(<SinglePost postId="author:post-1" />);
    expect(container).toMatchSnapshot();
  });
});
