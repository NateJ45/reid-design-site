// make-specs: writes rooms/<slug>.json for the five rooms after the living room.
// Same conventions as living-transitional.json (read that first). Run from tools/room-lab:
//   node rooms/make-specs.cjs
// Re-running OVERWRITES those five specs, including any seeds `candidates --pick` pinned, so
// once a room is being picked, edit its JSON directly instead.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const living = JSON.parse(fs.readFileSync(path.join(dir, 'living-transitional.json'), 'utf8'));
const FULL = 'edit-reflatent-full';
const NEG_FINE = 'cartoon, illustration, vector, graphic, silhouette, plastic, fake, cgi, render, flat, oversaturated';
const NEG_OFF = 'lamp turned on, glowing bulbs, light glow, light spill, cartoon, illustration, cgi, render';
const tail = (style) =>
  ` Style: ${style} Add ONLY this one thing and nothing else; keep the floor, walls, windows and light exactly the same.`;
const shell = (room, extra) =>
  `A realistic photograph of an EMPTY ${room} in an ordinary 1990s to 2010s Midwest American suburban house, not a loft and not luxury. Bright, open and airy: big windows, lots of soft daylight, light floors. ${extra} Eye-level camera standing in a corner. One large, plain, completely clear main wall is fully visible and unobstructed. Nothing hangs on the walls. No people, no plants, no text, no logos. Natural colour, gentle shadows, 4:3 photograph.`;
const NEG_BASE =
  'people, text, watermark, logo, brand name, artwork on walls, plants, clutter, loft, exposed brick, luxury, fisheye, wide angle distortion, cartoon, illustration, 3d render, oversaturated, HDR, dark, moody';

let seed = 0;
const piece = (id, stage, motion, labels, change, style, opts = {}) => {
  seed += 10;
  return {
    id,
    stage,
    motion,
    change: change + tail(style),
    seeds: [seed, seed + 1000, seed + 2000],
    ...(labels.length ? { labels } : {}),
    ...opts,
  };
};
const write = (slug, r) => {
  const out = {
    width: living.width,
    height: living.height,
    base: { negative: `${r.negative}, ${NEG_BASE}`, seeds: [1101, 2202, 3303, 4404, 5505, 6606, 7707, 8808], alt: r.baseAlt },
    baseVariants: r.variants.map(([id, wall]) => ({ id, prompt: `${r.shell} The walls are painted ${wall}.` })),
    editInstruction: living.editInstruction,
    stages: r.stages.map(([id, caption]) => ({ id, caption })),
    final: { alt: r.finalAlt },
    pieces: r.pieces,
  };
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(out, null, 2) + '\n');
  console.log(slug, out.pieces.length, 'pieces');
};

