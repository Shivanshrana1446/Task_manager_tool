import { useEffect, useRef } from 'react';

const isTypingTarget = (target) =>
  target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

const matchesBinding = (event, binding) => {
  const parts = binding.toLowerCase().split('+');
  const key = parts.at(-1);
  const needsMod = parts.includes('mod');
  const isMod = event.metaKey || event.ctrlKey;

  if (event.key.toLowerCase() !== key) return false;
  if (needsMod !== isMod) return false;
  return true;
};

/**
 * Registers global keyboard shortcuts. Bindings look like `{ 'mod+k': fn, '?': fn }`
 * — 'mod' means Ctrl on Windows/Linux, Cmd on Mac. Ignored while typing in a
 * form field unless the binding is listed in `allowInInputs`.
 */
export const useKeyboardShortcuts = (bindings, allowInInputs = []) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    const handler = (event) => {
      const typing = isTypingTarget(event.target);

      for (const [binding, callback] of Object.entries(bindingsRef.current)) {
        if (typing && !allowInInputs.includes(binding)) continue;
        if (matchesBinding(event, binding)) {
          event.preventDefault();
          callback(event);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowInInputs.join(',')]);
};
