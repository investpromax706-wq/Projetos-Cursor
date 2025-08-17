import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Barbearia - Gestão',
				short_name: 'Barbearia',
				description: 'App de gestão para barbearia',
				display: 'standalone',
				start_url: '/',
				background_color: '#111827',
				theme_color: '#111827'
			},
			workbox: {
				navigateFallback: '/index.html',
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/api'),
						handler: 'NetworkFirst' as const,
						options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 }
					}
				]
			}
		})
	]
});