import { describe, expect, it } from 'vitest';
import { collectionItemsIncludePost, resolvePostUrl } from './post.collectionItemUrl';

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const POST_ID = '0034BBBDFK83G';
const COMPOSITE_ID = `${AUTHOR_PUBKY}:${POST_ID}`;
const ITEM_URI = `pubky://${AUTHOR_PUBKY}/pub/pubky.app/posts/${POST_ID}`;

describe('resolvePostUrl', () => {
  it('resolves a pubky post URI to the canonical post identity', () => {
    expect(resolvePostUrl(ITEM_URI)).toEqual({
      compositeId: COMPOSITE_ID,
      itemUri: ITEM_URI,
    });
  });

  it('resolves an absolute app post URL and ignores query and hash fragments', () => {
    expect(resolvePostUrl(`https://app.pubky.org/post/${AUTHOR_PUBKY}/${POST_ID}?from=feed#comments`)).toEqual({
      compositeId: COMPOSITE_ID,
      itemUri: ITEM_URI,
    });
  });

  it('resolves a relative post route', () => {
    expect(resolvePostUrl(`/post/${AUTHOR_PUBKY}/${POST_ID}`)?.itemUri).toBe(ITEM_URI);
  });

  it.each([
    '',
    'not-a-url',
    'ftp://app.pubky.org/post/o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy/0034BBBDFK83G',
    'https://app.pubky.org/profile/o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy',
    'https://app.pubky.org/post/not-a-pubky/0034BBBDFK83G',
    'https://app.pubky.org/post/o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy',
    'pubky://o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy/pub/pubky.app/files/0034BBBDFK83G',
  ])('rejects unsupported or malformed post URLs: %s', (value) => {
    expect(resolvePostUrl(value)).toBeNull();
  });
});

describe('collectionItemsIncludePost', () => {
  it('matches existing canonical pubky items', () => {
    expect(collectionItemsIncludePost([ITEM_URI], ITEM_URI)).toBe(true);
  });

  it('matches an existing web URL for the same post as a duplicate', () => {
    const webUrl = `https://app.pubky.org/post/${AUTHOR_PUBKY}/${POST_ID}`;

    expect(collectionItemsIncludePost([webUrl], ITEM_URI)).toBe(true);
  });

  it('falls back to exact string matching for non-post items', () => {
    expect(collectionItemsIncludePost(['https://example.com/article'], 'https://example.com/article')).toBe(true);
    expect(collectionItemsIncludePost(['https://example.com/article'], ITEM_URI)).toBe(false);
  });

  it('returns false for a null or undefined items list', () => {
    expect(collectionItemsIncludePost(null, ITEM_URI)).toBe(false);
    expect(collectionItemsIncludePost(undefined, ITEM_URI)).toBe(false);
  });

  it('returns false when the target resolves to an empty identity', () => {
    expect(collectionItemsIncludePost([ITEM_URI], '   ')).toBe(false);
  });
});
