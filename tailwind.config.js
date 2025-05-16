const tokens = require('./src/styles/tokens');

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: tokens.color,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      fontSize: tokens.fontSize,
    },
  },
  plugins: [],
}; 