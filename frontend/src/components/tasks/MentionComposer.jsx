import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';

const detectActiveMention = (text, caretIndex) => {
  const upToCaret = text.slice(0, caretIndex);
  const atIndex = upToCaret.lastIndexOf('@');
  if (atIndex === -1) return null;
  const precedingChar = upToCaret[atIndex - 1];
  if (precedingChar && !/\s/.test(precedingChar)) return null;
  const fragment = upToCaret.slice(atIndex + 1);
  if (/\s/.test(fragment)) return null;
  return { atIndex, fragment };
};

// A plain textarea with an "@name" autocomplete layered on top. Tracks which
// project members have been mentioned so the parent can read their IDs (via
// the `getMentionIds` imperative handle) alongside the comment's plain text.
const MentionComposer = forwardRef(
  ({ value, onChange, projectMembers = [], placeholder, rows = 2 }, ref) => {
    const [query, setQuery] = useState(null); // null = no active mention trigger
    const [mentionedIds, setMentionedIds] = useState([]);
    const textareaRef = useRef(null);

    const suggestions = useMemo(() => {
      if (query === null) return [];
      const lower = query.toLowerCase();
      return projectMembers
        .filter((member) => member.name?.toLowerCase().includes(lower))
        .slice(0, 6);
    }, [query, projectMembers]);

    useImperativeHandle(ref, () => ({
      // Filters out anyone whose "@Name" text was since deleted from the draft.
      getMentionIds: () =>
        mentionedIds.filter((memberId) => {
          const member = projectMembers.find((m) => m._id === memberId);
          return member && value.includes(`@${member.name}`);
        }),
      reset: () => setMentionedIds([]),
    }));

    const handleChange = (event) => {
      const text = event.target.value;
      onChange(text);
      const active = detectActiveMention(text, event.target.selectionStart);
      setQuery(active ? active.fragment : null);
    };

    const selectMember = (member) => {
      const textarea = textareaRef.current;
      const caretIndex = textarea?.selectionStart ?? value.length;
      const active = detectActiveMention(value, caretIndex);
      if (!active) return;

      const before = value.slice(0, active.atIndex);
      const after = value.slice(caretIndex);
      const nextValue = `${before}@${member.name} ${after}`;
      onChange(nextValue);
      setMentionedIds((prev) => (prev.includes(member._id) ? prev : [...prev, member._id]));
      setQuery(null);

      requestAnimationFrame(() => {
        const cursor = before.length + member.name.length + 2;
        textarea?.focus();
        textarea?.setSelectionRange(cursor, cursor);
      });
    };

    return (
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setQuery(null), 120)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
        />

        {suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl">
            {suggestions.map((member) => (
              <li key={member._id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectMember(member)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground/80 hover:bg-primary-50 dark:hover:bg-primary-950"
                >
                  <Avatar name={member.name} src={member.avatar?.url} size="sm" />
                  {member.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

MentionComposer.displayName = 'MentionComposer';

export default MentionComposer;