// ---- Family room, modern farmhouse -------------------------------------------------------
seed = 200;
{
  const S = 'relaxed modern farmhouse; warm white, oatmeal and faded blue, weathered oak and pine, black iron, cognac leather.';
  write('family-farmhouse', {
    shell: shell('family room', 'A tall vaulted ceiling. Plain thin builder baseboards, no crown moulding, no wall panelling.'),
    negative: 'furniture, sofa, chair, table, rug, lamp, curtains, pendant light, ceiling fan',
    variants: [
      ['khaki', 'a tired, dated khaki olive, a flat greenish beige that looks a little drab'],
      ['mauve', 'a dated dusty mauve grey that looks a little dingy'],
    ],
    baseAlt: 'Concept image: a bright, empty family room with a vaulted ceiling, dated walls and a bare floor, before any design work.',
    finalAlt: 'Concept image: the finished family room in a modern farmhouse style, with a sectional, a reclaimed wood table, a leather chair, a lantern and styling.',
    stages: [
      ['shell', 'First the bones: wide, plain trim around the windows and taller baseboards, the kind a farmhouse room is built on.'],
      ['anchor', 'A washed vintage rug and a deep sectional that the whole family can pile onto.'],
      ['function', 'A sturdy wood table for feet and board games, a console for the TV, and a lantern to light the middle of the room.'],
      ['comfort', 'A leather chair that gets softer every year.'],
      ['personal', 'A big photograph on the wall and a tree in the corner, so the room has something to look at.'],
      ['finish', 'Then the easy layers: plaid pillows, a dough bowl, a few dried stems.'],
    ],
    pieces: [
      piece('trim', 'shell', 'sweep', [], 'add wide, flat white farmhouse-style casing around the windows and tall flat white baseboards along every wall. Add no furniture and no rug; the floor stays bare.', S, { maxDrift: 10 }),
      piece('rug', 'anchor', 'unroll', ['rug'], 'add one large vintage-style washed rug in faded blue and cream, lying flat in the middle of the floor.', S),
      piece('sofa', 'anchor', 'slide-left', ['sofa', 'cushion', 'pillow'], 'add one deep L-shaped sectional sofa in plain oatmeal performance fabric with loose, slightly rumpled cushions, set on the rug with its long side against the large plain wall, leaving the upper wall clear.', S),
      piece('coffee-table', 'function', 'rise', ['coffee table', 'table'], 'add a chunky rectangular coffee table with a weathered reclaimed pine top and a black iron base, on the rug in front of the sectional.', S),
      piece('console', 'function', 'rise', ['cabinet', 'shelf', 'table'], 'add a long low media console in white-painted wood with black iron handles against the wall opposite the sectional, below the window line.', S),
      piece('lantern', 'function', 'drop', ['chandelier', 'light', 'lamp'], 'hang one large black iron lantern pendant light from the ceiling above the middle of the room, switched off.', S, { maxDrift: 12, workflow: FULL, negative: NEG_OFF }),
      piece('chair', 'comfort', 'slide-right', ['armchair', 'chair', 'swivel chair'], 'add one cognac leather sling armchair with a black iron frame on the rug near the windows, angled toward the sectional.', S),
      piece('art', 'personal', 'drop', ['painting'], 'hang one large black-and-white photograph of an open field in a thin natural oak frame with a white mat, centred on the large plain wall above the sectional, leaving plenty of bare wall around it.', S),
      piece('plant', 'personal', 'pop', ['plant', 'pot', 'basket', 'flower'], 'place a real potted fiddle-leaf fig tree about five feet tall in a woven seagrass basket in the corner beside the sectional; natural glossy leaves in daylight.', S, { workflow: FULL, negative: NEG_FINE }),
      piece('styling', 'finish', 'pop', ['vase', 'pot', 'basket', 'pillow', 'cushion', 'plant', 'blanket'], 'add two plaid wool pillows in faded blue and cream to the sectional, and a wooden dough bowl holding a few stems of dried wheat on the coffee table.', S, { workflow: FULL, negative: NEG_FINE }),
    ],
  });
}

// ---- Dining room, art deco ---------------------------------------------------------------
seed = 300;
{
  const S = 'art deco; deep emerald, black lacquer, cream and warm brass, fluted walnut, frosted glass, geometric fan shapes.';
  write('dining-deco', {
    shell: shell('dining room', 'A tall ceiling with a single electrical box in the middle and no fixture. Plain thin builder baseboards, no crown moulding.'),
    negative: 'furniture, table, chair, rug, chandelier, light fixture, sideboard, mirror, curtains',
    variants: [
      ['lavender', 'a dull, dated grey lavender that looks a little dreary'],
      ['salmon', 'a faded, dated salmon pink that looks washed out'],
    ],
    baseAlt: 'Concept image: a bright, empty dining room with dated walls and a bare floor, before any design work.',
    finalAlt: 'Concept image: the finished dining room in an art deco style, with a round black table, emerald velvet chairs, a brass chandelier, a fluted sideboard and a sunburst mirror.',
    stages: [
      ['shell', 'A dining room starts with its architecture: crown moulding, tall baseboards and a chair rail.'],
      ['anchor', 'A fan-patterned rug and a round table, so everyone can see everyone.'],
      ['comfort', 'Curved velvet chairs, deep green against all that black and brass.'],
      ['light', 'One statement light, hung low enough to make the table feel like the centre of the room.'],
      ['personal', 'A fluted sideboard for the good dishes, and a sunburst mirror to bounce the light around.'],
      ['finish', 'Candlesticks and flowers, set for dinner.'],
    ],
    pieces: [
      piece('trim', 'shell', 'sweep', [], 'add white crown moulding where the walls meet the ceiling, tall white baseboards and a slim white chair rail around the room at chair-back height. Add no furniture and no rug; the floor stays bare.', S, { maxDrift: 10 }),
      piece('rug', 'anchor', 'unroll', ['rug'], 'add one large rectangular art deco rug with a cream ground and a black and brass-gold geometric fan pattern, lying flat in the middle of the floor.', S),
      piece('table', 'anchor', 'rise', ['table'], 'add one round dining table with a glossy black lacquer top and a fluted brass pedestal base, centred on the rug.', S),
      piece('chairs', 'comfort', 'slide-right', ['chair', 'armchair', 'swivel chair'], 'add four curved-back dining chairs upholstered in deep emerald velvet with slim brass-capped legs, evenly around the table.', S),
      piece('chandelier', 'light', 'drop', ['chandelier', 'light', 'lamp'], 'hang one tiered art deco chandelier of frosted glass shades and brass arms from the ceiling box, centred over the table, switched off.', S, { maxDrift: 12, workflow: FULL, negative: NEG_OFF }),
      piece('sideboard', 'personal', 'rise', ['cabinet', 'table', 'shelf'], 'add one long low walnut sideboard with fluted doors and slim brass handles against the large plain wall, leaving the wall above it clear.', S),
      piece('mirror', 'personal', 'drop', ['mirror'], 'hang one round sunburst mirror with a brass frame on the large plain wall, centred above the sideboard, with plenty of bare wall around it.', S, { workflow: FULL, negative: 'cartoon, illustration, cgi, render, distorted reflection' }),
      piece('styling', 'finish', 'pop', ['vase', 'flower', 'plant', 'pot'], 'place a pair of tall brass candlesticks with white taper candles and a low bowl of white ranunculus on the table, and a black ceramic vase on the sideboard.', S, { workflow: FULL, negative: `lit candles, flames, ${NEG_FINE}` }),
    ],
  });
}

