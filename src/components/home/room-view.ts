// Foundation, edit with care
// =============================================================================
// room-view: the shapes RoomStory.astro hands to RoomStage / RoomScene /
// RoomNotes (2026-09-30; whole frames, manifest v3, the same day; the
// annotated room, manifest v4, 2026-10-03). Types only.
// =============================================================================
import type { RoomBrief } from '@/lib/room-story';

/** One complete photo of the room at one step of the build. */
export interface StageFrame {
  avifSrcset: string;
  webpSrcset: string;
  /** Fallback src (webp, 960 wide). */
  src: string;
  /** URL of this frame's change mask, or null for frame 0 (the empty room). */
  change: string | null;
  /** The change's box as FRACTIONS of the frame [x, y, w, h], or null for frame 0. */
  box: [number, number, number, number] | null;
  /** Index into ROOM_MOTIONS, or -1 for frame 0. */
  motion: number;
  /** Stage (beat) index the piece arrives in, or -1 for frame 0. */
  stage: number;
}

/** One piece's tag: why it is there, and where its string is pinned. */
export interface NoteView {
  /** The piece id ("sofa"). Never shown. */
  id: string;
  /** The check's id ("scale") and its printed label ("Scale"). */
  check: string;
  checkLabel: string;
  /** The ramp chip the check's swatch takes (1 to 4 ink, 6 cream). */
  tone: number;
  text: string;
  /** The pin as FRACTIONS of the frame [x, y]. */
  pin: [number, number];
  /** The piece's change box as FRACTIONS [x, y, w, h] (the tag must not cover it). */
  box: [number, number, number, number];
  side: 'left' | 'right';
  /** The beat the piece arrives in. */
  stage: number;
}

/** One beat of the build. */
export interface BeatView {
  /** Short name, "The bones". */
  label: string;
  /** The beat card's sentence. */
  caption: string;
}

/** One plan chip. */
export interface PlanView {
  label: string;
  /** The beat whose end lights it. */
  stage: number;
  /** The ramp chip it fills with (1 to 4 ink text, 6 cream). */
  tone: number;
}

/** The booking button the close carries: the header button's label and link, the consult price. */
export interface CloseCta {
  label: string;
  href: string;
  /** "$225", or null (then the button drops the price part). */
  price: string | null;
}

/** One room, ready to draw. */
export interface RoomView {
  slug: string;
  /** Tab line one ("Living room"). */
  label: string;
  /** Tab line two ("Transitional"). */
  style: string;
  /** What the live region says when the room's tab is chosen. */
  announce: string;
  width: number;
  height: number;
  /** Describes the empty room. */
  baseAlt: string;
  /** Describes the finished room (the default picture's alt). */
  finalAlt: string;
  beats: BeatView[];
  /** Frame shown once beat k is current (stageFrames()). */
  ends: number[];
  /** frame 0 = empty room, then one per piece; the last is the finished room. */
  frames: StageFrame[];
  /** One per piece, in build order (notes[k - 1] belongs to frame k). */
  notes: NoteView[];
  brief: RoomBrief;
  plan: PlanView[];
  closing: string;
}
