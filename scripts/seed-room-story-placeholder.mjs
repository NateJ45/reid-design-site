// Replace the three seeded sample projects with ONE room-story draft that Staci
// fills in. Written 2026-10-01.
//
// What it does, in order:
//   1. Finds the three sample projects the first seed created (and any other
//      project whose title still starts with "[SAMPLE"), published and draft.
//   2. Lists anything that points at them, so a delete never surprises anyone.
//   3. Deletes them.
//   4. Creates ONE project as a DRAFT with the room-story layout and [bracketed]
//      writing prompts (the same shape as Studio > Projects > "New room story").
//      It uses createIfNotExists, so running this again never overwrites what
//      Staci has typed.
//
// Why a draft: the public site only builds published documents, so the
// placeholder never shows to visitors. Staci opens it in Studio, fills it in
// (the Publish button stays greyed out until the bracketed prompts and the
// photos are done), and publishes. The portfolio section is still switched off
// in Site settings until she wants it public.
//
// Run (from the repo root, with SANITY_API_WRITE_TOKEN in .env):
//   node scripts/seed-room-story-placeholder.mjs            # look first
//   node scripts/seed-room-story-placeholder.mjs --apply    # do it
import { APPLY, announce, client } from './lib/sanity-script.mjs';

// The ids the first placeholder seed (seed-placeholder-content.mjs) used.
const SAMPLE_IDS = [
  'project.plainfieldFamilyRoom',
  'project.fishersKitchenStyling',
  'project.zionsvilleMasterBedroom',
];

// The draft we create. The "drafts." prefix is what makes it a draft.
const NEW_ID = 'drafts.project.firstRoomStory';

// ---- Portable Text helpers (same shapes as src/sanity/templates.ts) --------
const block = (key, style, text) => ({
  _type: 'block',
  _key: key,
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, marks: [], text }],
});
const para = (key, text) => block(key, 'normal', text);
const h2 = (key, text) => block(key, 'h2', text);

// Left out on purpose: slug (she clicks Generate once the real title is in, so
// the address matches the project), roomType and designStyle (dropdowns she
// must pick), and every photo. Each of those blocks publishing until it is done.
const ROOM_STORY = {
  _id: NEW_ID,
  _type: 'project',
  title: '[Room and town, like "Fishers kitchen refresh"]',
  location: '[Town, like "Fishers, IN"]',
  houseDescription: '[Era and kind of home, like "1990s colonial"]',
  scopeLine:
    '[What you did and the real price, like "Full room design, from $995". Delete this if the client would rather not show it.]',
  year: new Date().getFullYear(),
  publishedAt: new Date().toISOString(),
  briefSummary:
    '[One sentence for the portfolio card: the problem and your move. Between 60 and 200 characters.]',
  briefLine: '[What the client came in with, in one sentence.]',
  designCall: '[Your design move in response, in one sentence.]',
  consent: { _type: 'object', photos: false, price: false, review: false },
  introStory: [
    para(
      'rs-p1',
      '[Start with the people and the room: who lives there, what the room was like, and what they wanted it to do. Two or three sentences.]',
    ),
    h2('rs-h1', 'What was not working'),
    para(
      'rs-p2',
      '[Say the real problem in plain words, like "the sofa floated in the middle and nothing was anchored". Add the before photo here.]',
    ),
    h2('rs-h2', 'The first decision'),
    para(
      'rs-p3',
      '[The one choice everything else answered to, and why you made it. This is the paragraph a buyer remembers: "North light eats warm greys, so we went olive."]',
    ),
    h2('rs-h3', 'How it came together'),
    para(
      'rs-p4',
      '[The big pieces, where they came from, and how the room works for them now. Say what it cost if they are fine with that. Stop there.]',
    ),
  ],
  // Nothing is pinned to the home page until a real project exists.
  featured: false,
};

async function main() {
  announce('seed-room-story-placeholder');
  const c = client({ write: true });

  // 1. The samples: the three known ids (published + draft) plus any stray
  //    "[SAMPLE" title, so nothing seeded is left behind.
  const wanted = SAMPLE_IDS.flatMap((id) => [id, `drafts.${id}`]);
  const samples = await c.fetch(
    `*[_type == "project" && (_id in $ids || title match "[[]SAMPLE*")]{_id, title}`,
    { ids: wanted },
  );
  if (samples.length === 0) console.log('No sample projects found. Nothing to delete.');
  for (const s of samples) console.log(`  sample: ${s._id}  "${s.title}"`);

  // 2. Anything that points at them.
  const ids = samples.map((s) => s._id);
  if (ids.length > 0) {
    const refs = await c.fetch(`*[references($ids) && !(_id in $ids)]{_id, _type}`, { ids });
    if (refs.length > 0) {
      console.log('\n  These documents point at a sample and may block the delete:');
      for (const r of refs) console.log(`    ${r._type}  ${r._id}`);
    }
  }

  // 3 and 4. Delete, then create the draft if it is not already there.
  const exists = await c.fetch(`count(*[_id == $id])`, { id: NEW_ID });
  console.log(
    `\n  room story draft: ${exists ? 'already there, leaving it alone' : 'will be created'}`,
  );

  if (!APPLY) return;
  const tx = c.transaction();
  for (const s of samples) tx.delete(s._id);
  tx.createIfNotExists(ROOM_STORY);
  await tx.commit();
  console.log(`\nDone: deleted ${samples.length} sample(s). Draft ${NEW_ID} is ready in Studio.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
