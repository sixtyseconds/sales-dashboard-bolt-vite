import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize chunk sizes for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-popover'],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          // Feature chunks
          'dashboard': ['src/pages/Dashboard.tsx', 'src/components/SalesActivityChart.tsx'],
          'pipeline': ['src/pages/PipelinePage.tsx', 'src/lib/contexts/PipelineContext.tsx'],
          'tasks': ['src/pages/TasksPage.tsx', 'src/components/TaskForm.tsx', 'src/components/TaskKanban.tsx'],
        },
      },
    },
    // Increase chunk size warning limit for better development experience
    chunkSizeWarningLimit: 800,
    // Enable sourcemaps for better debugging in production
    sourcemap: process.env.NODE_ENV !== 'production',
    // Minify for production
    minify: 'esbuild',
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  // Optimize dependencies during development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'date-fns',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});