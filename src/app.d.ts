/// <reference types="svelte" />

declare global {
	declare interface Window {
		google: any;
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