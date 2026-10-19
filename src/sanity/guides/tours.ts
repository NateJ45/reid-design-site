// Safe to edit by hand
// =============================================================================
// Spotlight tours for Reid Design, written as DATA (2026-10-19)
// =============================================================================
// PORTS.md card 137 (shared, being built in the starter) brings spotlight
// tours: a popover anchored to a real button in the Studio, a welcome modal on
// first sign-in and a "what's new" modal after a Studio round. Until it lands
// these steps are not wired to anything; Phase B maps each `anchor` onto the
// kit's anchor names and hands the tours to kit.config.ts.
//
// `anchor` is a plain name for the thing on screen, in the form
// "<where>:<what>": navbar:<tool id>, home:<card>, doc:<control>,
// quick:<control>, desk:<pane id>. `null` means a centred modal with no
// spotlight. `when` is 'first-run' (once, after the welcome) or 'on-demand'
// (from the Site Guide's "Show me" button). Every tour is for Staci (the staff
// view); there is one editor, so there are no other roles.
//
// Words follow the Site Guide's rules: plain, warm, no em-dashes, `backticks`
// for a thing you click. Nothing here may suggest remodeling (see content.ts).
// =============================================================================

export interface TourStepData {
  anchor: string | null;
  title: string;
  body: string;
}

export interface TourData {
  id: string;
  title: string;
  when: 'first-run' | 'on-demand';
  /** The Site Guide entry the tour belongs to (its "Show me" button). */
  guide?: string;
  steps: TourStepData[];
}

/** The welcome modal on first sign-in, before the first-run tour. */
export const WELCOME = {
  title: 'Welcome to your Studio',
  body: 'This is where you change the Reid Design website. Nothing you do here is public until you press Publish, and anything you remove can be brought back. Take the two-minute tour, or skip it and find it again in the Site Guide.',
  start: 'Show me around',
  skip: 'Maybe later',
};

/** What's new modal entries, newest first. One short line each, in her words. */
export const WHATS_NEW = [
  {
    date: '2026-10-19',
    title: 'Two more jobs for your phone',
    body: 'Quick update can now add a press mention and a question for the Questions page, as well as a review and a notice.',
    guide: 'quick-update',
  },
];

export const TOURS: TourData[] = [
  {
    id: 'first-run',
    title: 'Your Studio in two minutes',
    when: 'first-run',
    guide: 'start-here',
    steps: [
      {
        anchor: 'navbar:home',
        title: 'Home opens first',
        body: 'Home shows your jobs for the week, whether your last change is on the website yet, and anything that needs fixing.',
      },
      {
        anchor: 'home:quick-actions',
        title: 'Your four big jobs',
        body: 'Start a room story, change a price, add a review or update your Google rating, one click each.',
      },
      {
        anchor: 'home:this-week',
        title: 'This week',
        body: 'A short list that keeps enquiries coming. Some jobs tick themselves; the rest you tick by hand, and it starts fresh every Monday.',
      },
      {
        anchor: 'navbar:quick-update',
        title: 'Quick update is for your phone',
        body: 'A review, a notice, a press mention or a question, in under a minute between clients.',
      },
      {
        anchor: 'navbar:structure',
        title: 'Content is where you edit',
        body: 'Every page, room story, price and review lives in `Content`, room stories first.',
      },
      {
        anchor: 'navbar:presentation',
        title: 'Live preview shows the real page',
        body: 'See the website as clients will, with your unpublished changes in place. Click any words to edit them.',
      },
      {
        anchor: 'navbar:site-guide',
        title: 'Help is one click away',
        body: 'The Site Guide has step-by-step help for every job, with pictures. Stuck? Home has a card for asking Nathan.',
      },
    ],
  },
  {
    id: 'room-story',
    title: 'Publish a room story',
    when: 'on-demand',
    guide: 'first-room-story',
    steps: [
      {
        anchor: 'home:quick-actions:start-a-room-story',
        title: 'Start here',
        body: 'This opens a new room story with its parts in place and every piece of text in [square brackets].',
      },
      {
        anchor: 'doc:field:title',
        title: 'Replace each bracket',
        body: 'Each one says what goes there: the room and town, the brief, your design call, then the story in three short parts.',
      },
      {
        anchor: 'doc:field:heroImage',
        title: 'Your best wide shot',
        body: 'Upload it here and describe it in `Alt text`, like "Living room in Avon with a sage sofa and a jute rug".',
      },
      {
        anchor: 'doc:field:gallery',
        title: 'The rest of the photos',
        body: 'Add 8 to 12 and drag them into the order you want them seen.',
      },
      {
        anchor: 'doc:help-panel',
        title: 'A second pair of eyes',
        body: '`Help for this page` points out a photo with no description or a bracket you missed.',
      },
      {
        anchor: 'doc:publish',
        title: 'Publish when it reads right',
        body: 'It appears on the Portfolio within a few minutes. You can change any word or photo later.',
      },
    ],
  },
  {
    id: 'quick-update',
    title: 'Quick update on your phone',
    when: 'on-demand',
    guide: 'quick-update',
    steps: [
      {
        anchor: 'quick:tiles',
        title: 'Pick a job',
        body: 'Four jobs, each a few boxes and one button.',
      },
      {
        anchor: 'quick:form',
        title: 'Fill in the boxes',
        body: 'Each box says what goes in it, and which ones you can leave empty.',
      },
      {
        anchor: 'quick:submit',
        title: 'Put it on the website',
        body: 'It goes live in a few minutes. Open it in the full editor later to add more.',
      },
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews and your Google rating',
    when: 'on-demand',
    guide: 'add-review',
    steps: [
      {
        anchor: 'home:quick-actions:add-a-review',
        title: 'Add a review',
        body: 'Paste their words exactly, with their first name and town.',
      },
      {
        anchor: 'home:quick-actions:update-your-google-rating',
        title: 'Your Google rating',
        body: 'Type the rating from Google and set `Rating last checked` to today. Home asks once a month.',
      },
      {
        anchor: 'home:this-week',
        title: 'Ask for one a week',
        body: 'Your "Leave a review" link is in `Site settings`, on the `Reviews` tab. Tick the job when you have sent it.',
      },
    ],
  },
  {
    id: 'prices',
    title: 'Change a price',
    when: 'on-demand',
    guide: 'prices',
    steps: [
      {
        anchor: 'home:quick-actions:change-a-price',
        title: 'Services and prices',
        body: 'Each service is one card with its paint-chip price.',
      },
      {
        anchor: 'doc:publish',
        title: 'Publish',
        body: 'Services and the home page update together in a few minutes.',
      },
    ],
  },
];
