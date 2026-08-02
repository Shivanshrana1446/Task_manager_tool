import Modal from '../ui/Modal';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['/'], description: 'Focus search on the current page' },
  { keys: ['?'], description: 'Show this shortcuts reference' },
  { keys: ['Esc'], description: 'Close a dialog or the command palette' },
  { keys: ['↑', '↓'], description: 'Move through command palette results' },
  { keys: ['Enter'], description: 'Run the highlighted command' },
];

const Kbd = ({ children }) => (
  <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-surface px-1.5 py-1 text-xs font-medium text-foreground/70 shadow-soft">
    {children}
  </kbd>
);

const KeyboardShortcutsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Keyboard shortcuts" size="sm">
    <ul className="flex flex-col gap-3">
      {SHORTCUTS.map((shortcut) => (
        <li key={shortcut.description} className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground/70">{shortcut.description}</span>
          <span className="flex shrink-0 items-center gap-1">
            {shortcut.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  </Modal>
);

export default KeyboardShortcutsModal;
