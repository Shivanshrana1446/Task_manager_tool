import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';

const { mockUploadAttachment } = vi.hoisted(() => ({
  mockUploadAttachment: vi.fn().mockResolvedValue({ _id: 'a1' }),
}));

vi.mock('../services/attachmentsApi', () => ({
  listAttachments: vi.fn().mockResolvedValue([]),
  uploadAttachment: mockUploadAttachment,
  deleteAttachment: vi.fn(),
}));

import AttachmentManager from '../components/tasks/AttachmentManager';

const renderManager = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <AttachmentManager taskId="task1" />
    </QueryClientProvider>
  );

const getFileInput = (container) => container.querySelector('input[type="file"]');

describe('AttachmentManager', () => {
  it('rejects an oversized file client-side without calling the upload API', async () => {
    const { container } = renderManager();
    await screen.findByText(/no files attached yet/i);

    const hugeFile = new File([new Uint8Array(11 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    });
    fireEvent.change(getFileInput(container), { target: { files: [hugeFile] } });

    expect(await screen.findByText(/exceeds the 10mb size limit/i)).toBeInTheDocument();
    expect(mockUploadAttachment).not.toHaveBeenCalled();
  });

  it('rejects an unsupported file type client-side without calling the upload API', async () => {
    const { container } = renderManager();
    await screen.findByText(/no files attached yet/i);

    const exeFile = new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' });
    fireEvent.change(getFileInput(container), { target: { files: [exeFile] } });

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
    expect(mockUploadAttachment).not.toHaveBeenCalled();
  });

  it('uploads a valid file', async () => {
    const { container } = renderManager();
    await screen.findByText(/no files attached yet/i);

    const validFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(getFileInput(container), { target: { files: [validFile] } });

    await waitFor(() => expect(mockUploadAttachment).toHaveBeenCalledTimes(1));
    expect(mockUploadAttachment.mock.calls[0][1].name).toBe('notes.txt');
  });
});
