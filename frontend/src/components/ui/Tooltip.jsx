import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const SIDE_OFFSET = 8;

const Tooltip = ({ content, side = 'bottom', children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef(null);
  const id = useId();

  if (!content) return children;

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: side === 'bottom' ? rect.bottom + SIDE_OFFSET : rect.top - SIDE_OFFSET,
      left: rect.left + rect.width / 2,
    });
    setIsOpen(true);
  };

  return (
    <span
      ref={anchorRef}
      className={`inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={show}
      onBlur={() => setIsOpen(false)}
      aria-describedby={isOpen ? id : undefined}
    >
      {children}

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.span
              role="tooltip"
              id={id}
              initial={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                transform: `translate(-50%, ${side === 'bottom' ? '0' : '-100%'})`,
              }}
              className="pointer-events-none z-[70] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-elevated"
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
};

export default Tooltip;
