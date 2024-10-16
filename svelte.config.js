import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	onwarn: (warning, handler) => {
		if (warning.code === 'css-unused-selector') {
			return;
		}
		handler(warning);
	},
	preprocess: preprocess({
		scss: {
			prependData: "@import './src/scss/global.scss';"
		}
	}),
	kit: {
		adapter: adapter()
	},
};

export default config;
