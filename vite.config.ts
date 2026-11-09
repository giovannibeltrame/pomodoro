/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  test: {
    environment: 'jsdom',
    env: { TZ: 'Europe/Rome' },
    setupFiles: ['src/test/setup.ts'],
  },
});
