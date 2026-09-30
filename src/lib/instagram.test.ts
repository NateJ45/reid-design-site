// =============================================================================
// The Instagram feed: the pure mapping (scripts/lib/instagram-feed.mjs) and the
// site-side validation (src/lib/instagram.ts). Fixture data only: no network,
// no pictures.
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  feedFile,
  mediaToCandidates,
  tileFileName,
  tileLabel,
} from '../../scripts/lib/instagram-feed.mjs';
import { feedTiles, followLabel, instagramHandle, instagramProfileUrl } from './instagram';

const CDN = 'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/1_n.jpg?stp=x&_nc_sig=abc';
const post = (over: Record<string, unknown> = {}) => ({
  id: '17900000000000001',
  media_type: 'IMAGE',
  media_url: CDN,
  permalink: 'https://www.instagram.com/p/C1abcDEF/',
  caption: 'Warm white on the walls.',
  ...over,
});

describe('mediaToCandidates', () => {
  it('maps an image post', () => {
    expect(mediaToCandidates([post()])).toEqual([
      {
        id: '17900000000000001',
        imageUrl: CDN,
        file: '17900000000000001.jpg',
        href: 'https://www.instagram.com/p/C1abcDEF/',
        label: 'Post on Instagram: Warm white on the walls.',
        isVideo: false,
      },
    ]);
  });

  it('uses a video poster, falling back to media_url', () => {
    const [v] = mediaToCandidates([
      post({ media_type: 'VIDEO', thumbnail_url: 'https://x.cdninstagram.com/poster.jpg' }),
    ]);
    expect(v.imageUrl).toBe('https://x.cdninstagram.com/poster.jpg');
    expect(v.isVideo).toBe(true);
    expect(v.label.startsWith('Video on Instagram')).toBe(true);
    expect(mediaToCandidates([post({ media_type: 'VIDEO' })])[0].imageUrl).toBe(CDN);
  });

  it('keeps a carousel (its first picture is media_url)', () => {
    expect(mediaToCandidates([post({ media_type: 'CAROUSEL_ALBUM' })])).toHaveLength(1);
  });

  it('skips anything it cannot trust, and respects the limit', () => {
    const bad = [
      post({ id: '../../etc' }),
      post({ id: 42 }),
      post({ media_url: 'http://insecure.example/x.jpg' }),
      post({ media_url: undefined }),
      post({ permalink: 'https://evil.example/p/x' }),
      post({ permalink: 'javascript:alert(1)' }),
      null,
    ];
    expect(mediaToCandidates(bad)).toEqual([]);
    expect(mediaToCandidates('nope')).toEqual([]);
    const many = Array.from({ length: 20 }, (_, i) => post({ id: String(i) }));
    expect(mediaToCandidates(many, 12)).toHaveLength(12);
  });
});

describe('tileLabel', () => {
  it('drops hashtags and collapses whitespace', () => {
    expect(tileLabel('Built-ins,   done.\n#interiordesign #plainfield', false)).toBe(
      'Post on Instagram: Built-ins, done.',
    );
  });
  it('has a fallback for no caption (or only hashtags)', () => {
    expect(tileLabel('', false)).toBe('Post on Instagram from Reid Design');
    expect(tileLabel('#home #decor', true)).toBe('Video on Instagram from Reid Design');
    expect(tileLabel(null, false)).toBe('Post on Instagram from Reid Design');
  });
  it('stops at a word near the limit with an ellipsis', () => {
    const long = 'word '.repeat(60);
    const label = tileLabel(long, false, 40);
    expect(label.endsWith('…')).toBe(true);
    expect(label.length).toBeLessThanOrEqual('Post on Instagram: '.length + 41);
    expect(label).not.toMatch(/ …$/);
  });
});

describe('tileFileName', () => {
  it('names the file by post id, refusing anything path-like', () => {
    expect(tileFileName('179')).toBe('179.jpg');
    expect(tileFileName('a/b')).toBeNull();
    expect(tileFileName('')).toBeNull();
    expect(tileFileName(undefined)).toBeNull();
  });
});

describe('feedFile -> feedTiles (the round trip the build makes)', () => {
  it('produces same-origin tiles the site accepts', () => {
    const saved = mediaToCandidates([post(), post({ id: '2', media_type: 'VIDEO' })]);
    const file = feedFile(saved, 'api');
    expect(file.tiles.map((t) => t.src)).toEqual(['/ig/17900000000000001.jpg', '/ig/2.jpg']);
    const tiles = feedTiles(JSON.parse(JSON.stringify(file)));
    expect(tiles).toHaveLength(2);
    expect(tiles[1].isVideo).toBe(true);
    // Nothing in what the page renders names the Instagram CDN.
    expect(JSON.stringify(tiles)).not.toMatch(/cdninstagram|fbcdn/);
  });
});

describe('feedTiles', () => {
  const good = {
    src: '/ig/1.jpg',
    href: 'https://www.instagram.com/p/X/',
    label: 'Post on Instagram: hi',
    isVideo: false,
  };
  it('drops tiles that would name a third-party host or a bad link', () => {
    const tiles = feedTiles({
      tiles: [
        good,
        { ...good, src: CDN },
        { ...good, src: '//cdninstagram.com/x.jpg' },
        { ...good, src: '/ig/../secret.jpg' },
        { ...good, href: 'https://evil.example/' },
        { ...good, label: '' },
        null,
      ],
    });
    expect(tiles).toEqual([good, { ...good, label: 'Post on Instagram' }]);
  });
  it('is empty for a missing or malformed file, and honours the limit', () => {
    expect(feedTiles(undefined)).toEqual([]);
    expect(feedTiles({ tiles: 'x' })).toEqual([]);
    expect(feedTiles({ tiles: Array(12).fill(good) }, 8)).toHaveLength(8);
  });
});

describe('the profile link', () => {
  it('reads the handle', () => {
    expect(instagramHandle('https://www.instagram.com/reiddesignin/')).toBe('@reiddesignin');
    expect(instagramHandle('https://instagram.com/reiddesignin?hl=en')).toBe('@reiddesignin');
    expect(instagramHandle('https://www.instagram.com/p/abc/')).toBeNull();
    expect(instagramHandle(null)).toBeNull();
  });
  it('builds the follow words', () => {
    expect(followLabel(null, 'https://www.instagram.com/reiddesignin/')).toBe(
      'Follow @reiddesignin',
    );
    expect(followLabel('See more rooms', 'https://www.instagram.com/reiddesignin/')).toBe(
      'See more rooms',
    );
    expect(followLabel('  ', null)).toBe('Follow on Instagram');
  });
  it('only links to instagram.com', () => {
    expect(instagramProfileUrl('https://www.instagram.com/reiddesignin/')).toBe(
      'https://www.instagram.com/reiddesignin/',
    );
    expect(instagramProfileUrl('https://example.com')).toBeNull();
  });
});
