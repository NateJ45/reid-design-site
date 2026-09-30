// Foundation, edit with care
// =============================================================================
// room-view: the shapes RoomStory.astro hands to RoomStage / RoomScene /
// RoomCaptions (2026-09-30, the room tabs). Types only.
// =============================================================================

export interface StageBase {
  avifSrcset: string;
  webpSrcset: string;
  src: string;
  alt: string;
  maskUrl: string;
  median: [number, number, number];
}

export interface Picture {
  srcset: string;
  src: string;
  sizes: string;
}

export interface StageLayer {
  id: string;
  motion: string;
  /** Stage (caption) index. */
  stage: number;
  /** Fractions of the stage window this piece moves across. */
  from: number;
  to: number;
  width: number;
  height: number;
  /** left/top/width/height as percentages of the frame. */
  place: string;
  image: Picture;
  shade: Picture | null;
  light: Picture | null;
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
  base: StageBase;
  finalAlt: string;
  /** Captions, in stage order. */
  stages: string[];
  layers: StageLayer[];
}
