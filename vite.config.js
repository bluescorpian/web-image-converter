import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		rollupOptions: {
			input: [resolve(__dirname, 'index.html'), resolve(__dirname, 'pdf.html'), resolve(__dirname, 'image.html')],
		},
	},
});
