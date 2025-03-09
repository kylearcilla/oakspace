/// <reference types="svelte" />

declare global {
	declare namespace YT {
		class Player {
			constructor(id: string, options: any)
		}
	}

	declare interface Window {
		google: any;
		YT: any;
		onYouTubeIframeAPIReady: () => void;
	}
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

declare namespace svelte.JSX {
	interface DOMAttributes<T> {
		'on:outClick'?: (event: CustomEvent<any>) => void
	}
}

export {}