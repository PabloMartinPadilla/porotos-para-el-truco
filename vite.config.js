import { defineConfig } from 'vite';

export default defineConfig({
    // En GitHub Pages el sitio vive en /<repo-name>/, no en /.
    // base: './' genera paths relativos que funcionan en cualquier subpath.
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
