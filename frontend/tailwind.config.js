/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface:   { DEFAULT: '#000000', 2: '#141414' },
        primary:   { DEFAULT: '#A4E80B', hover: '#B6F62E' },
        text:      { DEFAULT: '#FFFFFF', muted: '#A1A1A1' },
        border:    'rgba(255,255,255,0.08)',
        success:   '#A4E80B',
        warning:   '#F5C518',
        danger:    '#FF4D4D',
        /* tokens semânticos usados nas páginas (texto secundário) */
        muted: '#A1A1A1',
        faint: 'rgba(161,161,161,0.55)',
        /* legado — mantido por compat. com classes antigas, mapeado pra paleta nova */
        neon:  '#A4E80B',
        ember: '#FF4D4D',
        gold:  '#F5C518',
        ink: {
          DEFAULT: '#0A0A0A',
          card:    '#000000',
          surface: '#141414',
          deep:    '#141414',
          line:    'rgba(255,255,255,0.08)',
        },
        cream: '#FFFFFF',
        /* paleta neutra (substitui o cinza azulado padrão do Tailwind) */
        gray: {
          400: '#A1A1A1',
          500: '#8A8A8A',
          600: '#6E6E6E',
          700: 'rgba(255,255,255,0.10)',
          800: '#141414',
          900: '#0A0A0A',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'sans-serif'],
        hero:    ['"Clash Display"', 'Inter', 'sans-serif'],
        condensed: ['"Clash Display"', 'Inter', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        sm:  '6px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl': '22px',
        '3xl': '22px',
        '4xl': '26px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
