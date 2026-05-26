// Foundation, edit with care
// Renders Sanity Portable Text into on-brand HTML. Used for any rich-text
// content from Sanity: faqItem.answer, service.longDescription, processStep.fullDescription,
// philosophyPoint.description, page singleton story/intro blocks, project.introStory.
//
// Style discipline: this component picks the right semantic + brand tokens so
// Portable Text content inherits theme-aware colors automatically. Body text
// uses text-foreground (dark-mode-aware). Links use text-link with
// underline for contrast and discoverability. Don't hard-code colors here.

import { PortableText as PT, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/lib/sanity';
import { slugify } from '@/lib/slugify';

interface Props {
  value: PortableTextBlock[] | undefined | null;
  /** Optional className applied to the wrapping div for spacing/typography overrides per slot. */
  className?: string;
}

// Build a fresh slug-tracking map per render so headings get stable, unique
// ids that match the TOC extracted server-side via extractHeadings().
function makeComponents(): PortableTextComponents {
  const seen = new Map<string, number>();
  const headingId = (children: any): string => {
    const text = Array.isArray(children)
      ? children.map((c) => (typeof c === 'string' ? c : c?.props?.children ?? '')).join('').trim()
      : String(children ?? '').trim();
    const base = slugify(text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  return {
  block: {
    normal: ({ children }) => <p className="my-m text-foreground">{children}</p>,
    h2: ({ children }) => (
      <h2 id={headingId(children)} className="mt-xl mb-m font-display text-h2 text-foreground scroll-mt-24">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 id={headingId(children)} className="mt-l mb-s font-display text-h3 text-foreground scroll-mt-24">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 id={headingId(children)} className="mt-m mb-s font-display text-h4 text-foreground scroll-mt-24">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-l border-l-4 border-primary pl-m italic text-foreground/90">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="my-m list-disc pl-l space-y-1 text-foreground">{children}</ul>,
    number: ({ children }) => <ol className="my-m list-decimal pl-l space-y-1 text-foreground">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-foreground">{children}</li>,
    number: ({ children }) => <li className="text-foreground">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = value?.href ?? '#';
      const isExternal = /^https?:\/\//.test(href);
      const newTab = value?.openInNewTab || isExternal;
      return (
        <a
          href={href}
          className="text-link underline underline-offset-2 hover:text-primary transition-colors"
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const url = urlFor(value).width(1200).quality(75).format('webp').url();
      const url2x = urlFor(value).width(2400).quality(75).format('webp').url();
      return (
        <figure className="my-l">
          <img
            src={url}
            srcSet={`${url} 1x, ${url2x} 2x`}
            alt={value.alt ?? ''}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-md"
          />
          {value.caption && (
            <figcaption className="mt-xs text-sm text-muted-foreground italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  };
}

export default function PortableText({ value, className }: Props) {
  if (!value || value.length === 0) return null;
  return (
    <div className={className}>
      <PT value={value} components={makeComponents()} />
    </div>
  );
}
