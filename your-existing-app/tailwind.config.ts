import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#101044', lilac: '#B8A6C8', paper: '#F7F3EC' }, fontFamily: { serif: ['var(--font-serif)'], sans: ['var(--font-sans)'] } } }, plugins: [] } satisfies Config;
