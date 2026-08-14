import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.75rem',
        md: '0.625rem',
        sm: '0.5rem'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))'
      },
      boxShadow: {
        premium: '0 10px 35px rgba(2, 6, 23, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
