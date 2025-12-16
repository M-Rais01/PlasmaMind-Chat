import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the Google GenAI SDK and existing code
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || env.API_KEY),
      // If you have other process.env usages, define them here
    },
    server: {
      port: 3000
    }
  };
});