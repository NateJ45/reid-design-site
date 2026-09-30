// Safe to edit by hand
// FAQ accordion island (rebuilt 2026-09-30, phase 2 of the art-direction
// rebuild; see DESIGN.md "Process and FAQ"). Used by /faq (grouped by
// category), /process (flat) and /e-design (flat). The props are unchanged
// from the shadcn/Radix version it replaces, so every caller keeps working.
//
// Why it no longer wraps the Radix accordion:
//   - Radix does not render a closed panel at all, so the answers were missing
//     from the static HTML. Here every answer is in the page from the first
//     byte (crawlers, find-in-page after opening, no-JS readers of the source)
//     and only COLLAPSED with CSS until opened.
//   - The open/close affordance is our own mark (a ring with a plus that
//     turns to a minus), not the default chevron look.
//
// Accessibility (WAI-ARIA disclosure pattern): each question is a real
// <button> inside an <h3>, with aria-expanded and aria-controls pointing at
// its answer panel. Enter and Space toggle it natively; Tab moves between
// questions. A closed panel is `visibility: hidden`, which also takes its
// links out of the tab order. Several questions can be open at once (the old
// `type="multiple"` behaviour).
//
// Deep links: /faq#faq-page-pricing-cost-item-2 opens that question on load.
//
// Grouping lives in src/components/faq/group-faqs.ts, shared with faq.astro's
// category index so the anchor ids always agree.
//
// Hydrate with client:visible (every caller does).

import { useEffect, useState } from 'react';
import PortableText from '@/components/PortableText';
import { groupFaqs, type FaqItem } from '@/components/faq/group-faqs';
import '@/components/faq/faq-accordion.css';

interface Props {
  faqs?: FaqItem[] | null;
  /** When provided, group items by category in this order. Omit for a single flat list. */
  categoryOrder?: string[] | null;
  /** Stable id prefix so multiple FaqAccordion instances on a page don't collide. */
  idPrefix?: string;
}

export default function FaqAccordion({ faqs, categoryOrder, idPrefix = 'faq' }: Props) {
  const groups = groupFaqs(faqs, categoryOrder, idPrefix);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  // Open the question named in the URL hash, if it belongs to this instance.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id.startsWith(`${idPrefix}-`) && id.includes('-item-')) {
      setOpen((prev) => new Set(prev).add(id));
    }
  }, [idPrefix]);

  if (groups.length === 0) return null;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="faqa">
      {groups.map((group) => {
        const count = group.items.length;
        return (
          // A category is a visible H2 (one level below the page H1). The flat
          // list has no heading of its own, so it takes an aria-label instead
          // of pointing aria-labelledby at an id that does not exist.
          <section
            key={group.id}
            id={group.id}
            className="faqa__group"
            {...(group.category
              ? { 'aria-labelledby': `${group.id}-heading` }
              : { 'aria-label': 'Common questions' })}
          >
            {group.category && (
              <header className="faqa__head">
                <h2 id={`${group.id}-heading`} className="faqa__cat">
                  {group.category}
                </h2>
                <p className="faqa__count">
                  {count} {count === 1 ? 'question' : 'questions'}
                </p>
              </header>
            )}
            <ul className="faqa__list" role="list">
              {group.items.map((item, i) => {
                const itemId = `${group.id}-item-${i}`;
                const isOpen = open.has(itemId);
                return (
                  <li key={itemId} id={itemId} className="faqa__item" data-open={isOpen}>
                    <h3 className="faqa__q">
                      <button
                        type="button"
                        id={`${itemId}-trigger`}
                        className="faqa__trigger"
                        aria-expanded={isOpen}
                        aria-controls={`${itemId}-panel`}
                        onClick={() => toggle(itemId)}
                      >
                        <span className="faqa__qtext">{item.question}</span>
                        <span className="faqa__mark" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`${itemId}-panel`} className="faqa__panel" data-open={isOpen}>
                      <div className="faqa__clip">
                        <div className="faqa__answer">
                          <PortableText value={item.answer} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
