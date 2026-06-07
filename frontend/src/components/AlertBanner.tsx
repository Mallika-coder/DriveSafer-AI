import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  level: number; // 0, 1, 2, 3
  message: string;
}

export default function AlertBanner({ level, message }: AlertBannerProps) {
  const getStyle = () => {
    switch (level) {
      case 1: return "bg-warning text-[#0a0f1e]";
      case 2: return "bg-orange-600 text-white";
      case 3: return "bg-critical text-white font-bold tracking-wider";
      default: return "hidden";
    }
  };

  return (
    <AnimatePresence>
      {level > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className={`fixed top-0 left-0 w-full p-4 text-center text-xl z-50 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${getStyle()}`}
        >
          {level === 3 && <span className="animate-pulse mr-2">⚠️</span>}
          {message}
          {level === 3 && <span className="animate-pulse ml-2">⚠️</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
