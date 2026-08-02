import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

// Edits an in-memory checklist array for the task create/edit form — persisted
// only when the surrounding form is submitted, unlike ChecklistList which
// mutates a saved task's checklist immediately via useUpdateTask.
const ChecklistEditor = ({ items, onChange }) => {
  const [draft, setDraft] = useState('');

  const addItem = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onChange([...items, { text: draft.trim(), isDone: false }]);
    setDraft('');
  };

  const toggleItem = (index) => {
    onChange(items.map((item, i) => (i === index ? { ...item, isDone: !item.isDone } : item)));
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const completed = items.filter((item) => item.isDone).length;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">Checklist</label>
        {items.length > 0 && (
          <span className="text-xs text-foreground/40">
            {completed}/{items.length} completed
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mb-2 space-y-1">
          {items.map((item, index) => (
            <li
              key={`${item._id || index}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-950"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                aria-label={item.isDone ? 'Mark as not done' : 'Mark as done'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  item.isDone
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-border text-transparent'
                }`}
              >
                <Check size={12} />
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.isDone ? 'text-foreground/40 line-through' : 'text-foreground/80'
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remove ${item.text}`}
                className="text-foreground/30 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2">
        <Plus size={14} className="shrink-0 text-foreground/30" />
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addItem(event);
          }}
          placeholder="Add a checklist item..."
          className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default ChecklistEditor;