// ---- Kitchen, modern ---------------------------------------------------------------------
// Styling only (Nathan, 2026-09-30): Staci works with the kitchen that is there. The
// cabinets, counters and appliances stay; the build is hardware, a light fixture, soft
// goods, art and styling, plus wall colour from the chips. Never a remodel.
seed = 400;
{
  const S = 'warm modern; matte black hardware, white oak and walnut accents, smoked glass, cream and charcoal textiles.';
  write('kitchen-modern', {
    shell:
      'A realistic photograph of an ordinary, dated but complete kitchen in a 2000s Midwest American suburban house, not luxury. Honey oak cabinets with round brass knobs, beige laminate countertops, a plain white refrigerator, a white range, a stainless sink with a plain chrome faucet under a bright window, a plain frosted dome ceiling light. Bright, open and airy, lots of soft daylight, light floor. Clean and uncluttered: nothing on the counters, nothing on the walls, no rug. One large plain section of painted wall is clearly visible. Eye-level camera standing in a corner. No people, no text, no logos. Natural colour, gentle shadows, 4:3 photograph.',
    negative: 'remodel, new cabinets, white cabinets, island, stools, backsplash tile, pendant lights, decor, clutter, rug',
    variants: [
      ['yellow', 'a dated, tired butter yellow that looks a little greasy'],
      ['sage', 'a faded 1990s sage green that looks a little flat'],
    ],
    baseAlt: 'Concept image: a dated but working kitchen with honey oak cabinets and tired walls, before any styling.',
    finalAlt: 'Concept image: the same kitchen, restyled with black hardware, a new faucet and light, a runner, a roman shade, art and counter styling.',
    stages: [
      ['hardware', 'The cabinets stay. New black pulls and a new faucet change how the whole kitchen reads.'],
      ['light', 'Swap the dated dome light for one good pendant.'],
      ['soft', 'A washable runner by the sink and a linen shade in the window.'],
      ['personal', 'One piece of art on the empty wall.'],
      ['finish', 'A board, a bowl of lemons and a pot of basil, like someone cooks here.'],
    ],
    pieces: [
      piece('hardware', 'hardware', 'pop', [], 'replace every round brass cabinet knob with a slim matte black bar pull, on every door and drawer. Keep the honey oak cabinets exactly as they are.', S, { workflow: FULL, negative: NEG_FINE }),
      piece('faucet', 'hardware', 'pop', ['sink'], 'replace the plain chrome faucet with a matte black gooseneck kitchen faucet. Keep the sink and countertop exactly as they are.', S, { workflow: FULL, negative: NEG_FINE }),
      piece('pendant', 'light', 'drop', ['light', 'lamp', 'chandelier'], 'replace the frosted dome ceiling light with one simple globe pendant light in smoked glass on a thin black rod, switched off.', S, { maxDrift: 12, workflow: FULL, negative: NEG_OFF }),
      piece('runner', 'soft', 'unroll', ['rug'], 'add a flat-woven runner rug in cream and charcoal stripes on the floor in front of the sink and cabinets.', S),
      piece('shade', 'soft', 'drop', ['curtain', 'blind'], 'hang a simple cream linen roman shade inside the window frame, raised most of the way so the window stays bright.', S),
      piece('art', 'personal', 'drop', ['painting'], 'hang one framed botanical print in a thin black frame on the large plain wall, with plenty of bare wall around it.', S),
      piece('styling', 'finish', 'pop', ['plant', 'pot', 'vase', 'basket'], 'place a wooden cutting board, a white bowl of fresh lemons and a small potted basil plant on the countertop.', S, { workflow: FULL, negative: `fake fruit, ${NEG_FINE}` }),
    ],
  });
}

