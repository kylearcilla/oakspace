// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	declare interface Window {
		google: any;
		MusicKit: any;
	}
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
	namespace svelte.JSX {
		interface HTMLAttributes<T> {
			onclick_outside?: (e: CustomEvent) => void
		}
	}
}

export {};

