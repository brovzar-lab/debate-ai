/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame': 'flame 0.6s ease-in-out infinite alternate',
        'typing': 'typing 1.2s steps(3, end) infinite',
        'waveform-1': 'waveform-bar 0.7s ease-in-out infinite',
        'waveform-2': 'waveform-bar 0.7s ease-in-out 0.15s infinite',
        'waveform-3': 'waveform-bar 0.7s ease-in-out 0.3s infinite',
        'injected': 'injected-flash 2.2s ease-in-out forwards',
        'speaker-ring': 'speaker-ring 1.2s ease-out infinite',
      },
      keyframes: {
        flame: {
          '0%': { transform: 'scaleY(0.95) scaleX(0.98)', filter: 'brightness(0.9)' },
          '100%': { transform: 'scaleY(1.05) scaleX(1.02)', filter: 'brightness(1.1)' },
        },
        'waveform-bar': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '16px' },
        },
        'injected-flash': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.95)' },
          '15%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '75%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'speaker-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(255,255,255,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' },
        },
      },
    },
  },
  plugins: [],
}
