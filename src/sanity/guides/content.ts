// Safe to edit by hand
// =============================================================================
// Site Guide content for Reid Design: plain-language how-tos for Staci
// =============================================================================
// PORTS.md cards 41 and 106. This is DATA, not code: each guide is a list of
// typed blocks, rendered read-only by GuideView, searched and printed by the
// Site Guide tool (src/sanity/kit/GuideTool.tsx), and offered beside each
// document in "Help for this page" (GUIDES_FOR_TYPE at the bottom).
//
// 2026-10-18: these replace the how-tos that lived in the `studioGuide`
// document ("Start Here > How the website works"). Those were seeded by a
// script, said "the blue Publish button" and "the Preview tab", and could be
// deleted by the person who needed them. The useful ones are rewritten here in
// today's Studio words; the old document is left in the dataset untouched.
//
// Rules for editing:
//   - **double asterisks** for a word worth emphasis.
//   - `backticks` for a THING YOU CLICK (it renders as a small button chip).
//   - _underscores_ for a light aside.
//   - No em-dashes. Commas, colons, or "and".
//   - The service scope holds in every example: Staci styles around the
//     existing basics (furniture, color and paint, decor, rugs, basic hardware
//     and fixture swaps, light trim). Nothing here may suggest remodeling,
//     cabinets, tile, appliances or moving walls.
//   - src/lib/studio-guides.test.ts checks the structure (slugs, categories,
//     "See also" titles, em-dashes).
// =============================================================================

export type DiyLevel = 'self' | 'ask' | 'mixed';

/** Where a "Where in the Studio" breadcrumb can link to. */
export type PathLink = { doc: string; type?: string } | { pane: string } | { tool: string };

export type GuideBlock =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'path'; items: string[]; link?: PathLink }
  | {
      kind: 'callout';
      tone?: 'primary' | 'positive' | 'caution' | 'critical' | 'default';
      title?: string;
      text: string;
    }
  | { kind: 'seealso'; items: string[] };

/** Names the prose refers to. */
export const SITE = {
  /** Who Staci asks when a guide does not cover it. */
  contactName: 'Nathan',
};

