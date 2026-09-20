import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

// Ganti array ini dengan kata-kata yang mau muncul bergiliran
const words = ["Terpercaya", "Terlengkap", "Termurah", "Tercepat"];

export default function RotatingWord({ interval = 2000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    // inline-block penting biar tidak "loncat" saat panjang kata berubah
    <span className="relative inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="inline-block text-info"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
