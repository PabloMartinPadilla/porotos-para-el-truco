import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
    // En GitHub Pages el sitio vive en /<repo-name>/, no en /.
    // base: './' genera paths relativos que funcionan en cualquier subpath.
    base: './',

    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
                name: 'Porotos pal Truco',
                short_name: 'Porotos',
                description: 'Tanteador de Truco con estética campera uruguaya',
                theme_color: '#130e05',
                background_color: '#130e05',
                display: 'standalone',
                orientation: 'portrait',
                scope: './',
                start_url: './',
                icons: [
                    {
                        src: 'icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                // Cachea todos los assets del build + íconos
                globPatterns: ['**/*.{js,css,html,svg,png}'],
            },
        }),
    ],

    define: {
        __APP_VERSION__: JSON.stringify(version),
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