export const GUIDE_CATEGORIES = [
  'Start here',
  'Room stories',
  'Pages and words',
  'Services, prices and reviews',
  'Pictures',
  'Housekeeping',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export interface Guide {
  slug: string;
  category: GuideCategory;
  title: string;
  /** A name from GUIDE_ICONS in src/sanity/components/GuideView.tsx. */
  icon: string;
  lead: string;
  diy: DiyLevel;
  body: GuideBlock[];
  /**
   * Optional short clip of the job being done (PORTS.md card 115): a file in
   * public/ ("/guides/<slug>.mp4"), or a YouTube or Vimeo link. Shows under
   * "Watch how it is done" on Home and in the Site Guide. Under two minutes.
   */
  video?: string;
}

export const guides: Guide[] = [
  // ---------------------------------------------------------------- Start here
  {
    slug: 'start-here',
    category: 'Start here',
    title: 'Start here: how this all works',
    icon: 'info',
    lead: 'Two minutes that make everything else make sense.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'The Studio and the website are two different things' },
      {
        kind: 'p',
        text: 'What you are looking at now is the **Studio**. It is private, and it is where reiddesignllc.com gets edited. The **website** is what your clients see. You change things here, and they appear on the website a few minutes later.',
      },
      { kind: 'h', text: 'You cannot break the website by editing' },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Nothing is live until you press Publish.',
        text: 'While you type you are editing a private **draft**. The website does not change at all until you click `Publish`. So open things, click around, and only publish when it looks right. If you make a mess and have not published, click `Discard changes` in the menu beside Publish and it goes back to how it was.',
      },
      { kind: 'h', text: 'How a change reaches the website' },
      {
        kind: 'steps',
        items: [
          'Open the page or list you want from `Content` in the top bar, or from a button on Home.',
          'Change the words or pictures. Your typing saves itself as a draft as you go.',
          'When it looks right, click `Publish` at the bottom right.',
          'Give it about three minutes. The line under the top bar says "Updating the website" and then "Website up to date".',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Give it a few minutes.',
        text: 'The website is built ahead of time so it loads fast on a phone, which means it rebuilds in the background after each Publish. Publish, make a coffee, then refresh the page you changed.',
      },
      { kind: 'seealso', items: ['What Home shows you', 'Change the words on a page'] },
    ],
  },
  {
    slug: 'studio-home',
    category: 'Start here',
    title: 'What Home shows you',
    icon: 'home',
    lead: 'The page the Studio opens on, card by card.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**The big buttons**: your most common jobs, one click each. Start a room story, change a price, add a review, update your Google rating.',
          '**This week**: a short list of the jobs that keep enquiries coming. Some tick themselves when the Studio can see they are done; the rest you tick by hand, and the list starts fresh every Monday.',
          '**Is it live?**: whether your last Publish has reached the website yet.',
          '**Fix-it list**: anything the Checkup found, by name, with an `Edit` button that opens the right box.',
          '**Coming up**: room stories set to publish themselves on a day you picked.',
          '**Pick up where you left off**: drafts you started and have not published.',
          '**Visitors**: how many people came to the website this week, which pages they read, and how they found you.',
          '**Your pages**: every page and list on the website, one click away.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Visitors says "not set up yet"?',
        text: 'The visitor numbers need a setting only Nathan can add. Nothing else is affected.',
      },
      { kind: 'seealso', items: ['The line under the top bar', 'Help for this page'] },
    ],
  },
  {
    slug: 'website-status',
    category: 'Start here',
    title: 'The line under the top bar',
    icon: 'activity',
    lead: 'It tells you whether the website has caught up with you.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**Website up to date**: everything you published is on the website.',
          '**Updating the website, about 3 minutes**: you just published and the website is rebuilding. Carry on working.',
          '**Taking longer than usual**: it has been more than a quarter of an hour. Usually it catches up by itself. If it still says this an hour later, tell Nathan.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'No line at all?',
        text: 'Then the Studio could not ask the website when it was last built. Your edits are still safe; it only means the line has nothing to report.',
      },
    ],
  },
  {
    slug: 'help-panel',
    category: 'Start here',
    title: 'Help for this page',
    icon: 'bulb',
    lead: 'The panel beside any page with tips for exactly that page.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open any page, room story or list item.',
          'Click `Help for this page` at the top right of the form.',
          'The panel shows anything worth a look on this page (a photo with no description, an empty section), then the guides that fit it.',
        ],
      },
      {
        kind: 'p',
        text: 'Nothing in the panel stops you publishing. It is a second pair of eyes.',
      },
    ],
  },

  // -------------------------------------------------------------- Room stories
  {
    slug: 'first-room-story',
    category: 'Room stories',
    title: 'Publish your first room story',
    icon: 'image',
    lead: 'One finished room, told in a few short paragraphs and 8 to 12 photos.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A room story is the page a client reads before they decide to book. It does not need to be long. It needs real photos, the problem you solved, and the one decision everything else followed.',
      },
      { kind: 'h', text: 'Before you start' },
      {
        kind: 'bullets',
        items: [
          'Pick the room: one you are proud of, finished and styled.',
          'Have 8 to 12 photos ready on your computer: a wide shot, a before from the same spot if you have one, and close-ups of the details.',
          'Ask the client if they are happy for you to show their home, and whether you can mention what it cost. You will tick their answers in the story.',
        ],
      },
      { kind: 'h', text: 'Step by step' },
      {
        kind: 'steps',
        items: [
          'On Home, click `Start a room story`. A new story opens with its parts already in place and every piece of text in [square brackets].',
          'Replace each bracket with your own words. Each one says what goes there: the room and town, the brief in one sentence, your design call in one sentence, then the story in three short parts.',
          'Under `Hero image`, upload your best wide shot and type a short description of it in `Alt text`, like "Living room in Avon with a sage sofa and a jute rug".',
          'Add the rest under `Project photos`. Drag them into the order you want them seen. Before and after pairs go under `Before / after pairs`.',
          'Under `Client OK to share`, tick what the client agreed to. Leave the price line out if they would rather it stayed private.',
          'Click `Generate` beside `Slug` to make the web address, like /portfolio/avon-living-room/.',
          'Open `Live preview` from the top bar to see the page as clients will see it.',
          'Click `Publish`. The story appears on the Portfolio page within a few minutes.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Keep to what you did in the room.',
        text: 'Describe the furniture, color and paint, rugs, lighting, art, hardware swaps and trim you chose. Do not describe new cabinets, tile, appliances or moved walls, even in passing: the website promises styling around what a home already has.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'It does not have to be perfect.',
        text: 'You can come back and change any word or photo later, and the story stays at the same address.',
      },
      {
        kind: 'seealso',
        items: [
          'Publish a room story on a day you pick',
          'Add or change a picture',
          'Show a draft to someone before it goes live',
        ],
      },
    ],
  },
  {
    slug: 'schedule-a-story',
    category: 'Room stories',
    title: 'Publish a room story on a day you pick',
    icon: 'clock',
    lead: 'Finish it tonight, have it appear on Tuesday morning.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Finish the room story, but do not click Publish.',
          'Open the `Publishing` box at the bottom of the story and set `Publish automatically at` to the day and time you want.',
          'Leave the Studio. Your story shows under **Coming up** on Home until then.',
          'At that time the website publishes it for you and rebuilds. Give it half an hour either side.',
        ],
      },
      {
        kind: 'p',
        text: 'Changed your mind? Clear the date, or just click `Publish` yourself whenever you like.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Good for timing a story with a post.',
        text: 'Pick the morning you plan to share the room on Instagram, so the link in your post goes straight to the full story.',
      },
    ],
  },
  {
    slug: 'room-story-photos',
    category: 'Room stories',
    title: 'Photos that make a room story work',
    icon: 'image',
    lead: 'Three kinds of shot, and the order to show them.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**The wide shot**: the whole room and how it works. This is your hero image.',
          '**The before**: from the exact spot of the after, same height and zoom, so the two line up. It is allowed to look messy.',
          '**The details**: the throw on the sofa arm, the new hardware, the lamp you hunted for. These are the easiest shots to make look designed.',
        ],
      },
      {
        kind: 'p',
        text: 'Turn on every lamp, open the curtains, and shoot from a corner at chest height. Upload the photos straight from the camera or phone: the website shrinks them for you.',
      },
      {
        kind: 'p',
        text: '_There is a longer photo checklist under Start Here, "Grow your studio", in the Content list._',
      },
    ],
  },

  // ----------------------------------------------------------- Pages and words
  {
    slug: 'edit-a-page',
    category: 'Pages and words',
    title: 'Change the words on a page',
    icon: 'document',
    lead: 'See the real page as you type.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Click `Live preview` in the top bar.',
          'Pick the page from the list on the left. The real page appears beside it.',
          'Click any words on the page to jump to the box that holds them.',
          'Type. The page updates as you go.',
          'Click `Publish` when it reads right.',
        ],
      },
      {
        kind: 'p',
        text: 'You can also open a page from `Content`, then `Pages`, and edit the boxes directly. Every page has its own boxes in the order the page shows them.',
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Live preview shows your draft.',
        text: 'What you see there is your unpublished draft, not the website. That is the point: you see the change before any client does.',
      },
      { kind: 'seealso', items: ['Check a page before you publish', 'Undo a change'] },
    ],
  },
  {
    slug: 'extra-sections',
    category: 'Pages and words',
    title: 'Add, move or hide a section on a main page',
    icon: 'blocks',
    lead: 'Home, About, Services, Process and E-Design can be rearranged.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the page, then the `Page layout` box near the top.',
          'Each built-in part of the page is a row. Drag a row to move that part up or down.',
          'Click `Add item` between two rows to drop in an extra section: a banner, a photo gallery, a quote, a call to action and more.',
          'To hide a part, remove its row. Nothing is deleted: add the row back and the part returns with its words.',
          'Check it in `Live preview`, then click `Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'The FAQ, Contact, Portfolio and Privacy pages have an `Extra sections` box near the bottom instead. Whatever you add there shows at the foot of that page.',
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'The design looks after itself.',
        text: 'Colors, spacing and fonts are set by where a section sits, so a page always looks like the rest of the website.',
      },
    ],
  },
  {
    slug: 'add-a-page',
    category: 'Pages and words',
    title: 'Add a new page',
    icon: 'add',
    lead: 'A page of your own, from a ready-made layout or from blank.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Pages`, then `Pages you build`, and click `+`.',
          'Pick a starting point: `Service page`, `Town page`, `Seasonal styling offer`, `What happens at a consultation`, `Simple page` or `Blank page`. A ready-made one arrives with its sections in place and every piece of text in [square brackets] saying what to write.',
          'Type the page title, then click `Generate` beside the web address.',
          'Replace every bracket, including the ones in the `SEO` tab, and add your photos.',
          'To put it in the menu, open the `Menu placement` tab and turn on `Show in the top menu`. Leave it off to keep the page unlisted and just share its link.',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Think about the web address before you publish.',
        text: 'Changing it later breaks links people have saved. If you have to, the Studio files a forward from the old address for you; see the guide on renaming.',
      },
      {
        kind: 'seealso',
        items: ['Start a page from a ready-made layout', 'Rename a page without breaking links'],
      },
    ],
  },
  {
    slug: 'page-templates',
    category: 'Pages and words',
    title: 'Start a page from a ready-made layout',
    icon: 'blocks',
    lead: 'Which layout to pick, and what each one gives you.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**Service page**: one service explained in full. What they get, how the visit works, what it costs, a client quote.',
          '**Town page**: for a town you work in, like Carmel or Avon. The homes there, recent rooms, a client from that town. Good for being found on Google.',
          '**Seasonal styling offer**: holiday styling or a spring refresh, with what is included, the dates and how to book.',
          '**What happens at a consultation**: for someone about to book and a little nervous. What you cover, how to get ready, what comes after.',
          '**Simple page**: a banner, some words, photos and a way to get in touch.',
          '**Blank page**: nothing yet; add sections yourself.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Replace every [square bracket].',
        text: 'Each one says what to write there. While any are left, a yellow note under the sections says so, and the page would show the brackets to clients.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Keep to styling.',
        text: 'Every layout talks about furniture, color and paint, decor, rugs, lighting, hardware and trim. Keep it that way: nothing about cabinets, tile, appliances or moving walls.',
      },
      { kind: 'seealso', items: ['Add a new page', 'Reuse a section on other pages'] },
    ],
  },
  {
    slug: 'reuse-sections',
    category: 'Pages and words',
    title: 'Reuse a section on other pages',
    icon: 'copy',
    lead: 'Save a band once, add it anywhere: as your own copy, or synced.',
    diy: 'self',
    body: [
      { kind: 'h', text: 'Save a section' },
      {
        kind: 'steps',
        items: [
          'Open the page that has the section you like.',
          'Click the small arrow beside `Publish` and choose `Save a section as preset...`.',
          'Tick the section (or several that go together), give it a name, and save.',
          'It is kept under `Content`, then `Pages`, then `Saved sections`.',
        ],
      },
      { kind: 'h', text: 'Add it to another page' },
      {
        kind: 'steps',
        items: [
          'Open the other page and find its sections list.',
          'Click `Insert a saved section` under the list and pick one.',
          '`Add a copy` gives this page its own copy to change freely. `Add synced` shows the saved section itself, so it stays the same everywhere.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'A copy is yours to change.',
        text: 'Changing a copy changes only that page. Changing the saved section later does not touch the copies.',
      },
      { kind: 'seealso', items: ['Keep a section the same on every page'] },
    ],
  },
  {
    slug: 'synced-sections',
    category: 'Pages and words',
    title: 'Keep a section the same on every page',
    icon: 'sync',
    lead: 'A synced section changes everywhere when you change it once.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'Good for the things that should always match: your booking band, your service area line, a review you want on several pages.',
      },
      {
        kind: 'steps',
        items: [
          'Add the saved section to each page with `Insert a saved section`, then `Add synced`.',
          'To change it, open `Content`, then `Pages`, then `Saved sections`, change it, and click `Publish`.',
          'Every page that shows it updates with the next website update.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Changing it changes it everywhere.',
        text: 'If one page needs different words, use `Add a copy` on that page instead.',
      },
    ],
  },
  {
    slug: 'seasonal-patterns',
    category: 'Pages and words',
    title: 'Add a seasonal band to a page',
    icon: 'clock',
    lead: 'Holiday styling, a spring refresh, "booking for next season": ready to drop in.',
    diy: 'self',
    body: [
      {
        kind: 'p',
        text: 'A few saved sections come ready for the times of year clients think about their homes: holiday styling, a spring refresh, a fall "get ready for hosting" band, and "booking for next season" when your calendar fills.',
      },
      {
        kind: 'steps',
        items: [
          'Open the page (Home works well), find its sections list, and click `Insert a saved section`.',
          'Pick the one for the season and choose `Add a copy`.',
          'Replace the [square brackets] with your dates and words, and move it where you want it.',
          'Click `Publish`. Remove it again when the season is over.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Use "Add a copy", not "Add synced", for these.',
        text: 'Each season you will want different dates and words, so a copy you can change is the right fit.',
      },
      { kind: 'seealso', items: ['Post an announcement'] },
    ],
  },
  {
    slug: 'accent-word',
    category: 'Pages and words',
    title: 'Add a handwritten accent word to a heading',
    icon: 'document',
    lead: 'One word in the script lettering, like on your Instagram graphics.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Find the heading on the page. Many have an `accent` box right below them.',
          'Type ONE word that already appears in the heading, spelled exactly the same.',
          'That word shows in the handwritten lettering; the rest stays in the usual type.',
          'Leave the box empty for no accent.',
        ],
      },
      {
        kind: 'p',
        text: 'Use it on one word per heading, and not on every heading, so it stays special.',
      },
    ],
  },
  {
    slug: 'announcement',
    category: 'Pages and words',
    title: 'Post an announcement',
    icon: 'bolt',
    lead: 'A bar across the top of the website, or a popup, for a few days or weeks.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Announcements`, and click `+`. Or on your phone, use `Quick update`, then `Post a notice`.',
          'Give it a name for you only, like "Booking for spring".',
          'Write the message, one or two short sentences.',
          'Pick `Bar across the top` or `Popup window`, and a look: calm, warm or urgent.',
          'Set `Show until` so it takes itself down. `Show from` is optional.',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'Good uses: "Booking consultations for March", "Studio closed Thanksgiving week", a holiday styling offer.',
      },
    ],
  },
  {
    slug: 'section-visibility',
    category: 'Pages and words',
    title: 'Turn a part of the website on or off',
    icon: 'check',
    lead: 'Hide the Portfolio or E-Design pages until you are ready.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then the `Section visibility` tab.',
          'Turn the switch for Portfolio or E-Design off, or back on.',
          'Click `Publish`. In a few minutes the part leaves the menu, footer and home page, and its page forwards visitors to the home page.',
        ],
      },
      {
        kind: 'callout',
        tone: 'positive',
        title: 'Turning it off deletes nothing.',
        text: 'Your words and photos stay where they are. Turn it back on and everything returns.',
      },
    ],
  },
  {
    slug: 'about-off-the-clock',
    category: 'Pages and words',
    title: 'Fill in the "Off the clock" part of About',
    icon: 'document',
    lead: 'A few personal answers clients love to read.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Pages`, then `About`.',
          'Scroll to the personal section: `Currently`, `Rapid fire`, `Favorite local spots`, `Beyond design` and a candid photo.',
          'Fill in whatever feels right and leave the rest empty.',
          'The section stays hidden until `Personal section headline` has words in it, so nothing shows half finished.',
          'Click `Publish`.',
        ],
      },
    ],
  },
  {
    slug: 'rename-a-page',
    category: 'Pages and words',
    title: 'Rename a page without breaking links',
    icon: 'arrow',
    lead: 'The Studio files a forward from the old address for you.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Change the web address (the slug) of a published page or room story.',
          'Click `Publish`. The Studio files a forward from the old address to the new one before it publishes.',
          'Anyone using an old link lands on the new page.',
        ],
      },
      {
        kind: 'p',
        text: 'The forwards are listed under `Content`, `Pages`, `Redirects (old links)`. Add one by hand for an address that never existed here, like an old Squarespace link someone still shares.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Forwards cost nothing to keep.',
        text: 'Leave them in place. Removing one breaks the old link again.',
      },
    ],
  },
  {
    slug: 'share-a-preview',
    category: 'Pages and words',
    title: 'Show a draft to someone before it goes live',
    icon: 'copy',
    lead: 'A private link to your draft for a client or a friend.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open the page. Click the small arrow beside `Publish` and choose `Share a preview`.',
          'Pick how long the link should work: 1, 3, 7 or 14 days.',
          'Copy the link and send it in a text or an email. They see your draft as the website will show it, without signing in.',
          'Done with it early? Open `Share a preview` again and click `Stop this link`.',
        ],
      },
      {
        kind: 'p',
        text: 'For a quick look, `Copy share link` in the same menu makes a link that works for about an hour.',
      },
    ],
  },
  {
    slug: 'check-page',
    category: 'Pages and words',
    title: 'Check a page before you publish',
    icon: 'search',
    lead: 'A second pair of eyes for photos, empty sections and links.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Click the small arrow beside `Publish` and choose `Check this page...`.',
          'It reads your draft and lists photos with no description, sections with nothing in them, and links to an address on this site where no page lives.',
          'Fix what you agree with. Nothing in it stops you publishing.',
        ],
      },
      { kind: 'seealso', items: ['Help for this page'] },
    ],
  },
  {
    slug: 'undo',
    category: 'Pages and words',
    title: 'Undo a change',
    icon: 'restore',
    lead: 'Today, this week, or further back.',
    diy: 'mixed',
    body: [
      { kind: 'h', text: 'Just now' },
      {
        kind: 'p',
        text: 'Click the small arrow beside `Publish` and choose `Undo last change`, as many times as you need. `Redo` puts it back. Ctrl+Z and Ctrl+Shift+Z do the same when you are not typing in a box (Cmd on a Mac).',
      },
      { kind: 'h', text: 'Since you last published' },
      {
        kind: 'p',
        text: '`Discard changes` in the same menu throws away the whole draft and goes back to what is on the website.',
      },
      { kind: 'h', text: 'Earlier this week or before' },
      {
        kind: 'p',
        text: 'The Studio keeps a few days of history (the clock icon at the top right of a page). For anything older, tell Nathan the page and the day it was right: there is a nightly copy of the whole website he can bring one page back from, as a draft for you to check.',
      },
    ],
  },
  {
    slug: 'menus-and-footer',
    category: 'Pages and words',
    title: 'Change the menu or the footer',
    icon: 'menu',
    lead: 'The top menu, the header button and the footer links.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Site settings`, then the `Menus & header button` tab.',
          'Drag menu items to reorder them, or add one with `Add item`.',
          'The footer columns and its small print links are in the same tab.',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'A short menu books more consultations.',
        text: 'Every extra item makes the one that matters harder to find. Keep it to six or so.',
      },
    ],
  },

  // ------------------------------------------- Services, prices and reviews
  {
    slug: 'prices',
    category: 'Services, prices and reviews',
    title: 'Change a price or a service',
    icon: 'document',
    lead: 'The paint-chip prices on Services and the home page.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'On Home, click `Change a price`. Or open `Content`, then `Prices, reviews and lists`, then `Services and prices`.',
          'Click the service.',
          'Change `Price display`, exactly as clients should read it. Start it with "Starting at" when the price can go up with the size of the job.',
          'Change `Internal price (number)` to match: it feeds the price Google sees.',
          'Edit the short description and features if what is included has changed.',
          'Click `Publish`. Every page that shows that price updates.',
        ],
      },
      {
        kind: 'p',
        text: 'Drag services up or down in the list to change their order on the website. E-Design has its own prices on the E-Design page.',
      },
      {
        kind: 'callout',
        tone: 'caution',
        title: 'Describe styling, not construction.',
        text: 'Furniture, color and paint, decor, rugs, lighting, hardware and trim. Not cabinets, tile, appliances or changing the layout.',
      },
    ],
  },
  {
    slug: 'google-rating',
    category: 'Services, prices and reviews',
    title: 'Update your Google rating',
    icon: 'check',
    lead: 'The stars on Home, Services, About and Contact.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Look up "Reid Design" on Google and note the rating, the number beside the stars.',
          'On Home, click `Update your Google rating`. It opens `Site settings` at the `Reviews` tab.',
          'Type the rating into `Google star rating` and set `Rating last checked` to today.',
          'Paste the `"Leave a review" link` from your Google profile if it has changed: on Google, `Ask for reviews`, then `Copy link`.',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'Home asks you once a month. The website never shows a review count, because a typed number goes out of date.',
      },
      { kind: 'seealso', items: ['Add a client review'] },
    ],
  },
  {
    slug: 'add-review',
    category: 'Services, prices and reviews',
    title: 'Add a client review',
    icon: 'add',
    lead: 'A Google review, a kind text, an email: their words, on your website.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'On Home, click `Add a review`. On your phone, use `Quick update`, then `Add a review`.',
          'Paste their words exactly as they wrote them. Do not tidy them up.',
          'Add their first name and town, like "Jen, Avon".',
          'Pick where it came from. For Google, pick the stars too, and paste the link to the review if you have it.',
          'Click `Publish`. Google reviews with stars appear on the home page by themselves, newest first.',
        ],
      },
      {
        kind: 'p',
        text: 'To keep one off the website without deleting it, tick `Hide on the website`.',
      },
    ],
  },
  {
    slug: 'press',
    category: 'Services, prices and reviews',
    title: 'Add a press mention',
    icon: 'add',
    lead: 'Featured in a magazine, a blog or a podcast? Put it on the website.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Prices, reviews and lists`, then `Press`, and click `+`.',
          'Type where it appeared, like "Indianapolis Monthly", and the date it came out.',
          'Paste the link if it is online, and a short line they wrote about you, exactly as written, if there is one.',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'p',
        text: 'It shows wherever a `Press mentions` section sits, newest first. To add that section to a page, open the page, `Add item` in its sections, and pick `Press mentions` under "Reviews and press". Nothing shows until there is at least one mention.',
      },
    ],
  },
  {
    slug: 'availability',
    category: 'Services, prices and reviews',
    title: 'Availability, service areas and travel fees',
    icon: 'clock',
    lead: 'The line by the green dot on Contact, the towns you serve, what travel costs.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Prices, reviews and lists`, then `Business info (areas, travel, availability)`.',
          'Change `Availability status`, like "Booking for spring 2027".',
          'Add or remove a town under `Service areas`, or change a travel fee.',
          'Click `Publish`. Contact, Services, the footer and what Google reads all update together.',
        ],
      },
      {
        kind: 'p',
        text: 'Your email and phone number are in `Site settings`, on the `Identity & contact` tab.',
      },
    ],
  },

  // ------------------------------------------------------------------ Pictures
  {
    slug: 'images-and-alt',
    category: 'Pictures',
    title: 'Add or change a picture',
    icon: 'image',
    lead: 'And the one sentence every picture needs.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Click the picture box, then `Upload` (or drag a photo in), or `Select` to reuse one from your library.',
          'Click the crop icon and drag the circle onto the part of the photo that matters, so phones crop around it.',
          'Fill in `Alt text`: what the photo shows, in one plain sentence, like "Dining room with a round walnut table under a linen pendant".',
          'Click `Publish`.',
        ],
      },
      {
        kind: 'callout',
        tone: 'primary',
        title: 'Why the description matters.',
        text: 'Google reads it, and so do people who use a screen reader. The Checkup lists any picture that is missing one.',
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Do not shrink photos before uploading.',
        text: 'Upload the original. The website makes the right sizes for phones and laptops by itself.',
      },
    ],
  },
  {
    slug: 'home-hero',
    category: 'Pictures',
    title: 'The photos at the top of the home page',
    icon: 'home',
    lead: 'One photo, or a slow slideshow of a few.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open `Content`, then `Pages`, then `Home`, and find `Hero images`.',
          'One photo shows as a still. Two or more fade slowly into each other.',
          'Drag your strongest photo to the top: it is the one every visitor sees first.',
          'Click `Publish`.',
        ],
      },
    ],
  },
  {
    slug: 'instagram',
    category: 'Pictures',
    title: 'Your Instagram feed on the website',
    icon: 'image',
    lead: 'Your latest posts on Home and Contact, refreshed every week.',
    diy: 'mixed',
    body: [
      {
        kind: 'p',
        text: 'Once it is switched on, the website shows your newest Instagram posts and refreshes them by itself every Monday and after every Publish. Nothing to upload by hand.',
      },
      {
        kind: 'steps',
        items: [
          'The heading and the words above the feed are in `Site settings`, on the `Instagram feed` tab.',
          'The same tab has a switch for Home and one for Contact.',
          'Switching the feed on the first time needs a one-off approval from your Instagram account. Nathan walks you through it.',
        ],
      },
    ],
  },

  // -------------------------------------------------------------- Housekeeping
  {
    slug: 'quick-update',
    category: 'Housekeeping',
    title: 'Quick update from your phone',
    icon: 'bolt',
    lead: 'Post a notice or add a review in under a minute, between clients.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'Open reiddesignllc.com/studio on your phone and sign in.',
          'Tap `Quick update` in the menu.',
          'Pick a job, fill in the few boxes, and tap the button. It goes on the website straight away.',
          'Want to add more later? Open it in the full editor on your laptop.',
        ],
      },
    ],
  },
  {
    slug: 'trash',
    category: 'Housekeeping',
    title: 'Move something to the Trash, and bring it back',
    icon: 'restore',
    lead: 'Nothing you remove is gone for good.',
    diy: 'self',
    body: [
      {
        kind: 'steps',
        items: [
          'In a service, review, question or room story, click the small arrow beside `Publish` and choose `Move to Trash`.',
          'It leaves the website at the next update.',
          'Changed your mind? Open `Content`, then `Trash (bring things back)`, click it, and choose `Bring it back`.',
        ],
      },
      {
        kind: 'p',
        text: 'If something else still uses it (a review linked to a room story, say), the Studio asks you to change that first, so nothing on the website is left with a gap.',
      },
    ],
  },
  {
    slug: 'seo-fields',
    category: 'Housekeeping',
    title: 'What the Google and sharing boxes do',
    icon: 'search',
    lead: 'The title and sentence Google shows, and the picture a shared link shows.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          '**SEO title**: the blue headline in Google results. Name the service and the town, like "Interior Designer in Plainfield, IN | Reid Design".',
          '**SEO description**: the sentence under it. Say who you help and what happens next, in about 150 characters.',
          '**Social share image**: the picture when someone shares the page in a text or on Facebook. A room photo works best.',
        ],
      },
      {
        kind: 'callout',
        tone: 'default',
        title: 'Google decides in the end.',
        text: 'These are suggestions Google usually follows. Changes can take a week or two to show in results.',
      },
    ],
  },
  {
    slug: 'housekeeping',
    category: 'Housekeeping',
    title: 'The occasional tidy-up',
    icon: 'check',
    lead: 'Ten minutes a month keeps the website feeling current.',
    diy: 'self',
    body: [
      {
        kind: 'bullets',
        items: [
          'Open `Checkup` in the top bar and work down "Needs doing".',
          'Take down announcements whose dates have passed.',
          'Check your Google rating and availability line still say the right thing.',
          'Look at Pick up where you left off on Home: publish or discard old drafts.',
        ],
      },
      {
        kind: 'callout',
        tone: 'critical',
        title: 'Never click "Remove field".',
        text: 'If the Studio ever shows an "Unknown field" box with a `Remove field` button, leave it alone and tell Nathan. That button deletes the words in that box on every page, and they cannot be brought back.',
      },
    ],
  },
];

