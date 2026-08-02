import { motion } from 'framer-motion';

const FloatingActionButton = ({ onClick, label, icon: Icon }) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label={label}
    initial={{ opacity: 0, scale: 0.8, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.93 }}
    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-floating hover:bg-primary-700 md:hidden"
  >
    <Icon size={24} />
  </motion.button>
);

export default FloatingActionButton;
