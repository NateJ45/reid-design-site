// Safe to edit by hand
// =============================================================================
// tool-theme - the ONE per-repo thing about the in-canvas controls (card 28)
// =============================================================================
// `styles.ts` beside this file is canonical: every repo in the family draws the
// same tool chrome, and the shapes, radii, shadows and spacing are shared. The
// only thing that is genuinely this project's own is the six values below, so
// they live here, alone, and a fork edits this file and nothing else.
//
// FIXED, AND THEME-INDEPENDENT ON PURPOSE. These controls float over the page,
// so they have to read as TOOLS rather than as content: a white card on the
// dark hero or the accent-dark CTA band still reads as a control, while a dark
// card on that band reads as part of the design. The values are written as
// LITERALS rather than `var(--color-...)` for the same reason - this site has a
// dark mode, and a tool that flipped with it would disappear.
//
// The hexes are the LIGHT-MODE brand tokens from src/styles/globals.css:
//   Charcoal    #3D3D3D  the text, and the filled state of a pressed control
//   Bronze Dark #7A5D4C  captions and hints (the token already chosen as the
//                        text-safe bronze, ~5.3:1 on white)
//   Source Sans 3        the body face
// A rebrand that moves the ink or the body face should update this file in the
// same pass. Nothing breaks if it does not; the controls simply stay neutral.
// =============================================================================

/** The palette and type the canonical `styles.ts` draws every control with. */
export interface ToolTheme {
  /** Card and button background. */
  paper: string;
  /** Text, and the filled state of a pressed control. */
  ink: string;
  /** Captions and secondary text. */
  muted: string;
  /** Hairline borders. */
  line: string;
  /** The drop shadow that lifts a floating card off the page. */
  shadow: string;
  /** The font stack, matching the site's body face. */
  font: string;
}

export const TOOL: ToolTheme = {
  paper: '#FFFFFF',
  ink: '#3D3D3D',
  muted: '#7A5D4C',
  line: 'rgba(61, 61, 61, 0.14)',
  shadow: '0 6px 20px rgba(61, 61, 61, 0.22), 0 1px 2px rgba(61, 61, 61, 0.16)',
  font: '"Source Sans 3 Variable", system-ui, -apple-system, sans-serif',
};
