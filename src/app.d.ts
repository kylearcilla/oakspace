declare global {
	declare interface Window {
		google: any;
		MusicKit: MusicKitType;
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

