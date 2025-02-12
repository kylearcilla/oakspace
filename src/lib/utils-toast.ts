import { get } from "svelte/store"

import { globalContext } from "./store"
import { clientWritable } from "./utils-toast-context"
import type { Toast, HeightT, ExternalToast, Toastypes, PromiseT, PromiseData } from "./types-toast"

export const EXPANDED_TOAST_GAP = 8
export const TOAST_GAP = 14

export const LIFT = -1
export const LIFT_AMOUNT = LIFT * TOAST_GAP

export const LOGO_WIDTH = 100
export const DISMISS_AFTER_MS = 5000
export const DELETE_ITEM_DELAY = 120

/* subset of: https://github.com/wobsoriano/svelte-sonner */

/**
 * Wrapper of toast API. 
 * Inits hasToaster prop to declare that a toaster will be set.
 * 
 * @param type   Type of toast.
 * @param data   Toast configruation.
 */
export function toast<ToastData>(
	type: keyof typeof toastAPI, 
	data?: ExternalToast & { message: string } | PromiseData<ToastData>,
	promise?: PromiseT<ToastData>
) {
	const toastFunc = (toastAPI[type] as any)
	const message = (data && "message" in data) ? data.message : ""
	const noToaster = !get(globalContext).hasToaster

	if (noToaster) {
		globalContext.update((data) => ({ ...data, hasToaster: true }))

		requestAnimationFrame(() => {
			if (type === "promise") {
				toastFunc(promise, { ...data })		
			}
			else {
				toastFunc(message, { ...data })
			}
		})
	}
	else if (type === "promise") {
		toastFunc(promise, { ...data })
	}
	else {
		toastFunc(message, { ...data })
	}
}

export let toasterManager = ToasterManager()

export const toastAPI = {
	default: makeDefaultToast,
	message: toasterManager.makeMessageToast,
	success: toasterManager.makeSuccessToast,
	info:    toasterManager.makeInfoToast,
	warning: toasterManager.makeWarningToast,
	error:   toasterManager.makeErrorToast,
	promise: toasterManager.makePromiseToast,
	loading: toasterManager.makeLoadingToast,
	dismiss: toasterManager.dismiss
}


function makeDefaultToast(message: string, data?: ExternalToast){
	return toasterManager!.create({ message, ...data })
}

/**
 * Function that creates an object that manages toasts and its heights states.
 * Contains methods to be used by client that creates different tpyes of toast.
 * 
 * @returns   Toast manager object.
 */
function ToasterManager() {
	const toasts = clientWritable<Toast[]>([])
	const heights = clientWritable<HeightT[]>([])
	let toastsCount = 0

	function addToast(newToast: Toast) {
        toasts.update(prev => {
            if (newToast.groupExclusive) {
                prev = prev.filter(toast => toast.contextId !== newToast.contextId)
            }
            return [newToast, ...prev.map(toast => ({ ...toast, updated: true }))]
        })
    }

	function create(data: ExternalToast & { message?: string; type?: Toastypes; promise?: PromiseT; }) {
		const { message, ...rest } = data 

		// if a valid id then use that, otherwise use its new idx
		const id = typeof data?.id === 'number' || (data.id && data.id?.length > 0) ? data.id : toastsCount++
			
		const type        = data.type === undefined ? 'default' : data.type
		const $toasts     = get(toasts)
		const doesExist   = $toasts.find((toast) => toast.id === id )

		if (!doesExist) {
			addToast({ ...rest, id, title: message, type })
		}
		else {
			toasts.update((items) => {
				return items.map((toast) => {
					return toast.id === id
						? { ...toast, ...data, id, title: message, type, updated: true } 
						: { ...toast, updated: false }
				})
			})
		}
		return id
	}

	function dismiss(id?: number | string) {
		if (id === undefined) {
			toasts.set([])
			return
		}
		toasts.update((_toasts) => _toasts.filter((toast) => toast.id !== id))
		return id
	}

	function makeMessageToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'default', message })
	}

	function makeErrorToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'error', message })
	}

	function makeSuccessToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'success', message })
	}

	function makeInfoToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'info', message })
	}

	function makeWarningToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'warning', message })
	}

	function makeLoadingToast(message: string, data?: ExternalToast) {
		return create({ ...data, type: 'loading', message })
	}

	function makePromiseToast<ToastData>(promise: PromiseT<ToastData>, data?: PromiseData<ToastData>) {
		if (!data) return

		let id: string | number | undefined = undefined

		// first loading the toast as a loading type
		if (data.loading !== undefined) {
			id = create({
				...data, 
				promise, 
				message: data.loading,
				type: 'loading'
			})
		}

		const p = promise instanceof Promise ? promise : promise()
		let shouldDismiss = id !== undefined

		// then update the toast to a success or error type
		p
		.then((response: any) => {
			if (response && typeof response.ok === 'boolean' && !response.ok) {
				shouldDismiss = false

				create({ ...data, id, type: 'error', message: data.error as string })
			} 
			else if (data.success !== undefined) {
				shouldDismiss = false

				create({ ...data, id, type: 'default', message: data.success as string })
			}
		})
		.catch(() => {
			if (data.error !== undefined) {
				shouldDismiss = false

				create({ ...data, id, type: 'error', message: data.error as string })
			}
		})
		.finally(() => {
			// toast is still in load state (and will be indefinitely — dismiss it)
			if (shouldDismiss) {
				dismiss(id)
				id = undefined
			}
			data.finally?.()
		})

		return id
	}

	function removeHeight(id: number | string) {
		heights.update((prev) => prev.filter((height) => height.toastId !== id))
	}

	function addHeight(height: HeightT) {
		heights.update((prev) => [height, ...prev])
	}

	function reset() {
		toasts.set([])
		heights.set([])
	}

	return {
		makeMessageToast, makeErrorToast,
		makeSuccessToast, makeInfoToast,
		makeWarningToast, makeLoadingToast,
		makePromiseToast,
		removeHeight,
		addToast, addHeight,
		reset, create,
		dismiss,
		toasts,
		heights
	}
}

/**
 * Hacky useEffect impl.
 * https://github.com/sveltejs/svelte/issues/5283#issuecomment-678759305
*/
export const useEffect = (subscribe: unknown) => ({ subscribe })