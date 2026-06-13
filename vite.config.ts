import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss()];

  if (mode === 'analyze') {
    const { visualizer } = await import('rollup-plugin-visualizer');

    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    );
  }

  return {
    plugins,
  };
});
