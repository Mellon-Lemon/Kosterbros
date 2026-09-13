import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
// The game is a static Netlify export: no Workers, database bindings or sign-in runtime.
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server:
    process.env.CODEX_SANDBOX === 'seatbelt'
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
  plugins: [vinext()],
});
