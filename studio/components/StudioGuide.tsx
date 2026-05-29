// StudioGuide.tsx — Panel 1 of the Start Here handbook.
// A plain-language orientation for Staci: how the Studio works, where to find things,
// and step-by-step how-tos for every common editing task.
// Static content — no data fetching.
// Safe to edit by hand.

import React from 'react';
import { Box, Card, Container, Heading, Stack, Text } from '@sanity/ui';

// ─── Data ────────────────────────────────────────────────────────────────────

/** One numbered how-to step. */
interface HowTo {
  number: number;
  title: string;
  steps: string[];
}

const howTos: HowTo[] = [
  {
    number: 1,
    title: 'Edit a page\'s words or photos',
    steps: [
      'Click "Pages" in the left sidebar, then pick the page you want to update.',
      'Edit any field directly in the form on the left.',
      'Click the "Preview" tab at the top to see how it looks before you publish.',
      'When you are happy, click the blue "Publish" button at the bottom right. The live site updates in about 1 to 3 minutes.',
    ],
  },
  {
    number: 2,
    title: 'Add a project or case study',
    steps: [
      'Click "Content" in the left sidebar, then "Projects".',
      'Click the blue + button at the top right to create a new project.',
      'Fill in the title, location, room type, and year.',
      'Upload a hero photo and fill in its Alt text (a short description like "Living room redesign in Fishers, Indiana").',
      'Write the story in the Intro Story field. Add gallery photos below that.',
      'Flip the "Featured" toggle to pin the project to the homepage carousel.',
      'Click Publish when you are ready.',
    ],
  },
  {
    number: 3,
    title: 'Add a testimonial',
    steps: [
      'Click "Content" in the left sidebar, then "Testimonials".',
      'Click the + button to create a new testimonial.',
      'Paste the client\'s exact words into the Quote field. Do not edit them.',
      'Fill in the client\'s name, location (like "Fishers, IN"), and the source (Google, Facebook, etc.).',
      'Upload a photo if you have one. Click Publish.',
    ],
  },
  {
    number: 4,
    title: 'Write a journal post',
    steps: [
      'Click "Journal" in the left sidebar, then "Posts".',
      'Click + to start a new post.',
      'Fill in the title, slug (the URL-friendly version, auto-generated from the title), and your post body.',
      'Add a cover image with Alt text.',
      'Pick a category from the dropdown.',
      'Use the Preview tab to read through it before publishing.',
      'Click Publish when you are ready, or schedule it for later (see the tip below).',
    ],
  },
  {
    number: 5,
    title: 'Add a shop favorite',
    steps: [
      'Click "Content" in the left sidebar, then "Shop Items".',
      'Click + to create a new item.',
      'Fill in the item name, the affiliate link, a short note about why you love it, and an image.',
      'Pick which Shop Collection it belongs to from the dropdown.',
      'Click Publish.',
    ],
  },
  {
    number: 6,
    title: 'Add a press mention',
    steps: [
      'Click "Content" in the left sidebar, then "Press Items".',
      'Click + to create a new press item.',
      'Fill in the outlet name, the date, a short pull quote if you have one, and the link to the article.',
      'Upload the outlet\'s logo if you have it.',
      'Click Publish.',
    ],
  },
  {
    number: 7,
    title: 'Add a free guide',
    steps: [
      'Click "Content" in the left sidebar, then "Guides (lead magnets)".',
      'Click + to create a new guide.',
      'Fill in the title, a short summary, and upload the PDF using the file field.',
      'Add a cover image.',
      'Flip the "Published" toggle on, then click Publish.',
    ],
  },
  {
    number: 8,
    title: 'Change a price or service description',
    steps: [
      'Click "Content" in the left sidebar, then "Services".',
      'Click the service you want to update.',
      'Edit the Price Display field (for example, change "$150" to "$175").',
      'Click Publish.',
    ],
  },
  {
    number: 9,
    title: 'Update your availability, contact info, or service area',
    steps: [
      'Click "Site Settings" in the left sidebar.',
      'Find the field you want to update: Availability Status, Public Email, Phone, or Service Areas.',
      'Make the change and click Publish.',
    ],
  },
  {
    number: 10,
    title: 'Turn a section on or off',
    steps: [
      'Click "Site Settings" in the left sidebar.',
      'Click the "Section visibility" tab at the top of the form.',
      'Find the toggle for the section you want to hide or show (Portfolio, Journal, Shop, E-Design, Gift Certificates, Press, Resources, Guides, Style Quiz, Budget Calculator).',
      'Flip it off (or back on) and click Publish.',
      'The site rebuilds in about 1 to 3 minutes. When a section is off it disappears from the menu, footer, and homepage, and its own page redirects visitors to the home page instead.',
      'Turning a section off does not delete anything. All your drafts and published content stay right where they are. Turn it back on when you are ready and everything reappears.',
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudioGuide() {
  return (
    <Container width={1} padding={4}>
      <Stack space={6}>

        {/* Welcome header */}
        <Box>
          <Heading as="h1" size={3}>
            How the website works
          </Heading>
          <Box marginTop={3}>
            <Text muted size={1}>
              This is your content editor for reiddesignllc.com. Everything you change here
              appears on the live site after you hit Publish.
            </Text>
          </Box>
        </Box>

        {/* Publishing basics */}
        <Card padding={4} radius={2} shadow={1} tone="primary">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              The most important thing to know
            </Heading>
            <Text size={1}>
              Nothing goes live until you click the blue Publish button. You can edit any
              field, take a break, come back tomorrow, and the draft just sits there waiting.
              Only Publish pushes it to the real site.
            </Text>
            <Text size={1}>
              After you publish, the live site rebuilds in about 1 to 3 minutes. If you do
              not see the change right away, give it a moment and refresh.
            </Text>
          </Stack>
        </Card>

        {/* Map of the Studio */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={4}>
            <Heading as="h2" size={1}>
              The map: where everything lives
            </Heading>
            <Stack space={3}>
              <Box>
                <Text size={1} weight="semibold">Site Settings</Text>
                <Box marginTop={1}>
                  <Text size={1} muted>
                    Your contact info (email, phone), social links (Instagram, Facebook),
                    the list of cities you serve, travel fee tiers, and your availability status.
                    Think of this as your business card inside the Studio.
                  </Text>
                </Box>
              </Box>
              <Box>
                <Text size={1} weight="semibold">Pages</Text>
                <Box marginTop={1}>
                  <Text size={1} muted>
                    Every page on the site lives here. They are grouped into four buckets:
                    core pages (Home, About, Services, Portfolio, FAQ, Contact, Journal),
                    offerings (E-Design, Shop, Gift Certificates),
                    resources and tools (Resources, Style Quiz, Budget Calculator),
                    and other (Press, Privacy Policy, 404).
                    If a visitor can click to a page, it is in here somewhere.
                  </Text>
                </Box>
              </Box>
              <Box>
                <Text size={1} weight="semibold">Content</Text>
                <Box marginTop={1}>
                  <Text size={1} muted>
                    The building blocks that fill pages: services and their prices, testimonials,
                    projects (case studies), shop items and collections, guides (free PDFs),
                    press mentions, FAQ items, and philosophy values.
                    Most of the time, this is where you will be adding new things.
                  </Text>
                </Box>
              </Box>
              <Box>
                <Text size={1} weight="semibold">Journal</Text>
                <Box marginTop={1}>
                  <Text size={1} muted>
                    Your blog posts and their categories. Write a post, pick a category, publish.
                  </Text>
                </Box>
              </Box>
            </Stack>
          </Stack>
        </Card>

        {/* Photo tips */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Photo tips
            </Heading>
            <Text size={1}>
              Upload photos at least 2,000 pixels wide. The site handles resizing automatically,
              but it cannot make a small photo look better than it is.
            </Text>
            <Text size={1}>
              After uploading, click the image in the editor to set the focal point. A small
              crosshair appears. Drag it to the most important part of the photo (a face, the
              sofa, the lamp). When the site crops the image for smaller screens, it keeps
              the focal point in frame.
            </Text>
            <Text size={1}>
              Always fill in the Alt text field. Write a plain description: "Living room
              redesign in Fishers, Indiana." This helps Google find your photos and helps
              visitors who use screen readers. Skip "Photo of" or "Image of" at the start,
              and skip anything vague like "room photo."
            </Text>
          </Stack>
        </Card>

        {/* How-to steps */}
        <Box>
          <Heading as="h2" size={1} style={{ marginBottom: '1rem' }}>
            Step-by-step how-tos
          </Heading>
          <Stack space={4}>
            {howTos.map((howTo) => (
              <Card key={howTo.number} padding={4} radius={2} shadow={1} tone="default">
                <Stack space={3}>
                  <Heading as="h3" size={0}>
                    {howTo.number}. {howTo.title}
                  </Heading>
                  <Stack space={2}>
                    {howTo.steps.map((step, i) => (
                      <Text key={i} size={1}>
                        {step}
                      </Text>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Section visibility */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Launching in stages? Turn a section on or off
            </Heading>
            <Text size={1}>
              You do not have to launch every section of the site at the same time. If the shop
              is not ready, or you are still photographing projects for the portfolio, you can
              hide those sections completely until they are ready.
            </Text>
            <Text size={1}>
              Go to Site Settings, click the "Section visibility" tab, and flip the toggle off
              for whatever you want to hide. Click Publish. After about a minute or two, that
              section disappears from the menu, the footer, and the home page, and its own page
              quietly redirects visitors to the home page instead of showing a half-built page.
            </Text>
            <Text size={1}>
              When the section is ready, come back to Site Settings, flip the toggle back on,
              and publish again. Everything reappears. Your drafts and published content are
              completely safe the whole time.
            </Text>
            <Text size={1}>
              This is great for launching now and finishing things like the portfolio, shop, or
              press section on your own timeline.
            </Text>
          </Stack>
        </Card>

        {/* Schedule a publish */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Schedule a publish for later
            </Heading>
            <Text size={1}>
              You do not have to publish right now. Open any document, look for the small
              arrow icon next to the blue Publish button, and click it. You will see a
              "Schedule publish" option. Pick the date and time you want the content to
              go live. The site rebuilds automatically at that time, no action needed on
              your end.
            </Text>
            <Text size={1}>
              You can change or cancel the scheduled time any time before it fires.
            </Text>
          </Stack>
        </Card>

        {/* Leave a comment on a field */}
        <Card padding={4} radius={2} shadow={1} tone="default">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              Ask a question without changing anything
            </Heading>
            <Text size={1}>
              If you are unsure about a field and want to leave Nathan a note, hover over
              the field label and click the small speech-bubble icon that appears beside it.
              Type your question and click Submit.
            </Text>
            <Text size={1}>
              Nathan sees it the next time he opens the Studio. Comments stay attached to
              that specific field until they are resolved, so nothing gets lost in a text
              thread. This is the best way to flag something without accidentally changing
              content.
            </Text>
          </Stack>
        </Card>

        {/* SEO hints */}
        <Card padding={4} radius={2} shadow={1} tone="caution">
          <Stack space={3}>
            <Heading as="h2" size={1}>
              SEO hints
            </Heading>
            <Text size={1}>
              Some pages have an SEO Title and SEO Description field. These are what Google
              shows in search results, so they matter.
            </Text>
            <Text size={1}>
              If you see a small amber warning next to one of those fields, it means the text
              is getting too long for Google to show in full. Trim it down until the warning
              disappears. The field itself shows you how many characters you have left.
            </Text>
          </Stack>
        </Card>

        {/* Stuck */}
        <Card padding={4} radius={2} shadow={1} tone="positive">
          <Stack space={2}>
            <Heading as="h2" size={1}>
              Stuck?
            </Heading>
            <Text size={1}>
              Text Nathan. He set all of this up and can fix anything quickly.
            </Text>
          </Stack>
        </Card>

      </Stack>
    </Container>
  );
}
