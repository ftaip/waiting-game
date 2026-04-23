import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  minify: false,
});
