import { writable, type Updater } from "svelte/store"

export const isBrowser = typeof document !== 'undefined'

/**
 * A custom store that only allows setting/updating the value from the
 * browser to avoid SSR data leaks. By defining this helper, we don't
 * have to worry about checking for `isBrowser` in every place we
 * mutate the various stores.
 *
 * This should only ever be initialized with an empty array or object,
 * as otherwise the initial value will persist across requests.
 */
export function clientWritable<T>(initialValue: T) {
	const store = writable(initialValue)

	function set(value: T) {
		if (!isBrowser) return
		store.set(value)
	}
	function update(updater: Updater<T>) {
		if (!isBrowser) return
		store.update(updater)
	}

	return {
		set, update,
		subscribe: store.subscribe
	}
}
