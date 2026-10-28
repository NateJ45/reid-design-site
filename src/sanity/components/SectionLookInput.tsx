// Foundation, edit with care.
// =============================================================================
// SectionLookInput - the "Look" radio on a page-builder block (refoundation
// phase B, 2026-10-28; Reid's own drawing of the starter's card 124 input)
// =============================================================================
// The `look` field (src/sanity/schemaTypes/_appearanceFields.ts) is a plain
// string enum. Each option is a small card: a tiny drawing of the band as the
// site paints it (linen and paper taking turns for Standard, plain linen for
// Quiet, the ink band with a bronze paint chip for Feature), the look's name
// and one line on what the visitor sees. The swatches are the measured pairs in
// src/lib/surfaces.ts, which surfaces.test.ts pins to globals.css.
//
// Nothing here writes a colour: it writes the look's name, or clears the field
// for Standard, so an untouched block and a block set back to Standard store
// the same thing (nothing).
// =============================================================================
import { useCallback } from 'react';
import { Box, Card, Flex, Radio, Stack, Text } from '@sanity/ui';
import { set, unset, type StringInputProps } from 'sanity';
import { LOOK_BY_VALUE, type SectionLook } from '../../lib/section-looks';
import { SURFACE_PAIRS } from '../../lib/surfaces';

type ListItem = { title?: string; value?: string };

const pair = (s: 'background' | 'muted' | 'ink') => SURFACE_PAIRS.find((p) => p.surface === s)!;
const LINEN = pair('background');
const PAPER = pair('muted');
const INK = pair('ink');
const BRONZE = '#9c7661';

/** One band of the picture: a heading line and two text lines. */
function Band({ bg, ink, chip }: { bg: string; ink: string; chip?: boolean }) {
  return (
    <span
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        padding: '0 9px',
        background: bg,
      }}
    >
      {chip && <span style={{ width: 8, height: 8, background: BRONZE, marginBottom: 1 }} />}
      <span style={{ width: '55%', height: 4, background: ink, opacity: 0.9 }} />
      <span style={{ width: '80%', height: 2, background: ink, opacity: 0.45 }} />
      <span style={{ width: '70%', height: 2, background: ink, opacity: 0.45 }} />
    </span>
  );
}

function Picture({ look }: { look: SectionLook }) {
  const frame = {
    display: 'flex',
    flexDirection: 'column' as const,
    width: 72,
    height: 54,
    flex: 'none',
    border: `1px solid ${LINEN.text[1][1]}33`,
    overflow: 'hidden',
  };
  if (look === 'feature') {
    return (
      <span style={frame} aria-hidden="true">
        <Band bg={INK.ground} ink={INK.text[0][1]} chip />
      </span>
    );
  }
  if (look === 'quiet') {
    return (
      <span style={frame} aria-hidden="true">
        <Band bg={LINEN.ground} ink={LINEN.text[0][1]} />
      </span>
    );
  }
  return (
    <span style={frame} aria-hidden="true">
      <Band bg={LINEN.ground} ink={LINEN.text[0][1]} />
      <Band bg={PAPER.ground} ink={PAPER.text[0][1]} />
    </span>
  );
}

export function SectionLookInput(props: StringInputProps) {
  const { value, onChange, schemaType, readOnly } = props;
  const list = ((schemaType.options?.list ?? []) as ListItem[]).filter(
    (o): o is { title?: string; value: string } => typeof o?.value === 'string',
  );
  const current = typeof value === 'string' && value ? value : 'standard';
  const pick = useCallback(
    (next: string) => onChange(next === 'standard' ? unset() : set(next)),
    [onChange],
  );

  return (
    <Stack gap={2} role="radiogroup" aria-label="Look">
      {list.map((o) => {
        const info = LOOK_BY_VALUE[o.value];
        const on = current === o.value;
        return (
          <Card
            key={o.value}
            as="label"
            padding={2}
            radius={0}
            border
            tone={on ? 'primary' : 'default'}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
          >
            <Flex align="center" gap={3}>
              <Radio
                checked={on}
                disabled={readOnly}
                onChange={() => pick(o.value)}
                value={o.value}
                name={`look-${props.id}`}
              />
              <Picture look={o.value as SectionLook} />
              <Box flex={1}>
                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    {info?.title ?? o.title}
                  </Text>
                  {info?.hint && (
                    <Text size={1} muted>
                      {info.hint}
                    </Text>
                  )}
                </Stack>
              </Box>
            </Flex>
          </Card>
        );
      })}
    </Stack>
  );
}
