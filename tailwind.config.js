/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Custom Breakpoints (mobile-first) ───────────────────
      screens: {
        'xs': '320px',   // iPhone SE, older devices
        'sm': '640px',   // Default sm
        'md': '768px',   // iPad
        'lg': '1024px',  // Tablet landscape
        'xl': '1280px',  // Desktop
        '2xl': '1536px', // Large desktop
      },
      colors: {
        primary: {
          DEFAULT: '#FF5722',
          hover: '#E64A19',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // ─── Mobile-first typography ────────────────────────
        'xs': ['12px', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        'sm': ['14px', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'base': ['16px', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'lg': ['18px', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['20px', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl': ['24px', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
      },
      spacing: {
        // ─── Mobile-optimized spacing ───────────────────────
        'safe-x': 'max(1rem, env(safe-area-inset-left))',
        'safe-y': 'max(1rem, env(safe-area-inset-top))',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      // ─── Responsive padding/margin helpers ─────────────────
      width: {
        'screen-safe': 'calc(100vw - 2 * max(1rem, env(safe-area-inset-left)))',
      },
    },
  },
  plugins: [],
}