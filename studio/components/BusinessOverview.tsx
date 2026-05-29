// BusinessOverview.tsx — Panel 2 of the Start Here handbook.
// Staci's single source of truth: live data from Sanity (services + site settings)
// alongside static reference info about the business, ideal client, and voice.
// Safe to edit by hand.

import React, { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Card, Container, Heading, Stack, Text } from '@sanity/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceRow {
  name: string;
  price: string;
  bestFor: string;
}

interface TravelFeeTier {
  distanceLabel: string;
  fee: string;
}

interface SiteSettingsData {
  email: string | null;
  phone: string | null;
  availabilityStatus: string | null;
  serviceAreas: string[] | null;
  travelFees: TravelFeeTier[] | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
}

interface LiveData {
  services: ServiceRow[];
  settings: SiteSettingsData;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

const SERVICES_QUERY = `*[_type=="service"]|order(orderRank asc){name,price,bestFor}`;
const SETTINGS_QUERY = `*[_type=="siteSettings"][0]{email,phone,availabilityStatus,serviceAreas,travelFees,socialInstagram,socialFacebook}`;

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Loading skeleton shown while fetch is in progress. */
function LoadingCard({ label }: { label: string }) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="transparent">
      <Text size={1} muted>Loading {label}...</Text>
    </Card>
  );
}

