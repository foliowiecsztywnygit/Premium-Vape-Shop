/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        serif: ['"Cinzel"', 'serif'],
        horst: ['"Horst"', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
      },
      colors: {
        ink: '#0B0F12',
        paper: '#FFFFFF',
        accent: {
          deep: '#1a0ad8',
          cyan: '#7cdfff',
          tertiary: '#de7931',
        },
        brand: {
          dark: '#111111',
        }
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #1a0ad8 0%, #7cdfff 100%)',
      },
      boxShadow: {
        'cyan-glow': '0 0 0 1px rgba(124,223,255,0.25), 0 0 28px rgba(124,223,255,0.18)',
      },
      fontSize: {
        'fluid-xs': 'clamp(0.65rem, 0.5vw + 0.5rem, 0.8rem)',
        'fluid-sm': 'clamp(0.75rem, 0.8vw + 0.6rem, 1rem)',
        'fluid-base': 'clamp(0.875rem, 1vw + 0.75rem, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1.5vw + 1rem, 1.5rem)',
        'fluid-xl': 'clamp(1.5rem, 2vw + 1.25rem, 2.25rem)',
        'fluid-2xl': 'clamp(2rem, 3vw + 1.5rem, 3.5rem)',
        'fluid-hero': 'clamp(3rem, 8vw + 1rem, 8rem)',
      },
      spacing: {
        'fluid-sm': 'clamp(1rem, 2vw, 2rem)',
        'fluid-md': 'clamp(2rem, 4vw, 4rem)',
        'fluid-lg': 'clamp(4rem, 8vw, 8rem)',
        'fluid-xl': 'clamp(6rem, 12vw, 12rem)',
      },
      letterSpacing: {
        'widest': '0.15em',
        'mega': '0.3em',
      }
    },
  },
  plugins: [],
}
