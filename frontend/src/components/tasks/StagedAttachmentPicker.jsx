import { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, FileArchive, X, AlertCircle } from 'lucide-react';
import {
  validateAttachmentFile,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_MB,
} from '../../utils/attachmentConstants';

const iconForMime = (mimeType) => {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType?.includes('zip')) return FileArchive;
  return FileText;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Lets the user pick files before the task exists yet — nothing uploads here,
// they're just held client-side and handed to TaskFormModal's onSubmit, which
// uploads each one to the real task right after it's created.
const StagedAttachmentPicker = ({ files, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const staged = Array.from(fileList || []).map((file) => ({
      id: createId(),
      file,
      error: validateAttachmentFile(file),
    }));
    onChange([...files, ...staged]);
  };

  const removeFile = (id) => onChange(files.filter((item) => item.id !== id));

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-border'
        }`}
      >
        <Upload size={20} className={isDragging ? 'text-primary-500' : 'text-foreground/40'} />
        <p className="text-sm font-medium text-foreground/60">
          {isDragging ? 'Drop to attach' : 'Drop files here or click to attach'}
        </p>
        <p className="text-xs text-foreground/40">
          Up to {MAX_ATTACHMENT_SIZE_MB}MB per file — uploaded once the task is created
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((item) => {
            const Icon = item.error ? AlertCircle : iconForMime(item.file.type);
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  item.error ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-surface'
                }`}
              >
                <Icon size={18} className={`shrink-0 ${item.error ? 'text-red-500' : 'text-foreground/40'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                  {item.error && <p className="text-xs text-red-500">{item.error}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="shrink-0 text-foreground/40 hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StagedAttachmentPicker;
