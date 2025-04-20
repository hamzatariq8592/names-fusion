
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin name
const pluginName = 'names-fusion';

// Directory paths
const pluginDir = path.resolve(__dirname, pluginName);
const buildDir = path.resolve(pluginDir, 'react-build');
const assetsDir = path.resolve(buildDir, 'assets');

// Check if terser is available
let hasTerser = false;
try {
  require.resolve('terser');
  hasTerser = true;
} catch (e) {
  console.warn('Terser is not installed. Minification will be disabled.');
  console.warn('To enable minification, install terser with: npm install terser --save-dev');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'wordpress-plugin-setup',
      buildStart() {
        console.log('Setting up WordPress plugin build environment...');
        
        // Create directories if they don't exist
        [pluginDir, buildDir, assetsDir].forEach(dir => {
          if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
          }
        });
        
        // Create index.php files to prevent directory listing
        [pluginDir, buildDir, assetsDir].forEach(dir => {
          const indexPath = path.join(dir, 'index.php');
          if (!fs.existsSync(indexPath)) {
            console.log(`Creating index.php in: ${dir}`);
            fs.writeFileSync(indexPath, '<?php // Silence is golden.');
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: `${pluginName}/react-build`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/WordPressIntegration.tsx'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Add a banner comment to generated JS files
        banner: '/* Names Fusion WordPress Plugin - Built: ' + new Date().toISOString() + ' */',
      },
    },
    // Add source maps for easier debugging
    sourcemap: true,
    // Only use terser if it's available
    minify: hasTerser ? 'terser' : 'esbuild',
    terserOptions: hasTerser ? {
      compress: {
        drop_console: false, // Keep console logs for debugging in WordPress
      },
    } : undefined,
  },
});
