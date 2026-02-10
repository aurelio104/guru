"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DEFAULT_PHRASES = [
  "Inteligencia.",
  "Análisis.",
  "Contexto.",
  "Aprendizaje.",
];

type TypingAnimationProps = {
  phrases?: string[];
  className?: string;
  cursorChar?: string;
  speed?: number;
  pauseBetween?: number;
};

export function TypingAnimation({
  phrases = DEFAULT_PHRASES,
  className = "",
  cursorChar = "▋",
  speed = 80,
  pauseBetween = 1200,
}: TypingAnimationProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = phrases[currentPhraseIndex] ?? "";

  useEffect(() => {
    if (isPaused) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < currentPhrase.length) {
            setDisplayText(currentPhrase.slice(0, displayText.length + 1));
          } else {
            setIsPaused(true);
            setIsDeleting(true);
            setTimeout(() => setIsPaused(false), pauseBetween);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentPhraseIndex((i) => (i + 1) % phrases.length);
          }
        }
      },
      isDeleting ? speed / 2 : speed
    );

    return () => clearTimeout(timeout);
  }, [
    displayText,
    isDeleting,
    isPaused,
    currentPhrase,
    currentPhraseIndex,
    phrases.length,
    speed,
    pauseBetween,
  ]);

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {displayText}
      </motion.span>
      <motion.span
        className="text-aplat-cyan inline-block ml-0.5"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        {cursorChar}
      </motion.span>
    </span>
  );
}
