import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useUpdateTask } from '../../hooks/useTasks';

// Mutates a saved task's checklist immediately (unlike ChecklistEditor, which
// buffers edits inside the create/edit form until it's submitted).
const ChecklistList = ({ task }) => {
  const [draft, setDraft] = useState('');
  const updateMutation = useUpdateTask();
  const checklist = task.checklist || [];
  const completed = checklist.filter((item) => item.isDone).length;

  const save = (nextChecklist) => {
    updateMutation.mutate({ id: task._id, data: { checklist: nextChecklist } });
  };

  const handleAdd = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    save([...checklist, { text: draft.trim(), isDone: false }]);
    setDraft('');
  };

  const toggleItem = (itemId) => {
    save(checklist.map((item) => (item._id === itemId ? { ...item, isDone: !item.isDone } : item)));
  };

  const removeItem = (itemId) => {
    save(checklist.filter((item) => item._id !== itemId));
  };

  return (
    <div>
      {checklist.length > 0 && (
        <p className="mb-2 text-xs font-medium text-foreground/40">
          {completed}/{checklist.length} completed
        </p>
      )}

      <ul className="space-y-1">
        {checklist.map((item) => (
          <li
            key={item._id}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-950"
          >
            <button
              type="button"
              onClick={() => toggleItem(item._id)}
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
              onClick={() => removeItem(item._id)}
              aria-label={`Delete ${item.text}`}
              className="text-foreground/30 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      {checklist.length === 0 && (
        <p className="py-2 text-sm text-foreground/40">No checklist items yet</p>
      )}

      <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2 px-2">
        <Plus size={14} className="text-foreground/30" />
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a checklist item..."
          className="flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
      </form>
    </div>
  );
};

export default ChecklistList;
