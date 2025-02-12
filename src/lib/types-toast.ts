import type { LogoIcon } from './enums'
import type { ComponentType } from 'svelte'

export type MakeToastFn = (message: string, data?: ExternalToast) => string | number

export type ToastAPI = MakeToastFn & {
    message: MakeToastFn
    success: MakeToastFn
    info: MakeToastFn
    warning: MakeToastFn
    error: MakeToastFn
    promise: <T>(promise: PromiseT<T>, data?: PromiseData<T>) => string | number | undefined
    loading: MakeToastFn
    dismiss: MakeToastFn
}

export type Toastypes =
	| 'default'
	| 'message'
	| 'action'
	| 'success'
	| 'info'
	| 'warning'
	| 'promise'
	| 'error'
	| 'loading'

export type PromiseT<Data = unknown> = Promise<Data> | (() => Promise<Data>)

export type PromiseData<ToastData = unknown> = ExternalToast & {
	loading?: string
	success?: string | ComponentType | ((data: ToastData) => ComponentType | string)
	error?: string | ComponentType | ((error: unknown) => ComponentType | string)
	finally?: () => void | Promise<void>
}

export type Toast = {
	id: number | string
	title?: string
	type?: Toastypes
	icon?: LogoIcon | string
	description?: string
	contextId?: string
	delete?: boolean
	groupExclusive?: boolean
	action?: {
		label: string
		onClick: (event: MouseEvent) => void
	}
	onDismiss?: (toast: Toast) => void
	onAutoClose?: (toast: Toast) => void
	position?: Position
	updated?: boolean
}

export type Position =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right'
	| 'top-center'
	| 'bottom-center'

export type HeightT = {
	height: number
	toastId: number | string
}

export type ExternalToast = Omit<Toast, 'id' | 'type' | 'title' | 'updated'> & {
	id?: number | string
}

export type ToastOptions = {
	duration?: number
}