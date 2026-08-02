import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Pencil, Trash2, PlusCircle, RotateCcw, ArrowRightLeft } from 'lucide-react';
import {
  useCommentsList,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../../hooks/useComments';
import { useTaskHistory } from '../../hooks/useTasks';
import { TASK_STATUS_LABELS } from '../../utils/chartTheme';
import { formatRelativeTime } from '../../utils/formatters';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import MentionComposer from './MentionComposer';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Highlights "@Name" only for names that match an actual project member —
// avoids misinterpreting a literal "@" in unrelated text as a mention.
const renderContentWithMentions = (content, projectMembers) => {
  const names = projectMembers.map((member) => member.name).filter(Boolean);
  if (names.length === 0) return content;

  const pattern = new RegExp(`(@(?:${names.map(escapeRegex).join('|')}))`, 'g');
  const parts = content.split(pattern);

  return parts.map((part, index) =>
    part.startsWith('@') && names.includes(part.slice(1)) ? (
      <span key={index} className="font-medium text-primary-600 dark:text-primary-400">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

const HISTORY_ICONS = {
  create: PlusCircle,
  update: Pencil,
  delete: Trash2,
  restore: RotateCcw,
  status_change: ArrowRightLeft,
};

const describeHistoryEntry = (entry) => {
  const actor = entry.user?.name || 'Someone';
  if (entry.action === 'status_change') {
    const from = entry.before?.status;
    const to = entry.after?.status;
    return `${actor} changed status from ${TASK_STATUS_LABELS[from] || from} to ${TASK_STATUS_LABELS[to] || to}`;
  }
  if (entry.action === 'create') return `${actor} created this task`;
  if (entry.action === 'delete') return `${actor} deleted this task`;
  if (entry.action === 'restore') return `${actor} restored this task`;
  return `${actor} updated this task`;
};

const ActivityTimeline = ({ taskId, projectMembers = [] }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const { data: comments, isLoading: loadingComments } = useCommentsList(taskId);
  const { data: history, isLoading: loadingHistory } = useTaskHistory(taskId);
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const composerRef = useRef(null);

  const items = useMemo(() => {
    const commentItems = (comments || []).map((comment) => ({
      type: 'comment',
      createdAt: comment.createdAt,
      data: comment,
    }));
    const historyItems = (history || []).map((entry) => ({
      type: 'history',
      createdAt: entry.createdAt,
      data: entry,
    }));
    return [...commentItems, ...historyItems].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [comments, history]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const mentions = composerRef.current?.getMentionIds() || [];
    createComment.mutate(
      { task: taskId, content: draft.trim(), mentions },
      {
        onSuccess: () => {
          setDraft('');
          composerRef.current?.reset();
        },
      }
    );
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditDraft(comment.content);
  };

  const saveEdit = () => {
    updateComment.mutate(
      { id: editingId, content: editDraft },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const isLoading = loadingComments || loadingHistory;

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-3">
        <Avatar name={currentUser?.name} src={currentUser?.avatar?.url} size="sm" />
        <div className="flex-1">
          <MentionComposer
            ref={composerRef}
            value={draft}
            onChange={setDraft}
            projectMembers={projectMembers}
            placeholder="Add a comment... (type @ to mention someone)"
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              className="w-auto px-4"
              isLoading={createComment.isPending}
              disabled={!draft.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size={18} />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground/40">No activity yet</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            if (item.type === 'history') {
              const Icon = HISTORY_ICONS[item.data.action] || Pencil;
              return (
                <li
                  key={`h-${item.data._id}`}
                  className="flex items-start gap-3 text-xs text-foreground/50"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border">
                    <Icon size={12} />
                  </div>
                  <div>
                    <p>{describeHistoryEntry(item.data)}</p>
                    <p className="text-[11px] text-foreground/30">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              );
            }

            const comment = item.data;
            const isOwn = comment.author?._id === currentUser?._id;
            const isEditing = editingId === comment._id;

            return (
              <li key={`c-${comment._id}`} className="flex items-start gap-3">
                <Avatar name={comment.author?.name} src={comment.author?.avatar?.url} size="sm" />
                <div className="min-w-0 flex-1 rounded-xl bg-surface p-3 ring-1 ring-border">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author?.name}
                    </span>
                    <span className="text-[11px] text-foreground/40">
                      {formatRelativeTime(comment.createdAt)}
                      {comment.isEdited && ' (edited)'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea
                        rows={2}
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="mt-1.5 flex gap-2">
                        <Button
                          className="w-auto px-3 py-1.5 text-xs"
                          onClick={saveEdit}
                          isLoading={updateComment.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-auto px-3 py-1.5 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-foreground/80">
                      {renderContentWithMentions(comment.content, projectMembers)}
                    </p>
                  )}

                  {isOwn && !isEditing && (
                    <div className="mt-1.5 flex gap-3 text-xs text-foreground/40">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteComment.mutate(comment._id)}
                        className="flex items-center gap-1 hover:text-red-500"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ActivityTimeline;
