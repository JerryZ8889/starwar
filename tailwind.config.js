/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 马卡龙 UI 色系
        'dream-pink':     '#ffb7d5',
        'dream-lavender': '#c4b5fd',
        'dream-mint':     '#a7f3d0',
        'dream-cream':    '#fef9e7',
        'dream-peach':    '#fed7aa',
        'dream-sky':      '#bae6fd',
        'dream-gold':     '#fde68a',
        // 深空背景
        'nebula-deep':    '#0d0620',
        'nebula-mid':     '#1e0a4a',
        'nebula-accent':  '#3d1a7a',
      },
      fontFamily: {
        game: ['Quicksand', 'Varela Round', 'sans-serif'],
      },
      animation: {
        'float':     'float 3s ease-in-out infinite',
        'twinkle':   'twinkle 2s ease-in-out infinite',
        'pulse-glow':'pulse-glow 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(255,183,213,0.4)' },
          '50%':      { boxShadow: '0 0 20px 6px rgba(255,183,213,0.8)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
    },
  },
  plugins: [],
}
