import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Trash2,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAttachmentsList, useUploadAttachment, useDeleteAttachment } from '../../hooks/useAttachments';
import { validateAttachmentFile, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_MB } from '../../utils/attachmentConstants';
import { getCloudinaryThumbnail } from '../../utils/cloudinary';
import Spinner from '../ui/Spinner';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const iconForMime = (mimeType) => {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType?.includes('zip')) return FileArchive;
  return FileText;
};

const createQueueId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AttachmentManager = ({ taskId }) => {
  const { data: attachments, isLoading } = useAttachmentsList(taskId);
  const uploadMutation = useUploadAttachment(taskId);
  const deleteMutation = useDeleteAttachment(taskId);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState([]);
  const inputRef = useRef(null);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  useEffect(
    () => () => {
      queueRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    },
    []
  );

  const removeQueueItem = (id) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  };

  const updateQueueItem = (id, patch) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      const id = createQueueId();
      const error = validateAttachmentFile(file);
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

      setQueue((prev) => [
        ...prev,
        { id, file, previewUrl, progress: 0, status: error ? 'error' : 'uploading', error },
      ]);

      if (error) return;

      uploadMutation
        .mutateAsync({
          file,
          onUploadProgress: (event) => {
            if (!event.total) return;
            updateQueueItem(id, { progress: Math.round((event.loaded / event.total) * 100) });
          },
        })
        .then(() => {
          updateQueueItem(id, { status: 'done', progress: 100 });
          setTimeout(() => removeQueueItem(id), 1200);
        })
        .catch((uploadError) => {
          updateQueueItem(id, {
            status: 'error',
            error: uploadError.response?.data?.message || 'Upload failed',
          });
        });
    });
  };

  return (
    <div>
      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        animate={{ scale: isDragging ? 1.015 : 1 }}
        transition={{ duration: 0.15 }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-border'
        }`}
      >
        <Upload size={20} className={isDragging ? 'text-primary-500' : 'text-foreground/40'} />
        <p className="text-sm font-medium text-foreground/60">
          {isDragging ? 'Drop to upload' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-foreground/40">Up to {MAX_ATTACHMENT_SIZE_MB}MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </motion.div>

      <div className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {queue.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                item.status === 'error'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-border bg-surface'
              }`}
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-md object-cover"
                />
              ) : item.status === 'error' ? (
                <AlertCircle size={18} className="shrink-0 text-red-500" />
              ) : (
                <Spinner size={18} className="shrink-0" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                {item.status === 'error' ? (
                  <p className="text-xs text-red-500">{item.error}</p>
                ) : (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-primary-500"
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}
              </div>

              {item.status === 'error' && (
                <button
                  type="button"
                  onClick={() => removeQueueItem(item.id)}
                  className="shrink-0 text-foreground/40 hover:text-foreground"
                  aria-label={`Dismiss ${item.file.name}`}
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size={16} />
          </div>
        ) : attachments?.length === 0 && queue.length === 0 ? (
          <p className="py-2 text-center text-sm text-foreground/40">No files attached yet</p>
        ) : (
          <AnimatePresence initial={false}>
            {attachments?.map((attachment) => {
              const isImage = attachment.mimeType?.startsWith('image/');
              const Icon = iconForMime(attachment.mimeType);
              return (
                <motion.div
                  key={attachment._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  {isImage ? (
                    <img
                      src={getCloudinaryThumbnail(attachment.url, 72)}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <Icon size={18} className="shrink-0 text-foreground/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-foreground/40">{formatBytes(attachment.size)}</p>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 hover:text-foreground"
                    aria-label={`Download ${attachment.originalName}`}
                  >
                    <Download size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(attachment._id)}
                    className="text-foreground/40 hover:text-red-500"
                    aria-label={`Delete ${attachment.originalName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AttachmentManager;
