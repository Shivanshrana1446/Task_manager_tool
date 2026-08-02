import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote } from 'lucide-react';
import clsx from 'clsx';

// TipTap's own empty-document markup — treated as "" everywhere a caller
// compares description content (form defaults, submit payloads, empty checks).
export const EMPTY_RICH_TEXT = '<p></p>';

export const isRichTextEmpty = (html) => !html || html === EMPTY_RICH_TEXT;

const ToolbarButton = ({ isActive, onClick, label, children }) => (
  <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    aria-label={label}
    aria-pressed={isActive}
    className={clsx(
      'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
      isActive
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
        : 'text-foreground/50 hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950'
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Add more detail...',
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    ],
    content: value || '',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: clsx(
          'prose prose-sm max-w-none text-foreground focus:outline-none',
          'prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
          readOnly ? '' : 'min-h-[6rem] px-3.5 py-2.5'
        ),
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange?.(instance.getHTML());
    },
  });

  // Keep the editor in sync when the underlying task changes (e.g. switching
  // between edit targets) without fighting the user's own keystrokes.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, readOnly ? value : null]);

  if (!editor) return null;

  if (readOnly) {
    return <EditorContent editor={editor} />;
  }

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <div
        className={clsx(
          'overflow-hidden rounded-lg border bg-surface transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-background',
          error ? 'border-red-500' : 'border-border'
        )}
      >
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
          <ToolbarButton
            label="Bold"
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={14} />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default RichTextEditor;
