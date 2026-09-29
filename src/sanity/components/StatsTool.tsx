// Foundation, edit with care
// StatsTool.tsx: "Site stats", the traffic panel Staci had in Squarespace.
// =============================================================================
// A Studio TOOL (top bar, next to Presentation), registered in sanity.config.ts.
// Read only. It calls the site's own /api/stats endpoint, which reads
// Cloudflare's zone analytics for reiddesignllc.com and returns 28 days of page
// views and visitors, plus the 28 days before for comparison.
//
// HONESTY IS THE FEATURE. Cloudflare counts at the network edge, so the numbers
// include some automated traffic and read higher than Google Analytics. The note
// at the bottom says so in plain words, and says what the numbers are good for
// (is it going up) so nobody quotes them as a headcount. Visitors is an AVERAGE
// per day on purpose: adding up daily uniques counts a returning person once per
// day. See src/lib/site-stats.ts.
//
// Three empty states, all plain language:
//   no-session    no Studio preview cookie yet. Open Presentation once.
//   unconfigured  Nathan has not made the Cloudflare key yet. Friendly, no jargon.
//   upstream      Cloudflare said no. Shows its own message.
//
// The chart is hand-drawn SVG. No chart library: 28 rectangles do not justify a
// dependency in the Studio bundle (the Sanity dependency set is pinned).
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text } from '@sanity/ui';
import { barFractions, type SiteStats } from '../../lib/site-stats';

const ENDPOINT = '/api/stats';
const DASHBOARD = 'https://dash.cloudflare.com';

type Problem = {
  reason: 'no-session' | 'unconfigured' | 'upstream' | 'unreachable';
  message: string;
};

type Loaded = { kind: 'ok'; stats: SiteStats } | { kind: 'problem'; problem: Problem };

const nf = new Intl.NumberFormat('en-US');

/** "Aug 4" from "2026-08-04", without letting the browser shift the day into the
 *  local timezone (a bare `new Date('2026-08-04')` is UTC midnight, which reads
 *  as Aug 3 in Indiana). */
function shortDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function BigNumber(props: { label: string; value: string; hint: string }) {
  return (
    <Card padding={4} radius={3} shadow={1} tone="primary">
      <Stack space={3}>
        <Text size={1} weight="medium">
          {props.label}
        </Text>
        <Heading size={4}>{props.value}</Heading>
        <Text size={1} muted>
          {props.hint}
        </Text>
      </Stack>
    </Card>
  );
}

function changeHint(pct: number | null): string {
  if (pct === null) return 'page views';
  if (pct === 0) return 'page views, the same as the 28 days before';
  return `page views, ${pct > 0 ? 'up' : 'down'} ${Math.abs(pct)}% on the 28 days before`;
}

