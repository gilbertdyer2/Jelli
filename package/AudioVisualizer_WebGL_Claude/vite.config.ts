import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

const rpi = !!process.env.VITE_RPI_MODE;

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      // RPi overrides must precede the generic @audio directory alias
      ...(rpi ? [
        { find: '@audio/audioEngine',     replacement: path.resolve(__dirname, 'src/audio/wsReceiver.ts') },
        { find: '@audio/detectorFactory', replacement: path.resolve(__dirname, 'src/audio/detectorFactory.rpi.ts') },
      ] : []),
      { find: '@stores',     replacement: path.resolve(__dirname, 'src/stores') },
      { find: '@renderer',   replacement: path.resolve(__dirname, 'src/renderer') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@audio',      replacement: path.resolve(__dirname, 'src/audio') },
      { find: '@creatures',  replacement: path.resolve(__dirname, 'src/creatures') },
      { find: '@types',      replacement: path.resolve(__dirname, 'src/types/index.ts') },
      { find: '@utils',      replacement: path.resolve(__dirname, 'src/utils') },
    ]
  }
});