/** Shown when a fetch fails gracefully. */
function ErrorCard({ label }: { label: string }) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="caution">
      <Text size={1}>
        Could not load {label} right now. Open Site Settings or Content to see the current values.
      </Text>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessOverview() {
  const client = useClient({ apiVersion: '2024-01-01' });

  const [services, setServices] = useState<ServiceRow[] | null>(null);
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [servicesError, setServicesError] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    // Fetch services
    client
      .fetch<ServiceRow[]>(SERVICES_QUERY)
      .then((data) => setServices(data ?? []))
      .catch(() => setServicesError(true));

    // Fetch site settings
    client
      .fetch<SiteSettingsData | null>(SETTINGS_QUERY)
      .then((data) => setSettings(data ?? null))
      .catch(() => setSettingsError(true));
  }, [client]);

  return (
    <Container width={1} padding={4}>
      <Stack space={6}>

        {/* Header */}
        <Box>
          <Heading as="h1" size={3}>
            Your business at a glance
          </Heading>
          <Box marginTop={3}>
            <Text muted size={1}>
              The live sections below are pulled directly from your Services and Site Settings,
              so they are always current. To change anything, edit those documents.
            </Text>
          </Box>
        </Box>

        {/* ── LIVE: Services + prices ─────────────────────────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={4}>
            <Heading as="h2" size={1}>
              Your services and prices (live)
            </Heading>

            {/* Loading */}
            {services === null && !servicesError && (
              <LoadingCard label="services" />
            )}

            {/* Error */}
            {servicesError && (
              <ErrorCard label="services" />
            )}

            {/* Data */}
            {services !== null && services.length === 0 && (
              <Text size={1} muted>No services found. Add them under Content, Services.</Text>
            )}
            {services !== null && services.length > 0 && (
              <Stack space={3}>
                {services.map((svc, i) => (
                  <Card key={i} padding={3} radius={2} tone="transparent" shadow={1}>
                    <Stack space={2}>
                      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                        <Text size={1} weight="semibold">{svc.name ?? 'Unnamed service'}</Text>
                        <Text size={1}>{svc.price ?? '—'}</Text>
                      </Box>
                      {svc.bestFor ? (
                        <Text size={1} muted>Best for: {svc.bestFor}</Text>
                      ) : null}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* ── LIVE: Contact + availability + service areas ─────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={4}>
            <Heading as="h2" size={1}>
              Contact, availability, and service areas (live)
            </Heading>

            {/* Loading */}
            {settings === null && !settingsError && (
              <LoadingCard label="site settings" />
            )}

            {/* Error */}
            {settingsError && (
              <ErrorCard label="site settings" />
            )}

            {/* Data */}
            {settings !== null && (
              <Stack space={3}>

                {settings.availabilityStatus ? (
                  <Box>
                    <Text size={1} weight="semibold">Availability</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.availabilityStatus}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.email ? (
                  <Box>
                    <Text size={1} weight="semibold">Email</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.email}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.phone ? (
                  <Box>
                    <Text size={1} weight="semibold">Phone</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.phone}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.socialInstagram ? (
                  <Box>
                    <Text size={1} weight="semibold">Instagram</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.socialInstagram}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.socialFacebook ? (
                  <Box>
                    <Text size={1} weight="semibold">Facebook</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.socialFacebook}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.serviceAreas && settings.serviceAreas.length > 0 ? (
                  <Box>
                    <Text size={1} weight="semibold">Service areas</Text>
                    <Box marginTop={1}>
                      <Text size={1}>{settings.serviceAreas.join(', ')}</Text>
                    </Box>
                  </Box>
                ) : null}

                {settings.travelFees && settings.travelFees.length > 0 ? (
                  <Box>
                    <Text size={1} weight="semibold">Travel fee tiers</Text>
                    <Box marginTop={1}>
                      <Stack space={1}>
                        {settings.travelFees.map((tier, i) => (
                          <Text key={i} size={1}>
                            {tier.distanceLabel}: {tier.fee}
                          </Text>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                ) : null}

              </Stack>
            )}
          </Stack>
        </Card>

        {/* ── STATIC: Who you are ─────────────────────────────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Who you are
            </Heading>
            <Text size={1}>
              Reid Design LLC is a residential interior design studio based in Plainfield,
              Indiana. You serve Plainfield, Indianapolis, and the surrounding suburbs:
              Carmel, Fishers, Westfield, Zionsville, and Noblesville.
            </Text>
            <Text size={1}>
              The studio is warm and approachable. You show prices openly. You are
              mid-market, not white-glove. Your entry point is a $150 in-home consultation,
              which keeps the door low enough for homeowners who are not sure yet.
            </Text>
          </Stack>
        </Card>

        {/* ── STATIC: Your ideal client ────────────────────────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Your ideal client
            </Heading>
            <Text size={1}>
              A homeowner in Plainfield or the Indy suburbs. Their home feels off, and they
              do not know where to start. They have the budget for design help but are not
              shopping at the luxury tier. They usually find you on Instagram or through a
              referral from a friend or neighbor.
            </Text>
            <Text size={1}>
              They are not looking for a high-end showroom experience. They want a smart
              friend who happens to be a designer, someone who will be honest with them,
              knows what works in real houses, and will not make them feel bad about their
              current furniture.
            </Text>
          </Stack>
        </Card>

        {/* ── STATIC: Your voice ────────────────────────────────────────────── */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Your voice (how you sound in writing)
            </Heading>
            <Text size={1}>
              Warm, plain-spoken, like a smart friend who happens to be a designer. Say
              prices plainly, no hedging. Be specific about real rooms and real situations.
              Write the way you talk.
            </Text>
            <Text size={1} weight="semibold">
              Words to skip:
            </Text>
            <Text size={1}>
              "Transformative," "curated," "elevated," "tailored," "investment in your
              space." These read as designer-speak. Replace them with plain descriptions
              of what actually happens.
            </Text>
            <Text size={1} weight="semibold">
              No em-dashes:
            </Text>
            <Text size={1}>
              That is the long dash that looks like this: . Use a comma or period instead.
              The website's style guide skips them entirely.
            </Text>
            <Text size={1} weight="semibold">
              Stop when you are done:
            </Text>
            <Text size={1}>
              End the paragraph. Do not add a closing sentence that restates the point.
              Two sentences that say the same thing is one sentence too many.
            </Text>
          </Stack>
        </Card>

      </Stack>
    </Container>
  );
}
