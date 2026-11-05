// Foundation, edit with care
// The Portfolio's photo list, with a "Choose photos" button above Sanity's own
// grid (2026-11-04). Sanity's array input takes a batch by drag and drop, but its
// only button adds one photo at a time, and a phone cannot drag at all. This
// button picks as many as the editor likes, on a phone or a computer, uploads them
// one after another and adds them to the end of the list, as a draft like any
// other edit: nothing is public until Publish.
//
// The grid below is Sanity's, unchanged: drag to reorder, the menu on a photo to
// remove it, click a photo to give it a caption.

import { useRef, useState, type ChangeEvent } from 'react';
import { Button, Stack, Text } from '@sanity/ui';
import { UploadIcon } from '@sanity/icons/Upload';
import { insert, setIfMissing, useClient, type ArrayOfObjectsInputProps } from 'sanity';

/** A short random array key, in the shape Sanity's own are. */
const newKey = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

export function PortfolioPhotosInput(props: ArrayOfObjectsInputProps) {
  const { onChange, readOnly, renderDefault } = props;
  const client = useClient({ apiVersion: '2024-10-01' });
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    // Clear it now, so picking the same photo again still fires a change.
    event.currentTarget.value = '';
    if (!files.length) return;
    if (readOnly) {
      setMessage('This page is read-only for your account, so photos cannot be added.');
      return;
    }

    setMessage(null);
    let failed = 0;
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length });
      try {
        const asset = await client.assets.upload('image', file, { filename: file.name });
        // One at a time, so a failure part way keeps every photo before it.
        onChange([
          setIfMissing([]),
          insert(
            [
              {
                _type: 'image',
                _key: newKey(),
                asset: { _type: 'reference', _ref: asset._id },
              },
            ],
            'after',
            [-1],
          ),
        ]);
      } catch {
        failed += 1;
      }
    }
    setProgress(null);
    const added = files.length - failed;
    setMessage(
      failed
        ? `Added ${added} of ${files.length}. ${failed} did not upload, so try those again.`
        : `Added ${added} ${added === 1 ? 'photo' : 'photos'}. Press Publish when you are ready.`,
    );
  };

  return (
    <Stack gap={3}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-portfolio-photos
        onChange={addPhotos}
      />
      <Button
        icon={UploadIcon}
        text={progress ? `Adding ${progress.done + 1} of ${progress.total}...` : 'Choose photos'}
        tone="primary"
        fontSize={2}
        padding={4}
        disabled={Boolean(progress)}
        onClick={() => inputRef.current?.click()}
      />
      {message && (
        <Text size={1} role="status">
          {message}
        </Text>
      )}
      {renderDefault(props)}
    </Stack>
  );
}
