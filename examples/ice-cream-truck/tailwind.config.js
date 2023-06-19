// tailwind.config.js
/* eslint-disable */
const { nextui } = require('@nextui-org/react')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    nextui({
      themes: {
        light: {
          primary: '#D8A7B1',
          secondary: '#95D1DA',
        },
        dark: {
          primary: '#FFD34E',
          secondary: '#EE457E',
        },
      },
    }),
  ],
}
