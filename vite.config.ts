import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const CSS_SILENCE_TEXTS = [
	'Expected percentage',  // occurs when minifying scss animation
]

/**
 * Creates a Vite plugin that silences certain CSS warnings.
 * @returns A Vite plugin that silences CSS warnings.
 */
function createSilenceCssWarningsPlugin() {
	return {
		name: 'silence-css-warnings',
		configResolved() {
			const originalWarn = console.warn;
			console.warn = (...args: any[]) => {
				const message = args[0]?.toString() || '';
				if (!CSS_SILENCE_TEXTS.some(text => message.includes(text))) {
					originalWarn.apply(console, args)
				}
			};
		}
	};
}

export default defineConfig({
	plugins: [
		sveltekit(),
		createSilenceCssWarningsPlugin()
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
		postcss: {
			plugins: []
		},
		devSourcemap: false
	},
	build: {
		cssMinify: 'lightningcss',
		minify: true,
		cssCodeSplit: true,
		reportCompressedSize: false,
	}
});