/**
 * Which guides "Help for this page" shows for each document type (kit.config.ts
 * guide.forType, PORTS.md card 110). '*' is the fallback for anything unlisted.
 */
export const GUIDES_FOR_TYPE: Record<string, string[]> = {
  '*': ['edit-a-page', 'help-panel'],
  project: ['first-room-story', 'schedule-a-story', 'room-story-photos', 'images-and-alt'],
  portfolioPage: ['first-room-story', 'section-visibility'],
  homePage: ['edit-a-page', 'extra-sections', 'seasonal-patterns', 'home-hero', 'accent-word'],
  aboutPage: ['about-off-the-clock', 'extra-sections', 'accent-word'],
  servicesPage: ['prices', 'extra-sections'],
  eDesignPage: ['prices', 'extra-sections', 'section-visibility'],
  processPage: ['extra-sections', 'edit-a-page'],
  service: ['prices'],
  testimonial: ['add-review', 'google-rating'],
  announcement: ['announcement'],
  page: ['add-a-page', 'page-templates', 'reuse-sections', 'share-a-preview', 'rename-a-page'],
  sectionPreset: ['reuse-sections', 'synced-sections', 'seasonal-patterns'],
  pressMention: ['press'],
  siteSettings: ['menus-and-footer', 'google-rating', 'section-visibility', 'instagram'],
  businessInfo: ['availability'],
  redirect: ['rename-a-page'],
  trashedItem: ['trash'],
};