// ---- Bathroom, seaside -------------------------------------------------------------------
// Styling only: the toilet, tub and shower and the vanity stay. Beadboard stays as the one
// "bones" step (Nathan kept trim everywhere); the rest is fixtures, soft goods and decor.
seed = 500;
{
  const S = 'light seaside cottage; white, sand, driftwood and soft sea blue, rattan, brushed nickel, seeded glass, striped cotton.';
  write('bath-seaside', {
    shell:
      'A realistic photograph of an ordinary, dated but complete small bathroom in a 2000s Midwest American suburban house, not luxury. A builder oak vanity with a cultured marble top and a plain chrome faucet, a plain frameless mirror above it with a chrome vanity light bar, a white toilet, a white tub and shower combination with a plain white surround and no shower curtain, a frosted window, a light tile floor, thin builder baseboards. Bright soft daylight. Clean: no towels, no rugs, no decor, nothing on the walls. One large plain painted wall is clearly visible. Eye-level camera from the doorway. No people, no text, no logos. Natural colour, gentle shadows, 4:3 photograph.',
    negative: 'remodel, freestanding tub, new vanity, tile wall, towels, rug, decor, clutter, shower curtain',
    variants: [
      ['pink', 'a dated 1990s pinkish beige that looks a little dingy'],
      ['mint', 'a faded, dated seafoam mint that looks a little flat'],
    ],
    baseAlt: 'Concept image: a dated but working bathroom with a builder vanity and tired walls, before any styling.',
    finalAlt: 'Concept image: the same bathroom, restyled with beadboard, a rattan mirror, nickel sconces, a striped shower curtain, towels and a bath mat.',
    stages: [
      ['bones', 'Beadboard on the lower walls first: practical in a bathroom, and it says cottage straight away.'],
      ['fixtures', 'The vanity stays. A round rattan mirror, sconces instead of the light bar, and a nickel faucet.'],
      ['soft', 'A striped shower curtain, fresh towels and a woven mat.'],
      ['finish', 'A small print, a basket and a plant, and it feels like a different room.'],
    ],
    pieces: [
      piece('beadboard', 'bones', 'sweep', [], 'add white painted beadboard wainscoting with a slim cap rail on the lower third of the plain walls and taller white baseboards, leaving the upper walls painted and clear. Keep the vanity, toilet and tub exactly as they are.', S, { maxDrift: 10 }),
      piece('mirror', 'fixtures', 'drop', ['mirror'], 'replace the plain frameless mirror above the vanity with one round mirror in a natural rattan frame.', S, { workflow: FULL, negative: 'cartoon, illustration, cgi, render, distorted reflection' }),
      piece('sconces', 'fixtures', 'pop', ['sconce', 'light', 'lamp'], 'replace the chrome vanity light bar with two brushed nickel wall sconces with seeded glass shades, one on each side of the mirror, switched off.', S, { workflow: FULL, negative: NEG_OFF }),
      piece('faucet', 'fixtures', 'pop', ['sink'], 'replace the plain chrome vanity faucet with a brushed nickel bridge faucet. Keep the vanity and top exactly as they are.', S, { workflow: FULL, negative: NEG_FINE }),
      piece('curtain', 'soft', 'drop', ['curtain', 'shower'], 'replace the plain white shower curtain with a white and soft blue striped cotton shower curtain on the same rod, pulled partly open.', S),
      piece('towels', 'soft', 'slide-right', ['towel'], 'hang two white towels with a soft blue stripe on a brushed nickel towel bar on the wall near the tub.', S, { workflow: FULL }),
      piece('mat', 'soft', 'unroll', ['rug'], 'add a woven cotton bath mat in warm sand on the floor in front of the tub.', S),
      piece('styling', 'finish', 'pop', ['basket', 'plant', 'pot', 'vase', 'painting'], 'hang one small framed coastal print on the plain wall, and place a woven seagrass basket on the floor by the vanity and a small potted green plant on the vanity.', S, { workflow: FULL, negative: NEG_FINE }),
    ],
  });
}


