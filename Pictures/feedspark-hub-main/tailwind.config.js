module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        md: { min: '650px', max: '1024px' }, // Specifically target tablet range
      },
    },
  },
  plugins: [],
}
