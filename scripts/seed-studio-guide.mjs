// Seed studioGuide and studioNotes singletons with the content that was
// previously hardcoded in StudioGuide.tsx and BusinessOverview.tsx.
// Run ONCE after deploying the new schemas to Sanity Studio.
//
// Run: node scripts/seed-studio-guide.mjs
// (Do NOT run during an active editing session — createOrReplace is safe
// but it will overwrite any in-progress edits in those documents.)

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()];
    }),
);

const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';
const token = env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token });

// ─── studioGuide document ────────────────────────────────────────────────────
// Verbatim content from studio/components/StudioGuide.tsx (before migration).

const studioGuideDoc = {
  _id: 'studioGuide',
  _type: 'studioGuide',
  guideTitle: 'How the website works',
  guideIntro:
    'This is your content editor for reiddesignllc.com. Everything you change here appears on the live site after you hit Publish.',
  studioMap: [
    {
      _key: 'm1',
      _type: 'mapRow',
      area: 'Site Settings',
      description:
        'Your contact info (email, phone), social links (Instagram, Facebook), the list of cities you serve, travel fee tiers, and your availability status. Think of this as your business card inside the Studio.',
    },
    {
      _key: 'm2',
      _type: 'mapRow',
      area: 'Pages',
      description:
        'Every page on the site lives here. They are grouped into four buckets: core pages (Home, About, Services, Portfolio, FAQ, Contact, Journal), offerings (E-Design, Shop, Gift Certificates), resources and tools (Resources, Style Quiz, Budget Calculator), and other (Press, Privacy Policy, 404). If a visitor can click to a page, it is in here somewhere.',
    },
    {
      _key: 'm3',
      _type: 'mapRow',
      area: 'Content',
      description:
        'The building blocks that fill pages: services and their prices, testimonials, projects (case studies), shop items and collections, guides (free PDFs), press mentions, FAQ items, and philosophy values. Most of the time, this is where you will be adding new things.',
    },
    {
      _key: 'm4',
      _type: 'mapRow',
      area: 'Journal',
      description:
        'Your blog posts and their categories. Write a post, pick a category, publish.',
    },
  ],
  howTos: [
    {
      _key: 'h1',
      _type: 'howTo',
      title: "Edit a page's words or photos",
      steps: [
        'Click "Pages" in the left sidebar, then pick the page you want to update.',
        'Edit any field directly in the form on the left.',
        'Click the "Preview" tab at the top to see how it looks before you publish.',
        'When you are happy, click the blue "Publish" button at the bottom right. The live site updates in about 1 to 3 minutes.',
      ],
    },
    {
      _key: 'h2',
      _type: 'howTo',
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
      _key: 'h3',
      _type: 'howTo',
      title: 'Add a testimonial',
      steps: [
        'Click "Content" in the left sidebar, then "Testimonials".',
        'Click the + button to create a new testimonial.',
        "Paste the client's exact words into the Quote field. Do not edit them.",
        'Fill in the client\'s name, location (like "Fishers, IN"), and the source (Google, Facebook, etc.).',
        'Upload a photo if you have one. Click Publish.',
      ],
    },
    {
      _key: 'h4',
      _type: 'howTo',
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
      _key: 'h5',
      _type: 'howTo',
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
      _key: 'h6',
      _type: 'howTo',
      title: 'Add a press mention',
      steps: [
        'Click "Content" in the left sidebar, then "Press Items".',
        'Click + to create a new press item.',
        'Fill in the outlet name, the date, a short pull quote if you have one, and the link to the article.',
        "Upload the outlet's logo if you have it.",
        'Click Publish.',
      ],
    },
    {
      _key: 'h7',
      _type: 'howTo',
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
      _key: 'h8',
      _type: 'howTo',
      title: 'Change a price or service description',
      steps: [
        'Click "Content" in the left sidebar, then "Services".',
        'Click the service you want to update.',
        'Edit the Price Display field (for example, change "$150" to "$175").',
        'Click Publish.',
      ],
    },
    {
      _key: 'h9',
      _type: 'howTo',
      title: 'Update your availability, contact info, or service area',
      steps: [
        'Click "Site Settings" in the left sidebar.',
        'Find the field you want to update: Availability Status, Public Email, Phone, or Service Areas.',
        'Make the change and click Publish.',
      ],
    },
    {
      _key: 'h10',
      _type: 'howTo',
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
  ],
  tips: [
    {
      _key: 't1',
      _type: 'tip',
      tone: 'primary',
      heading: 'The most important thing to know',
      body: `Nothing goes live until you click the blue Publish button. You can edit any field, take a break, come back tomorrow, and the draft just sits there waiting. Only Publish pushes it to the real site.\n\nAfter you publish, the live site rebuilds in about 1 to 3 minutes. If you do not see the change right away, give it a moment and refresh.`,
    },
    {
      _key: 't2',
      _type: 'tip',
      tone: 'default',
      heading: 'Photo tips',
      body: `Upload photos at least 2,000 pixels wide. The site handles resizing automatically, but it cannot make a small photo look better than it is.\n\nAfter uploading, click the image in the editor to set the focal point. A small crosshair appears. Drag it to the most important part of the photo (a face, the sofa, the lamp). When the site crops the image for smaller screens, it keeps the focal point in frame.\n\nAlways fill in the Alt text field. Write a plain description: "Living room redesign in Fishers, Indiana." This helps Google find your photos and helps visitors who use screen readers. Skip "Photo of" or "Image of" at the start, and skip anything vague like "room photo."`,
    },
    {
      _key: 't3',
      _type: 'tip',
      tone: 'default',
      heading: 'Launching in stages? Turn a section on or off',
      body: `You do not have to launch every section of the site at the same time. If the shop is not ready, or you are still photographing projects for the portfolio, you can hide those sections completely until they are ready.\n\nGo to Site Settings, click the "Section visibility" tab, and flip the toggle off for whatever you want to hide. Click Publish. After about a minute or two, that section disappears from the menu, the footer, and the home page, and its own page quietly redirects visitors to the home page instead of showing a half-built page.\n\nWhen the section is ready, come back to Site Settings, flip the toggle back on, and publish again. Everything reappears. Your drafts and published content are completely safe the whole time.\n\nThis is great for launching now and finishing things like the portfolio, shop, or press section on your own timeline.`,
    },
    {
      _key: 't4',
      _type: 'tip',
      tone: 'default',
      heading: 'Schedule a publish for later',
      body: `You do not have to publish right now. Open any document, look for the small arrow icon next to the blue Publish button, and click it. You will see a "Schedule publish" option. Pick the date and time you want the content to go live. The site rebuilds automatically at that time, no action needed on your end.\n\nYou can change or cancel the scheduled time any time before it fires.`,
    },
    {
      _key: 't5',
      _type: 'tip',
      tone: 'default',
      heading: 'Ask a question without changing anything',
      body: `If you are unsure about a field and want to leave Nathan a note, hover over the field label and click the small speech-bubble icon that appears beside it. Type your question and click Submit.\n\nNathan sees it the next time he opens the Studio. Comments stay attached to that specific field until they are resolved, so nothing gets lost in a text thread. This is the best way to flag something without accidentally changing content.`,
    },
    {
      _key: 't6',
      _type: 'tip',
      tone: 'caution',
      heading: 'SEO hints',
      body: `Some pages have an SEO Title and SEO Description field. These are what Google shows in search results, so they matter.\n\nIf you see a small amber warning next to one of those fields, it means the text is getting too long for Google to show in full. Trim it down until the warning disappears. The field itself shows you how many characters you have left.`,
    },
    {
      _key: 't7',
      _type: 'tip',
      tone: 'positive',
      heading: 'Stuck?',
      body: 'Text Nathan. He set all of this up and can fix anything quickly.',
    },
  ],
};

// ─── studioNotes document ────────────────────────────────────────────────────
// Verbatim content from studio/components/BusinessOverview.tsx (before migration).

const studioNotesDoc = {
  _id: 'studioNotes',
  _type: 'studioNotes',
  businessSummary: `Reid Design LLC is a residential interior design studio based in Plainfield, Indiana. You serve Plainfield, Indianapolis, and the surrounding suburbs: Carmel, Fishers, Westfield, Zionsville, and Noblesville.\n\nThe studio is warm and approachable. You show prices openly. You are mid-market, not white-glove. Your entry point is a $150 in-home consultation, which keeps the door low enough for homeowners who are not sure yet.`,
  idealClient: `A homeowner in Plainfield or the Indy suburbs. Their home feels off, and they do not know where to start. They have the budget for design help but are not shopping at the luxury tier. They usually find you on Instagram or through a referral from a friend or neighbor.\n\nThey are not looking for a high-end showroom experience. They want a smart friend who happens to be a designer, someone who will be honest with them, knows what works in real houses, and will not make them feel bad about their current furniture.`,
  voiceSummary: `Warm, plain-spoken, like a smart friend who happens to be a designer. Say prices plainly, no hedging. Be specific about real rooms and real situations. Write the way you talk.\n\nNo em-dashes: that is the long dash. Use a comma or period instead. The website's style guide skips them entirely.\n\nStop when you are done: end the paragraph. Do not add a closing sentence that restates the point. Two sentences that say the same thing is one sentence too many.`,
  wordsToAvoid: ['transformative', 'curated', 'elevated', 'tailored', 'investment in your space'],
};

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run() {
  await client.createOrReplace(studioGuideDoc);
  console.log('[ok] seeded studioGuide');

  await client.createOrReplace(studioNotesDoc);
  console.log('[ok] seeded studioNotes');

  console.log('[ok] seeded studioGuide + studioNotes');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
