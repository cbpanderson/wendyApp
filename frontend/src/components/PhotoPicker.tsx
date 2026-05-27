import { ChangeEvent, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png'];

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function PhotoPicker({ files, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const picked = Array.from(e.target.files ?? []);
    const next: File[] = [...files];
    for (const f of picked) {
      if (!ALLOWED.includes(f.type)) {
        setError('Only JPEG or PNG images are allowed.');
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError('Each photo must be 2 MB or smaller.');
        continue;
      }
      if (next.length >= 2) {
        setError('You can attach a maximum of 2 photos.');
        break;
      }
      next.push(f);
    }
    onChange(next);
    e.target.value = '';
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Photos (optional, max 2)
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {files.map((f, i) => (
          <Box key={i} sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src={URL.createObjectURL(f)}
              alt={`preview ${i + 1}`}
              data-testid={`photo-preview-${i}`}
              sx={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 1 }}
            />
            <Button size="small" onClick={() => removeAt(i)}>
              Remove
            </Button>
          </Box>
        ))}
        {files.length < 2 && (
          <Button variant="outlined" component="label">
            Add photo
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png"
              onChange={onPick}
              data-testid="photo-input"
            />
          </Button>
        )}
      </Stack>
    </Box>
  );
}
