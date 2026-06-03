import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0D1117',
          2: '#1C2333',
        },
        parchment: '#F5F0E8',
        cream: '#FAF7F2',
        gold: {
          DEFAULT: '#C9973A',
          light: '#E8B84B',
        },
        crimson: {
          DEFAULT: '#8B1A1A',
          light: '#B22222',
        },
        slate: '#8892A4',
      },
    },
  },
  plugins: [],
}

export default config
