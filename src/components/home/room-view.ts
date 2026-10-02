// Foundation, edit with care
// =============================================================================
// room-view: the shapes RoomStory.astro hands to RoomStage / RoomScene /
// RoomCaptions (2026-09-30; whole frames, manifest v3, the same day). Types only.
// =============================================================================

/** One complete photo of the room at one step of the build. */
export interface StageFrame {
  avifSrcset: string;
  webpSrcset: string;
  /** Fallback src (webp, 960 wide). */
  src: string;
  /** URL of this frame's wall mask (greyscale PNG, white = wall). */
  wall: string;
  /** URL of this frame's change mask, or null for frame 0 (the empty room). */
  change: string | null;
  /** The change's box as FRACTIONS of the frame [x, y, w, h], or null for frame 0. */
  box: [number, number, number, number] | null;
  /** Index into ROOM_MOTIONS, or -1 for frame 0. */
  motion: number;
  /** Stage (caption) index the piece arrives in, or -1 for frame 0. */
  stage: number;
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
  /** The room's one wall median, linear light. */
  median: [number, number, number];
  /** Describes the empty room (the live region, before the first caption). */
  baseAlt: string;
  /** Describes the finished room (the default picture's alt). */
  finalAlt: string;
  /** Captions, in stage order. */
  stages: string[];
  /** Frame shown once caption k is current (stageFrames()). */
  ends: number[];
  /** frame 0 = empty room, then one per piece; the last is the finished room. */
  frames: StageFrame[];
}
