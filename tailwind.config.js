/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'], // Adds the 'font-orbitron' class
      },
       colors: {
        primary: '#252525',   // custom color name with HEX code
        secondry: '#575757',
        thirdry: '#99C842',
        active:'#0FE000',
        inactive:'#EB3915',
        danger: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
      }
    },
  },
  plugins: [],
}

