'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { POST_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { URL_TRUNCATE_LENGTH } from '@/config/urls';
import { cn, truncateMiddle } from '@/libs/utils/utils';
import { PostMentions } from '@/organisms/PostMentions/PostMentions';
import { PostCodeBlock } from '../PostCodeBlock/PostCodeBlock';
import { PostHashtags } from '../PostHashtags/PostHashtags';
import { PostTextProps, RemarkAnchorProps } from './PostText.types';
import {
  remarkDisallowMarkdownLinks,
  remarkExtractFirstParagraph,
  remarkHashtags,
  remarkMentions,
  remarkPlaintextCodeblock,
  remarkPlaintextTables,
  truncatePostPreviewText,
} from './PostText.utils';

/**
 * Renders formatted text content with markdown, hashtags, mentions, and links.
 *
 * Used for:
 * - Post content in feeds and post pages
 * - User bio in profile popovers
 *
 * Features:
 * - Markdown formatting (bold, italic, code, lists, etc.)
 * - Hashtag parsing (#tag → clickable search link)
 * - Mention parsing (pk:... or pubky... → clickable profile link)
 * - URL detection and linking
 * - Content truncation with in-place "Show more" on non-post pages
 *
 * Re-render bailouts on TTL refreshes (#959) come from the React Compiler
 * (`reactCompiler` in next.config.ts) — no manual memo needed.
 */
export function PostText({ content, isArticle, onLinkClick, className, isPreTruncated }: PostTextProps) {
  const pathname = usePathname();
  const onPostPage = pathname.startsWith(POST_ROUTES.POST);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentTruncated =
    !isArticle && !onPostPage && !isExpanded && !isPreTruncated ? truncatePostPreviewText(content) : null;
  const showMoreButton = Boolean(contentTruncated);
  const inTruncatedPreview = showMoreButton || Boolean(isPreTruncated);

  const remarkPlugins = [
    remarkGfm,
    remarkPlaintextTables,
    ...(isArticle ? (!onPostPage ? [remarkExtractFirstParagraph] : []) : [remarkDisallowMarkdownLinks]),
    remarkPlaintextCodeblock,
    remarkHashtags,
    remarkMentions,
  ];

  // Memoize allowed elements array to avoid recreation on every render
  const allowedElements = useMemo(
    () => [
      'em',
      'strong',
      'code',
      'pre',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'del',
      'blockquote',
      'hr',
      ...(isArticle ? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] : []),
    ],
    [isArticle],
  );

  return (
    <Container
      data-cy="post-text"
      overrideDefaults
      className={cn(
        'text-base leading-6 font-medium wrap-anywhere whitespace-pre-line text-secondary-foreground',
        className,
      )}
    >
      <Markdown
        allowedElements={allowedElements}
        unwrapDisallowed
        remarkPlugins={remarkPlugins}
        components={{
          a(props: RemarkAnchorProps) {
            const { children, className, 'data-type': dataType, node: _node, ref: _ref, ...rest } = props;

            if (dataType === 'hashtag') return <PostHashtags {...props} />;
            if (dataType === 'mention') return <PostMentions {...props} />;

            // In collapsed previews shorten only the visible link text; the href keeps the full URL
            const displayChildren =
              inTruncatedPreview && typeof children === 'string'
                ? truncateMiddle(children, URL_TRUNCATE_LENGTH)
                : children;

            return (
              <a
                {...rest}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();

                  if (onLinkClick && rest.href) {
                    onLinkClick(rest.href, e);
                  }
                }}
                className={cn(className, 'cursor-pointer text-brand transition-colors hover:text-brand/80')}
              >
                {displayChildren}
              </a>
            );
          },
          blockquote(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <blockquote {...rest} className={cn(className, 'border-l-4 border-foreground pl-4 whitespace-normal')}>
                {children}
              </blockquote>
            );
          },
          ol(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <ol {...rest} className={cn(className, 'list-inside list-decimal whitespace-normal')}>
                {children}
              </ol>
            );
          },
          ul(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <ul {...rest} className={cn(className, 'list-inside list-disc whitespace-normal')}>
                {children}
              </ul>
            );
          },
          code(props) {
            return <PostCodeBlock {...props} />;
          },
          h1(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h1 {...rest} className={cn(className, 'text-2xl leading-8 font-bold text-white')}>
                {children}
              </h1>
            );
          },
          h2(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h2 {...rest} className={cn(className, 'text-xl leading-7 font-bold text-white')}>
                {children}
              </h2>
            );
          },
          h3(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h3 {...rest} className={cn(className, 'text-lg leading-7 font-bold text-white')}>
                {children}
              </h3>
            );
          },
          h4(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h4 {...rest} className={cn(className, 'text-[17px] leading-6 font-bold text-white')}>
                {children}
              </h4>
            );
          },
          h5(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h5 {...rest} className={cn(className, 'text-[16.5px] leading-6 font-light text-muted-foreground')}>
                {children}
              </h5>
            );
          },
          h6(props) {
            const { children, className, node: _node, ref: _ref, ...rest } = props;

            return (
              <h6 {...rest} className={cn(className, 'text-[16.25px] leading-6 font-light text-muted-foreground')}>
                {children}
              </h6>
            );
          },
        }}
      >
        {contentTruncated || content}
      </Markdown>

      {showMoreButton && (
        <Button
          overrideDefaults
          type="button"
          aria-label="Show full post content"
          className="mt-4 cursor-pointer text-brand transition-colors hover:text-brand/80"
          onClick={(event) => {
            event.stopPropagation();
            setIsExpanded(true);
          }}
        >
          Show more
        </Button>
      )}
    </Container>
  );
}
