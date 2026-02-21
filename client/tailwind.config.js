/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // Default breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.8',
            h1: { color: '#111827', fontWeight: '700', lineHeight: '1.25' },
            h2: { color: '#111827', fontWeight: '700', lineHeight: '1.3' },
            h3: { color: '#111827', fontWeight: '600' },
            h4: { color: '#111827', fontWeight: '600' },
            strong: { color: '#111827', fontWeight: '700' },
            a: { color: '#2563eb', textDecoration: 'underline' },
            'ul > li': { paddingLeft: '0.375em' },
            'ol > li': { paddingLeft: '0.375em' },
            blockquote: {
              borderLeftColor: '#3b82f6',
              color: '#4b5563',
              fontStyle: 'italic',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