// ---- Bedroom, Japandi --------------------------------------------------------------------
seed = 600;
{
  const S = 'calm Japandi; oatmeal, warm white, soft charcoal and natural ash wood, linen, paper, clay, very little clutter.';
  write('bedroom-japandi', {
    shell: shell('bedroom', 'Plain thin builder baseboards, no crown moulding.'),
    negative: 'furniture, bed, nightstand, lamp, rug, curtains, bench',
    variants: [
      ['bluegrey', 'a dull, dated blue grey that looks a little cold'],
      ['tan', 'a tired, dated builder tan, a flat yellowish beige'],
    ],
    baseAlt: 'Concept image: a bright, empty bedroom with dated walls and a bare floor, before any design work.',
    finalAlt: 'Concept image: the finished Japandi bedroom with a low ash bed in linen bedding, paper lamps, a slatted bench, sheer curtains and one piece of ink art.',
    stages: [
      ['shell', 'Simple, wide trim, because a quiet room still needs good bones.'],
      ['anchor', 'A soft wool rug and a low ash bed made up in rumpled linen.'],
      ['function', 'Small nightstands, each with a paper lamp.'],
      ['comfort', 'A slatted bench at the foot of the bed and sheer curtains that soften the morning.'],
      ['personal', 'One ink painting over the bed, and plenty of empty wall around it.'],
      ['finish', 'A branch in a clay vase, a couple of books, a plant. That is all it needs.'],
    ],
    pieces: [
      piece('trim', 'shell', 'sweep', [], 'add wide, flat, square-edged white baseboards and simple square white window casing. Add no furniture and no rug; the floor stays bare.', S, { maxDrift: 10 }),
      piece('rug', 'anchor', 'unroll', ['rug'], 'add one large low-pile wool rug in warm oatmeal, lying flat on the floor in front of the large plain wall.', S),
      piece('bed', 'anchor', 'rise', ['bed', 'pillow', 'cushion', 'blanket'], 'add one low queen platform bed in light ash wood with a low wide headboard, centred against the large plain wall, made with rumpled natural linen bedding in oatmeal and white. The wall above the headboard stays bare.', S, { workflow: FULL }),
      piece('nightstands', 'function', 'rise', ['table', 'cabinet'], 'add two small light ash nightstands, one on each side of the bed.', S),
      piece('lamps', 'function', 'pop', ['lamp', 'light'], 'place a round white rice-paper table lamp on each nightstand, switched off.', S, { workflow: FULL, negative: NEG_OFF }),
      piece('bench', 'comfort', 'slide-right', ['bench'], 'add one low slatted light ash bench at the foot of the bed.', S),
      piece('curtains', 'comfort', 'drop', ['curtain'], 'hang sheer white linen curtains on thin black rods at the windows, pulled open to the sides so the room stays bright.', S),
      piece('art', 'personal', 'drop', ['painting'], 'hang one abstract ink-wash painting in soft black on cream paper, in a thin light oak frame, centred on the large plain wall above the bed, with lots of bare wall around it.', S),
      piece('styling', 'finish', 'pop', ['plant', 'pot', 'vase', 'book'], 'place a single leafy branch in a small clay vase and two stacked books on one nightstand, and a potted plant in a matte clay pot on the floor in the corner.', S, { workflow: FULL, negative: NEG_FINE }),
    ],
  });
}
