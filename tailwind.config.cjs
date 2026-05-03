module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Manrope"', '"Avenir Next"', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 24px 80px rgba(2, 8, 23, 0.35)',
      },
    },
  },
  plugins: [],
};

