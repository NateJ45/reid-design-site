// Foundation, edit with care
// Project case study gallery. react-photo-album for justified grid layout,
// yet-another-react-lightbox for fullscreen viewing with Zoom + Thumbnails.
// Each photo carries its alt text and optional caption from Sanity.
//
// 2026-09-30 (phase 2 of the rebuild): every photo now keeps its TRUE shape.
// The rows used to assume 1600x1066 for all of them, so a portrait phone photo
// was laid out as a landscape box and squashed or cropped hard. The real
// dimensions come from the asset id (parseSanityAssetDimensions), and the
// thumbnails are requested at that shape. Square corners, a quiet gap.

import { useMemo, useState } from 'react';
import { RowsPhotoAlbum, type Photo } from 'react-photo-album';
import 'react-photo-album/rows.css';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';

import { urlFor, parseSanityAssetDimensions } from '@/lib/sanity';

interface SanityImageItem {
  _key?: string;
  asset?: { _ref?: string; _id?: string };
  alt?: string;
  caption?: string;
}

interface Props {
  images: SanityImageItem[];
}

// Fallback shape when an asset id carries no dimensions (never, for a real
// Sanity image id, but the type allows it). 3:2 landscape.
const DEFAULT_W = 1600;
const DEFAULT_H = 1066;

export default function ProjectGallery({ images }: Props) {
  const [index, setIndex] = useState(-1);

  const photos: Photo[] = useMemo(() => {
    return images
      .filter((img) => img.asset)
      .map((img) => {
        const dims = parseSanityAssetDimensions(img);
        const w = dims?.width ?? DEFAULT_W;
        const h = dims?.height ?? DEFAULT_H;
        const thumbUrl = urlFor(img).width(800).quality(70).format('webp').url();
        const thumb2x = urlFor(img).width(1600).quality(70).format('webp').url();
        return {
          src: thumbUrl,
          srcSet: [
            { src: thumbUrl, width: 800, height: Math.round((800 * h) / w) },
            { src: thumb2x, width: 1600, height: Math.round((1600 * h) / w) },
          ],
          width: w,
          height: h,
          alt: img.alt ?? '',
          title: img.caption,
        };
      });
  }, [images]);

  const slides = useMemo(() => {
    return images
      .filter((img) => img.asset)
      .map((img) => ({
        src: urlFor(img).width(2400).quality(85).format('webp').url(),
        alt: img.alt ?? '',
        description: img.caption,
      }));
  }, [images]);

  if (photos.length === 0) return null;

  return (
    <>
      <RowsPhotoAlbum
        photos={photos}
        // A sensible server-rendered layout before the island hydrates
        // (the rows are percentage widths, so it scales to any screen).
        defaultContainerWidth={1240}
        targetRowHeight={(containerWidth) => (containerWidth < 640 ? 200 : 320)}
        spacing={(containerWidth) => (containerWidth < 640 ? 8 : 14)}
        onClick={({ index: i }) => setIndex(i)}
      />
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Zoom, Thumbnails, Captions]}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        thumbnails={{ position: 'bottom' }}
      />
    </>
  );
}
