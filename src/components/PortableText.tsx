// Foundation, edit with care
// Renders Sanity Portable Text into on-brand HTML. Used for any rich-text
// content from Sanity: faqItem.answer, service.longDescription, processStep.fullDescription,
// philosophyPoint.description, page singleton story/intro blocks, project.introStory.
//
// Style discipline: this component picks the right semantic + brand tokens so
// Portable Text content inherits theme-aware colors automatically. Body text
// uses text-foreground (ink). Don't hard-code hex colors here.
//
// Restyled 2026-09-30 (phase 2 of the art-direction rebuild; DESIGN.md
// "Blocks and Portfolio"). Headings are Zodiak Light at BODY scale (the
// --text-h2 token grew to 5rem for section heads, far too big inside running
// text), h4 is a General Sans label, links are ink with a Warm Bronze
// underline (the bronze is a mark, never the text colour), quotes are Zodiak
// italic off a bronze rule, and photos are square-cornered crops with a plain
// caption. The API (value, className) is unchanged: FAQ answers, service
// descriptions, process steps, the about story and project stories all use
// this component.

import { PortableText as PT, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { urlFor, parseSanityAssetDimensions } from '@/lib/sanity';
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
      ? children
          .map((c) => (typeof c === 'string' ? c : (c?.props?.children ?? '')))
          .join('')
          .trim()
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
        <h2
          id={headingId(children)}
          className="mt-section-md mb-m scroll-mt-24 font-display text-[clamp(1.75rem,1.2rem+1.7vw,2.6rem)] leading-[1.08] font-light tracking-[-0.025em] text-balance text-foreground"
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          id={headingId(children)}
          className="mt-l mb-s scroll-mt-24 font-display text-[clamp(1.35rem,1.1rem+0.8vw,1.75rem)] leading-tight font-light tracking-[-0.015em] text-foreground"
        >
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4
          id={headingId(children)}
          className="mt-m mb-s scroll-mt-24 font-body text-[1.05rem] leading-snug font-semibold text-foreground"
        >
          {children}
        </h4>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-l border-l-2 border-chip-5 pl-m font-display text-[clamp(1.25rem,1.05rem+0.6vw,1.55rem)] leading-snug font-light text-foreground italic">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="my-m list-disc space-y-1.5 pl-l text-foreground marker:text-chip-5">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="my-m list-decimal space-y-1.5 pl-l text-foreground marker:font-medium marker:text-chip-7">
          {children}
        </ol>
      ),
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
            className="text-foreground underline decoration-chip-5 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-foreground"
            target={newTab ? '_blank' : undefined}
            rel={newTab ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        );
      },
      // Sourced-from annotation. Italic small-caps treatment inline; when a URL
      // is provided, becomes a quiet bronze underlined link.
      sourcedFrom: ({ children, value }) => {
        const label = value?.vendor ?? '';
        const inner = (
          <span className="text-foreground/85 italic">
            {children}
            {label && (
              <span className="ml-1 align-baseline text-[0.85em] font-medium text-ink-2 not-italic">
                · {label}
              </span>
            )}
          </span>
        );
        if (!value?.url) return inner;
        return (
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-chip-5 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-foreground"
          >
            {inner}
          </a>
        );
      },
    },
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        const url = urlFor(value).width(1600).quality(75).format('webp').url();
        const url2x = urlFor(value).width(3200).quality(75).format('webp').url();
        // Intrinsic dimensions from the asset _ref serve two purposes:
        // (1) the browser reserves aspect-ratio space before the image lands
        //     (kills CLS), and (2) we can detect orientation to choose a
        //     sensible figure width, portrait shots blown out to full column
        //     width are taller than the viewport, so we cap them ~600 px wide
        //     and center. Landscape shots keep the editorial full-bleed.
        const dims = parseSanityAssetDimensions(value);
        const isPortrait = dims ? dims.height > dims.width : false;
        const figClass = isPortrait
          ? 'my-section-md mx-auto max-w-[600px]'
          : 'my-section-md -mx-m md:mx-0';
        return (
          <figure className={figClass}>
            <img
              src={url}
              srcSet={`${url} 1x, ${url2x} 2x`}
              width={dims?.width}
              height={dims?.height}
              alt={value.alt ?? ''}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
            {(value.decisionLine || value.caption) && (
              <figcaption className="mt-s px-m md:px-0">
                {value.decisionLine && (
                  <span className="mb-xs block text-sm font-medium text-chip-7">
                    {value.decisionLine}
                  </span>
                )}
                {value.caption && (
                  <span className="block text-sm leading-relaxed text-ink-2 md:text-base">
                    {value.caption}
                  </span>
                )}
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
