<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
    import  Toast from "./Toast.svelte"
	import { getDocumentDirection, getInitialTheme, toasterManager } from '$lib/utils-toast'
	import type { ToasterProps, ToastOptions, Position } from '$lib/types-toast'

	/* subset of: https://github.com/wobsoriano/svelte-sonner */

	type $$Props = ToasterProps

	type OListFocusEvent = FocusEvent & {
		currentTarget: EventTarget & HTMLOListElement
	}

	const VISIBLE_TOASTS_AMOUNT = 3
	const VIEWPORT_OFFSET = 32
	const TOAST_WIDTH = 356
	const STACKED_TOAST_GAP = 14

	export let invert = false
	export let theme: Exclude<$$Props['theme'], undefined> = 'light'
	export let position = 'bottom-right'
	export let hotkey: string[] = ['altKey', 'KeyT']
	export let richColors = false
	export let expand = false
	export let duration: Exclude<$$Props['duration'], undefined> = 4000
	export let visibleToasts = VISIBLE_TOASTS_AMOUNT
	export let closeButton = true
	export let toastOptions: ToastOptions = {}
	export let offset: $$Props['offset'] = null
	export let dir: $$Props['dir'] = getDocumentDirection()

	const { toasts, heights, reset } = toasterManager

	let expanded = false
	let interacting = false
	let actualTheme = getInitialTheme(theme)
	let toastsListElem: HTMLOListElement
	let lastFocusedElementRef: HTMLElement | null = null
	let isFocusWithinRef = false
	let possiblePositions: Position[] = []
	
	$: hotkeyLabel = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '')

	$: if ($toasts.length <= 1) {
		expanded = false
	}
	$: {
		const existingPositions = $toasts.filter((t) => t.position).map((t) => t.position)
		const uniquePositions   = Array.from(new Set([...existingPositions, position])).filter(Boolean) as Position[]

		possiblePositions = uniquePositions
	}
	$: {
		if (theme !== 'system') {
			actualTheme = theme
		}

		if (typeof window !== 'undefined') {
			if (theme === 'system') {
				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					actualTheme = 'dark'
				} else {
					actualTheme = 'light'
				}
			}

			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
				actualTheme = matches ? 'dark' : 'light'
			})
		}
	}

	function handleBlur(event: OListFocusEvent) {
		const doBlur = isFocusWithinRef && !event.currentTarget.contains(event.relatedTarget as HTMLElement)
		if (!doBlur) return

		isFocusWithinRef = false

		if (lastFocusedElementRef) {
			lastFocusedElementRef.focus({ preventScroll: true })
			lastFocusedElementRef = null
		}
	}
	function handleFocus(event: OListFocusEvent) {
		if (isFocusWithinRef) return

		isFocusWithinRef = true
		lastFocusedElementRef = event.relatedTarget as HTMLElement
	}
	function handleKeyDown(event: KeyboardEvent) {
		const isHotkeyPressed = hotkey.every((key) => (event as any)[key] || event.code === key)
		if (isHotkeyPressed) {
			expanded = true
			toastsListElem?.focus()
		}

		const isToasterActive = document.activeElement === toastsListElem || toastsListElem?.contains(document.activeElement) 

		if (event.code === 'Escape' && isToasterActive) {
			expanded = false;
		}
	}

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeyDown)

		if (!toastsListElem || !lastFocusedElementRef) return

		lastFocusedElementRef.focus({ preventScroll: true })
		lastFocusedElementRef = null
		isFocusWithinRef = false
	})
	onMount(() => {
		reset()
		document.addEventListener('keydown', handleKeyDown)
	})
</script>

{#if $toasts.length > 0}
	<section aria-label={`Notifications ${hotkeyLabel}`} tabIndex={-1}>
		{#each possiblePositions as position, index}
			<ol
				bind:this={toastsListElem}
				tabIndex={-1}
				class={$$props.class}
				data-sonner-toaster
				data-theme={actualTheme}
				data-rich-colors={richColors}
				data-y-position={position.split('-')[0]}
				data-x-position={position.split('-')[1]}
				dir={dir === 'auto' ? getDocumentDirection() : dir}
				style:--front-toast-height={`${$heights[0]?.height}px`}
				style:--offset={typeof offset === 'number' ? `${offset}px` : offset || `${VIEWPORT_OFFSET}px`}
				style:--width={`${TOAST_WIDTH}px`}
				style:--gap={`${STACKED_TOAST_GAP}px`}
				style={$$props.style}
				{...$$restProps}
				on:blur={handleBlur}
				on:focus={handleFocus}
				on:mouseenter={() => {
					expanded = true
				}}
				on:pointerdown={() => interacting = true}
				on:pointerup={() => interacting = false}
				on:mousemove={() => expanded = true}
				on:mouseleave={() => {
					if (interacting) return
					expanded = false
				}}
			>
				<!-- Render toas of the same position -->
				{#each $toasts.filter((toast) => (!toast.position && index === 0) || toast.position === position) as toast, index (toast.id)}
					<Toast
						{index}
						{toast}
						{invert}
						{visibleToasts}
                        closeButton={closeButton}
						{interacting}
						{position}
						expandByDefault={expand}
						{expanded}
						actionButtonStyle={toastOptions?.actionButtonStyle || ''}
						cancelButtonStyle={toastOptions?.cancelButtonStyle || ''}
						class={toastOptions?.class || ''}
						descriptionClass={toastOptions?.descriptionClass || ''}
						classes={toastOptions.classes || {}}
						duration={toastOptions?.duration ?? duration}
						unstyled={toastOptions.unstyled || false}
					>
					</Toast>
				{/each}
			</ol>
		{/each}
	</section>
{/if}

<style lang="scss">
    @import '../scss/toasts.scss';
</style>