/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame': 'flame 0.6s ease-in-out infinite alternate',
        'typing': 'typing 1.2s steps(3, end) infinite',
      },
      keyframes: {
        flame: {
          '0%': { transform: 'scaleY(0.95) scaleX(0.98)', filter: 'brightness(0.9)' },
          '100%': { transform: 'scaleY(1.05) scaleX(1.02)', filter: 'brightness(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
