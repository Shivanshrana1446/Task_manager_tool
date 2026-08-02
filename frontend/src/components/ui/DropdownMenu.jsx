import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

const MENU_WIDTH = 192; // matches w-48
const VIEWPORT_MARGIN = 12;

const DropdownMenu = ({ trigger, items, align = 'end', triggerClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    const rawLeft = align === 'start' ? rect.left : rect.right - MENU_WIDTH;
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN;
    const clampedLeft = Math.min(Math.max(rawLeft, VIEWPORT_MARGIN), Math.max(maxLeft, VIEWPORT_MARGIN));

    setPosition({ top: rect.bottom + window.scrollY + 6, left: clampedLeft + window.scrollX });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClick = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
              }}
              role="menu"
              className="z-50 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-xl"
            >
              {items.map((item) =>
                item.divider ? (
                  <div key={item.key} className="my-1 h-px bg-border" />
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      item.onClick();
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors',
                      item.danger
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                        : 'text-foreground/80 hover:bg-primary-50 dark:hover:bg-primary-950'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default DropdownMenu;
