// StudioLogo.tsx — Brand logo for the Sanity Studio header.
// Rendered as a small image in the top-left of the Studio UI.
// Safe to edit by hand.

import React from 'react';
// The Studio is bundled by `astro build` (embedded at /studio since
// 2026-08-28), and Astro turns an image import into an ImageMetadata object,
// not a URL string the way plain Vite does. The `.src` is the URL. Passing the
// whole object rendered `<img src="[object Object]">` in the Studio header
// until astro check caught it (2026-09-05).
import logo from '../reid-logo.png';

export default function StudioLogo() {
  return (
    <img
      src={logo.src}
      alt="Reid Design"
      style={{
        height: '1.25rem',
        width: 'auto',
        display: 'block',
      }}
    />
  );
}
