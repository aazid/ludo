/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#050a1a',
          800: '#0a1628',
          700: '#0f2040',
          600: '#142854',
        },
        purple: {
          950: '#1a0a2e',
          900: '#2d1b69',
          800: '#3d2080',
          700: '#5b2d9a',
          600: '#7c3aed',
        },
        player: {
          red:    '#ef4444',
          blue:   '#3b82f6',
          green:  '#22c55e',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        game: ['Rajdhani', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139,92,246,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(139,92,246,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

