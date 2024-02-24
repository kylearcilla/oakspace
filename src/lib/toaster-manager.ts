import { get } from "svelte/store"
import type { ToastT, HeightT, ExternalToast, ToastTypes, PromiseT, PromiseData } from "./types-toast"
import { clientWritable } from "./utils-toast-context"
import type { ComponentType } from "svelte"

/**
 * Function that creates an object that manages toasts and its heights states.
 * Contains methods to be used by client that creates different tpyes of toast.
 * 
 * @returns   Toast manager object.
 */
export class ToasterManager {
	toasts = clientWritable<ToastT[]>([])
	heights = clientWritable<HeightT[]>([])
	toastsCount: number

	constructor() {
		this.toastsCount = 0
	}

	/**
	 * Adds a toast. 
	 * @param newToast   New toast to be added 
	 */
	addToast(newToast: ToastT) {
		this.toasts.update(prev => {
			// update is set to true so toast can be notified and update new their dismissal times according to their new indices
			const updatedToasts = prev.map(toast => ({ ...toast, updated: true }));

			return [newToast, ...updatedToasts];
		});
	}

	/**
	 * Create a new toast component
	 * @param   data  New toast component data
	 * @returns 
	 */
	create(data: ExternalToast & { message?: string | ComponentType; type?: ToastTypes; promise?: PromiseT; }) {
		const { message, ...rest } = data

		// if a valid id then use that, otherwise use its new idx
		const id = typeof data?.id === 'number' || (data.id && data.id?.length > 0) ? data.id : this.toastsCount++

		const dismissable = data.dismissable === undefined ? true : data.dismissable
		const type        = data.type === undefined ? 'default' : data.type
		const $toasts     = get(this.toasts)
		const doesExist   = $toasts.find((toast) => toast.id === id )

		if (!doesExist) {
			this.addToast({ ...rest, id, title: message, dismissable, type })
		}
		else {
			this.toasts.update((_toasts) => {
				return _toasts.map((toast) => 
					toast.id === id
						? { ...toast, ...data, id, title: message, dismissable, type, updated: true }    // update existing toast
						: { ...toast, updated: false }
				)
			})
		}
		return id
	}

	/**
	 * Dismiss toast
	 * @param id   Id of toast to be dissmissed
	 * @returns    Id of toast dismissed
	 */
	dismiss(id?: number | string) {
		if (id === undefined) {
			this.toasts.set([])
			return
		}
		this.toasts.update((_toasts) => _toasts.filter((toast) => toast.id !== id))
		return id
	}

	/* Methods for creating different toast types */

	makeMessageToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'default', message })
	}

	makeErrorToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'error', message })
	}

	makeSuccessToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'success', message })
	}

	makeInfoToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'info', message })
	}

	makeWarningToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'warning', message })
	}

	makeLoadingToast(message: string | ComponentType, data?: ExternalToast) {
		return this.create({ ...data, type: 'loading', message })
	}

	makePromiseToast<ToastData>(promise: PromiseT<ToastData>, data?: PromiseData<ToastData>) {
		if (!data) return

		let id: string | number | undefined = undefined

		if (data.loading !== undefined) {
			id = this.create({
				...data, promise,
				type: 'loading', message: data.loading
			})
		}

		const p = promise instanceof Promise ? promise : promise()
		let shouldDismiss = id !== undefined

		// TODO: Clean up TS here, response has incorrect type
		p.then((response: any) => {
			if (response && typeof response.ok === 'boolean' && !response.ok) {
				shouldDismiss = false

                // @ts-ignore
				const message = typeof data.error === 'function' ? data.error(`HTTP error! status: ${response.status}`) : data.error
				this.create({ id, type: 'error', message })
			} 
			else if (data.success !== undefined) {
				shouldDismiss = false

                // @ts-ignore
				const message =	typeof data.success === 'function' ? data.success(response) : data.success
				this.create({ id, type: 'success', message })
			}
		})
			.catch((error: any) => {
				if (data.error !== undefined) {
					shouldDismiss = false

                    // @ts-ignore
					const message = typeof data.error === 'function' ? data.error(error) : data.error
					this.create({ id, type: 'error', message })
				}
			})
			.finally(() => {
				// Toast is still in load state (and will be indefinitely — dismiss it)
				if (shouldDismiss) {
					this.dismiss(id)
					id = undefined
				}
				data.finally?.()
			})

		return id
	}

	makeCustomToast<T extends ComponentType = ComponentType>(component: T, data?: ExternalToast<T>) {
		const id = data?.id || this.toastsCount++
		this.create({ component, id, ...data })
		return id
	}

	/**
	 * After a toast has been deleted, remove its height
	 * @param id   Removed toast's io
	 */
	removeHeight(id: number | string) {
		console.log(this)
		this.heights.update((prev) => prev.filter((height) => height.toastId !== id))
	}

	/**
	 * After a toast has been add, add its height
	 * @param id   Added toast's id
	 */
	addHeight(height: HeightT) {
		console.log(this.makeCustomToast)
		this.heights.update((prev) => [height, ...prev])
	}

	reset() {
		this.toasts.set([])
		this.heights.set([])
	}
}