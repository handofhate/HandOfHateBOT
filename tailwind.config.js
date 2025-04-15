/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./gui/**/*.{html,js}"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}