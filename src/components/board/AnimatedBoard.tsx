import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

// A decorative animated Ludo board preview for the homepage hero section.
// Uses SVG + Framer Motion for a lightweight, beautiful preview.

const COLORS = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#eab308',
};

const TOKEN_POSITIONS = [
  // red base
  { x: 75,  y: 285, color: 'red',    delay: 0 },
  { x: 105, y: 285, color: 'red',    delay: 0.2 },
  // blue base
  { x: 225, y: 75,  color: 'blue',   delay: 0.1 },
  { x: 255, y: 75,  color: 'blue',   delay: 0.3 },
  // green base
  { x: 225, y: 285, color: 'green',  delay: 0.15 },
  { x: 255, y: 285, color: 'green',  delay: 0.35 },
  // yellow base
  { x: 75,  y: 75,  color: 'yellow', delay: 0.25 },
  { x: 105, y: 75,  color: 'yellow', delay: 0.05 },
  // track tokens
  { x: 155, y: 195, color: 'red',    delay: 0.4 },
  { x: 185, y: 155, color: 'blue',   delay: 0.5 },
];

export default function AnimatedBoard() {
  const size = 340;

  return (
    <div className="w-[340px] h-[340px] rounded-2xl overflow-hidden relative">
      {/* Board BG */}
      <div className="absolute inset-0 bg-[#0a1628] rounded-2xl border border-white/10" />

      <svg width={size} height={size} className="absolute inset-0">
        {/* Quadrants */}
        <rect x={0}   y={0}   width={136} height={136} fill={COLORS.yellow} opacity={0.15} rx={4} />
        <rect x={204} y={0}   width={136} height={136} fill={COLORS.blue}   opacity={0.15} rx={4} />
        <rect x={0}   y={204} width={136} height={136} fill={COLORS.red}    opacity={0.15} rx={4} />
        <rect x={204} y={204} width={136} height={136} fill={COLORS.green}  opacity={0.15} rx={4} />

        {/* Center cross */}
        <rect x={136} y={0}   width={68} height={136} fill="white" opacity={0.05} />
        <rect x={0}   y={136} width={340} height={68} fill="white" opacity={0.05} />

        {/* Center star */}
        <polygon
          points="170,140 180,155 170,170 160,155"
          fill="white"
          opacity={0.3}
        />

        {/* Track grid dots */}
        {Array.from({ length: 13 }, (_, row) =>
          Array.from({ length: 13 }, (_, col) => {
            const x = 136 + (col - 6) * (68 / 6);
            const y = 136 + (row - 6) * (68 / 6);
            const inCenter = row >= 4 && row <= 8 && col >= 4 && col <= 8;
            if (inCenter) return null;
            return (
              <circle
                key={`${row}-${col}`}
                cx={x} cy={y} r={2}
                fill="white" opacity={0.1}
              />
            );
          })
        )}

        {/* Home bases */}
        {[
          { x: 30,  y: 30,  c: 'yellow' as const },
          { x: 220, y: 30,  c: 'blue'   as const },
          { x: 30,  y: 220, c: 'red'    as const },
          { x: 220, y: 220, c: 'green'  as const },
        ].map(({ x, y, c }) => (
          <g key={c}>
            <rect x={x} y={y} width={80} height={80} rx={8}
              fill={COLORS[c]} opacity={0.2}
              stroke={COLORS[c]} strokeWidth={1.5} strokeOpacity={0.4}
            />
            {/* 4 token slots */}
            {[[18,18],[18,44],[44,18],[44,44]].map(([dx, dy], i) => (
              <circle key={i} cx={x+dx} cy={y+dy} r={8}
                fill={COLORS[c]} opacity={0.3}
                stroke={COLORS[c]} strokeWidth={1} strokeOpacity={0.5}
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Animated tokens */}
      {TOKEN_POSITIONS.map((t, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-white/50 shadow-lg"
          style={{
            left: t.x - 10,
            top:  t.y - 10,
            width: 20,
            height: 20,
            background: `radial-gradient(circle at 35% 35%, white, ${COLORS[t.color as keyof typeof COLORS]})`,
            boxShadow: `0 0 8px ${COLORS[t.color as keyof typeof COLORS]}80`,
          }}
          animate={{
            y:       [0, -4, 0],
            opacity: [0.8, 1, 0.8],
            scale:   [1, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            delay: t.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }}
      />

      {/* "PREVIEW" tag */}
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-xs text-purple-300 font-semibold">
        LIVE PREVIEW
      </div>
    </div>
  );
}