function Chart(props: { stats: SiteStats }) {
  const { days } = props.stats;
  const fractions = barFractions(days);
  const step = 4;
  const width = days.length * step;
  const peak = days.reduce((m, d) => (d.pageViews > m ? d.pageViews : m), 0);

  return (
    <Stack space={3}>
      <Flex align="baseline" justify="space-between" wrap="wrap" gap={2}>
        <Text size={1} weight="medium">
          Page views, one bar per day
        </Text>
        <Text size={1} muted>
          Busiest day: {nf.format(peak)}
        </Text>
      </Flex>
      <Box
        style={{
          // Sanity UI exposes its palette as CSS variables on the card; the
          // fallback keeps the chart visible if a future theme drops them.
          color: 'var(--card-link-fg-color, #9c7661)',
          height: 140,
        }}
      >
        <svg
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          aria-label={`Page views each day from ${shortDay(props.stats.since)} to ${shortDay(
            props.stats.until,
          )}. Busiest day ${nf.format(peak)}.`}
        >
          {days.map((day, i) => {
            const h = fractions[i] > 0 ? Math.max(fractions[i] * 100, 1.5) : 0;
            return (
              <g key={day.date}>
                {/* Faint full-height column so a zero day still reads as a day. */}
                <rect
                  x={i * step}
                  y={0}
                  width={step - 1}
                  height={100}
                  fill="currentColor"
                  opacity={0.08}
                />
                <rect
                  x={i * step}
                  y={100 - h}
                  width={step - 1}
                  height={h}
                  fill="currentColor"
                  opacity={0.9}
                >
                  <title>{`${shortDay(day.date)}: ${nf.format(day.pageViews)} page views, ${nf.format(
                    day.visitors,
                  )} visitors`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </Box>
      <Flex justify="space-between">
        <Text size={1} muted>
          {shortDay(props.stats.since)}
        </Text>
        <Text size={1} muted>
          {shortDay(props.stats.until)} (today, still counting)
        </Text>
      </Flex>
    </Stack>
  );
}

function ProblemCard(props: { problem: Problem; onRetry: () => void }) {
  const { problem } = props;

  const body =
    problem.reason === 'no-session' ? (
      <Stack space={4}>
        <Text size={1}>
          This panel needs to know it is really you. It learns that from the site preview.
        </Text>
        <Stack space={2} as="ol">
          <Text size={1}>1. Click Presentation at the top of the Studio.</Text>
          <Text size={1}>2. Wait for your website to appear beside the editor.</Text>
          <Text size={1}>3. Come back here and click Try again.</Text>
        </Stack>
        <Text size={1} muted>
          You only do this once on each computer.
        </Text>
      </Stack>
    ) : problem.reason === 'unconfigured' ? (
      <Stack space={4}>
        <Text size={1}>{problem.message}</Text>
        <Text size={1} muted>
          Nothing is broken and there is nothing for you to do here. Once it is set up, this page
          shows how many people looked at your website each day, like the Squarespace stats did.
        </Text>
      </Stack>
    ) : (
      <Stack space={4}>
        <Text size={1}>{problem.message}</Text>
        <Text size={1} muted>
          If this keeps happening, tell Nathan.
        </Text>
      </Stack>
    );

  return (
    <Card padding={4} radius={3} shadow={1} tone="caution">
      <Stack space={4}>
        <Heading size={1}>
          {problem.reason === 'no-session'
            ? 'Open the site preview once, then come back'
            : problem.reason === 'unconfigured'
              ? 'Site stats is not set up yet'
              : 'The numbers did not load'}
        </Heading>
        {body}
        <Box>
          <Button text="Try again" mode="ghost" onClick={props.onRetry} />
        </Box>
      </Stack>
    </Card>
  );
}

export function StatsTool() {
  const [state, setState] = useState<Loaded | null>(null);

  const load = useCallback(async () => {
    setState(null);
    try {
      const res = await fetch(ENDPOINT, { credentials: 'same-origin' });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      const record = (body ?? {}) as Record<string, unknown>;

      if (res.ok && record.ok === true) {
        setState({ kind: 'ok', stats: body as SiteStats });
        return;
      }
      const reason =
        record.reason === 'no-session' ||
        record.reason === 'unconfigured' ||
        record.reason === 'upstream'
          ? record.reason
          : 'unreachable';
      setState({
        kind: 'problem',
        problem: {
          reason,
          message:
            typeof record.message === 'string'
              ? record.message
              : 'The website did not answer. Try again in a minute.',
        },
      });
    } catch {
      setState({
        kind: 'problem',
        problem: {
          reason: 'unreachable',
          message: 'The website did not answer. Try again in a minute.',
        },
      });
    }
  }, []);

  useEffect(() => {
    // Start the load after the effect body so React does not see a setState
    // inside the effect itself, and drop it if the tool unmounts first.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <Box padding={4} overflow="auto" height="fill">
      <Box style={{ maxWidth: 760, margin: '0 auto' }}>
        <Stack space={5}>
          <Stack space={3}>
            <Heading size={3}>Site stats</Heading>
            <Text size={1} muted>
              How many people have been looking at your website. Read only, and a few minutes
              behind.
            </Text>
          </Stack>

          {state === null ? (
            <Card padding={5} radius={3} shadow={1}>
              <Flex align="center" gap={3} justify="center">
                <Spinner muted />
                <Text size={1} muted>
                  Reading the numbers.
                </Text>
              </Flex>
            </Card>
          ) : state.kind === 'problem' ? (
            <ProblemCard problem={state.problem} onRetry={() => void load()} />
          ) : (
            <Stack space={5}>
              <Grid columns={[1, 1, 3]} gap={3}>
                <BigNumber
                  label="Last 7 days"
                  value={nf.format(state.stats.last7.pageViews)}
                  hint="page views"
                />
                <BigNumber
                  label="Last 28 days"
                  value={nf.format(state.stats.last28.pageViews)}
                  hint={changeHint(state.stats.changePct)}
                />
                <BigNumber
                  label="Visitors a day"
                  value={nf.format(state.stats.last28.avgVisitors)}
                  hint="on average, over the last 28 days"
                />
              </Grid>

              <Card padding={4} radius={3} shadow={1}>
                <Chart stats={state.stats} />
              </Card>

              <Card padding={4} radius={3} shadow={1} tone="transparent">
                <Stack space={4}>
                  <Heading size={1}>What these numbers mean</Heading>
                  <Text size={1}>
                    A page view is one page loading. A visitor is one device or household in a day,
                    so you and a friend on the same wifi count as one.
                  </Text>
                  <Text size={1}>
                    Cloudflare counts at the front door of the website, so it also counts some
                    search engines and other robots. These numbers will read higher than Google
                    Analytics. Use them to see whether the website is getting busier, not to count
                    people.
                  </Text>
                  <Text size={1} muted>
                    Each day runs on UTC, so a day here starts in the evening Indiana time. Numbers
                    read {new Date(state.stats.fetchedAt).toLocaleString('en-US')}.
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      as="a"
                      href={DASHBOARD}
                      target="_blank"
                      rel="noreferrer"
                      text="Open the Cloudflare dashboard"
                      mode="ghost"
                    />
                    <Button text="Refresh" mode="bleed" onClick={() => void load()} />
                  </Flex>
                  <Text size={1} muted>
                    Cloudflare keeps the full report, including which countries visitors come from.
                    Ask Nathan for a login.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default StatsTool;
