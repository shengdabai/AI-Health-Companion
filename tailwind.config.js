/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Adopt Tailwind default palette, spacing, typography, radii, shadows, motion and breakpoints.
  // Project semantic additions belong here; components consume these tokens.
  theme: {
    extend: {
      height: { chat: "37.5rem" },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#2E86AB',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        secondary: {
          50: '#f0fdfa',
          500: '#A8DADC',
          600: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}