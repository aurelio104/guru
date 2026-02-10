"use client";

import { motion } from "framer-motion";

type Card3DProps = {
  children?: React.ReactNode;
  className?: string;
  shine?: boolean;
  glowBorder?: boolean;
};

export function Card3D({
  children = null,
  className = "",
  shine = true,
  glowBorder = true,
}: Card3DProps) {
  return (
    <motion.div
      className={`card-3d shadow-depth smooth-transition ${shine ? "shine-sweep" : ""} ${glowBorder ? "glow-border" : ""} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
