import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
 build: {
  rollupOptions: {
    onwarn(warning, warn) {
      // Suppress false positive for BufferGeometryUtils namespace imports
      if (
        warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
        (warning.code === 'MISSING_EXPORT' && warning.id?.includes('BufferGeometryUtils'))
      ) return;
      warn(warning);
    },
    output: {
      manualChunks: {
        three: ['three'],
        react: ['react', 'react-dom'],
      }
    }
  }
},
})