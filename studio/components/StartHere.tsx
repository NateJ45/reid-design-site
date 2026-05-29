// StartHere.tsx — "Start Here" help panel for Staci.
// Renders as the first item in the desk sidebar so the editor experience
// is friendly from day one. Built with @sanity/ui primitives so it inherits
// the Studio's spacing, type scale, and color tokens automatically.
// Safe to edit by hand.

import React from 'react';
import { Box, Card, Container, Heading, Stack, Text } from '@sanity/ui';

// Each section covers one topic in plain language.
interface Section {
  heading: string;
  body: string | string[];
}

const sections: Section[] = [
  {
    heading: 'How publishing works',
    body: [
      'Edit any field, then click the blue Publish button in the bottom right. The live site rebuilds in about 1 to 3 minutes.',
      'Nothing goes live until you publish. You can save a draft and come back to it as many times as you need.',
    ],
  },
  {
    heading: 'Where to find things',
    body: [
      'Pages: every page on the site lives here. Home, About, Services, Portfolio, and all the rest.',
      'Content: the building blocks. Testimonials, services, shop items, guides, press coverage, and projects (case studies).',
      'Journal: your blog posts and categories.',
      'Site Settings: email address, social links, service area, and your availability status.',
    ],
  },
  {
    heading: 'Adding a project or case study',
    body: [
      'Go to Content, then Projects, then click the + button.',
      'Fill in the title, location, room type, and year. Add a hero photo and set the Alt text.',
      'Write the story in the Intro Story field. Add gallery photos after.',
      'Toggle Featured to pin the project to the homepage carousel.',
    ],
  },
  {
    heading: 'Photo tips',
    body: [
      'Upload photos at least 2000 pixels wide. Sanity handles resizing for the site.',
      'After upload, click the image and set the focal point. That tells the site which part of the photo to keep when it crops on smaller screens.',
      'Always fill in Alt text. Describe the room and location, like "Living room redesign in Fishers, Indiana." This helps search engines and visitors who use screen readers.',
    ],
  },
  {
    heading: 'Voice',
    body: [
      'Warm and plain, like a smart friend who happens to be a designer.',
      'Skip words like "transformative," "curated," and "elevated." Write the way you talk.',
      'No em-dashes (the long dash). Use a comma or period instead.',
    ],
  },
  {
    heading: 'Preview',
    body: 'Most pages have a Preview tab next to the form. Click it to see how the page looks on the live site before you publish.',
  },
  {
    heading: 'Stuck?',
    body: 'Text or email Nathan. He set all of this up and can fix anything quickly.',
  },
];

export default function StartHere() {
  return (
    <Container width={1} padding={4}>
      <Stack space={5}>
        {/* Page header */}
        <Box>
          <Heading as="h1" size={3}>
            Welcome, Staci
          </Heading>
          <Box marginTop={3}>
            <Text muted size={1}>
              This is your content editor for reiddesignllc.com. Everything you
              change here appears on the live site after you publish.
            </Text>
          </Box>
        </Box>

        {/* Section cards */}
        {sections.map((section) => (
          <Card
            key={section.heading}
            padding={4}
            radius={2}
            shadow={1}
            tone="default"
          >
            <Stack space={3}>
              <Heading as="h2" size={1}>
                {section.heading}
              </Heading>
              {Array.isArray(section.body) ? (
                <Stack space={2}>
                  {section.body.map((line, i) => (
                    <Text key={i} size={1}>
                      {line}
                    </Text>
                  ))}
                </Stack>
              ) : (
                <Text size={1}>{section.body}</Text>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
