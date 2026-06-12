/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0a0e17',
        'bg-card': 'rgba(255,255,255,0.04)',
        'glass-border': 'rgba(255,255,255,0.08)',
        'accent-cyan': '#00d4ff',
        'accent-purple': '#a78bfa',
        'accent-green': '#34d399',
        'accent-orange': '#f59e0b',
        'accent-red': '#f87171',
      },
    },
  },
  plugins: [],
}
