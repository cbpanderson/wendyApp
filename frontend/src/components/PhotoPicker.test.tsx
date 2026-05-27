import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoPicker from './PhotoPicker';

// jsdom doesn't implement createObjectURL
beforeAll(() => {
  global.URL.createObjectURL = () => 'blob:fake';
});

describe('PhotoPicker', () => {
  it('rejects non-JPEG/PNG files', () => {
    const onChange = vi.fn();
    render(<PhotoPicker files={[]} onChange={onChange} />);
    const input = screen.getByTestId('photo-input') as HTMLInputElement;
    const gif = new File(['x'], 'x.gif', { type: 'image/gif' });
    fireEvent.change(input, { target: { files: [gif] } });
    expect(screen.getByText(/JPEG or PNG/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('rejects files larger than 2MB', () => {
    const onChange = vi.fn();
    render(<PhotoPicker files={[]} onChange={onChange} />);
    const input = screen.getByTestId('photo-input') as HTMLInputElement;
    const bigBytes = new Uint8Array(2 * 1024 * 1024 + 1);
    const big = new File([bigBytes], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [big] } });
    expect(screen.getByText(/2 MB or smaller/i)).toBeInTheDocument();
  });

  it('accepts a valid JPEG and renders a preview', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PhotoPicker files={[]} onChange={onChange} />);
    const input = screen.getByTestId('photo-input') as HTMLInputElement;
    const ok = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'ok.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(input, { target: { files: [ok] } });
    expect(onChange).toHaveBeenCalled();
    // Re-render with the file as if parent updated state
    rerender(<PhotoPicker files={[ok]} onChange={onChange} />);
    expect(screen.getByTestId('photo-preview-0')).toBeInTheDocument();
  });
});
