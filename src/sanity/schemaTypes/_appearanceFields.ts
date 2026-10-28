// Foundation, edit with care
// =============================================================================
// The one appearance field a page-builder block may carry: `look`
// (refoundation phase B, 2026-10-28; starter card 124, rule 9 as amended)
// =============================================================================
// A string enum of DESIGNED looks, never a colour. The list comes from
// src/lib/section-looks.ts, which also says which blocks offer which looks;
// src/lib/sectionCadence.ts turns the look into linen, paper or the ink band
// with the neighbours in view. section-fields.test.ts fails if a block writes
// its own `look` field instead of calling lookField(), or carries any colour,
// surface, tone or background field.
// =============================================================================
import { defineField } from 'sanity';
import { lookOptionsFor } from '../../lib/section-looks';
import { SectionLookInput } from '../components/SectionLookInput';

/**
 * The "Look" control for one content block. No initialValue on purpose: unset
 * means Standard, so new blocks and every block saved before this field store
 * the same nothing, and no page moves until Staci picks a look. `look` is in
 * NON_STEGA_FIELDS (src/lib/cms-preview.ts, rule 7).
 */
export function lookField(type: string) {
  return defineField({
    name: 'look',
    title: 'Look',
    type: 'string',
    description:
      'How this section sits on the page. Standard follows the page rhythm. Two dark sections never sit side by side, so a Feature next to another dark band, or at the very end of the page, shows as Standard.',
    options: {
      list: lookOptionsFor(type).map((l) => ({ title: l.title, value: l.value })),
      layout: 'radio',
    },
    components: { input: SectionLookInput },
  });
}
