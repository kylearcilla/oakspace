<script lang="ts">
	import { Icon, LogoIcon } from '$lib/enums'
	import type { ToastClassnames, ToastProps } from '$lib/types-toast'
	import { cn, toasterManager, useEffect } from '$lib/utils-toast'
	import { onDestroy, onMount } from 'svelte'
	import Logo from './Logo.svelte'
	import SvgIcon from './SVGIcon.svelte'

	type $$Props = Expand<ToastProps>

	export let toast: $$Props['toast']
	export let index: $$Props['index']
	export let expanded: $$Props['expanded']
	export let invert: $$Props['invert']
	export let position: $$Props['position']
	export let visibleToasts: $$Props['visibleToasts']
	export let expandByDefault: $$Props['expandByDefault']
	export let closeButton: $$Props['closeButton']
	export let interacting: $$Props['interacting']
	export let cancelButtonStyle: $$Props['cancelButtonStyle'] = ''
	export const actionButtonStyle: $$Props['actionButtonStyle'] = ''
	export let duration: $$Props['duration'] = 4000
	export const descriptionClass: $$Props['descriptionClass'] = ''
	export let classes: $$Props['classes'] = {}
	export let unstyled: $$Props['unstyled'] = false

	const EXPANDED_GAP = 8
	const TOAST_LIFETIME = 4000
	const TOAST_NBR_DISAPPEAR_DELAY = 3000
	const TIME_BEFORE_UNMOUNT = 200
	const SWIPE_TRESHOLD = 130
	const MIN_SWIPE_THRESHOLD = 20
	const MIN_TIME_THRESHOLD = 20
	const MAX_TIME_THRESHOLD = 100

	const TOAST_ICON_OPTIONS = {
		AppleMusic:   { iconWidth: "50%" },
		Spotify:      { iconWidth: "90%", hasBgColor: false },
		YoutubeMusic: { iconWidth: "60%" },
		Soundcloud:   { iconWidth: "60%" },
		Youtube:      { iconWidth: "60%" },
		Google:       { iconWidth: "60%" },
		Luciole:      { iconWidth: "60%" }
	}

	let pointerDownTimeStamp = 0
	let mounted = false
	let removed = false
	let swiping = false
	let swipeOut = false
	let offsetBeforeRemove = 0
	let initialHeight = 0
	let toastRef: HTMLLIElement
    let iconOptions: any

	let closeTimerStartTimeRef = 0
	let lastCloseTimerStartTimeRef = 0
	let pointerStartRef: { x: number, y: number } | null = null

	let timeoutId: ReturnType<typeof setTimeout>
	let remainingTime = toast.duration || duration || TOAST_LIFETIME

	let effect

	const defaultClasses: ToastClassnames = {
		toast: '', title: '', description: '',
		closeButton: '', cancelButton: '', actionButton: '',
		action: '', warning: '', error: '', success: '',
		default: '', info: '', loader: '',
		loading: ''
	}
	const { toasts, heights, removeHeight, addHeight, dismiss } = toasterManager!

	
	$: classes = { ...defaultClasses, ...classes }
	$: isFront = index === 0
	$: isVisible = index + 1 <= visibleToasts
	$: toastType = toast.type ?? 'default'
	$: toastClass = toast.class || ''
	$: toastDescriptionClass = toast.descriptionClass || ''
	$: coords = position.split('-')
	$: invert = toast.invert || invert
	$: $effect
	$: disabled = toastType === 'loading'
	$: offset = heightIdx * EXPANDED_GAP + toastsHeightBefore
	$: isPromiseLoadingOrInfiniteDuration = (toast.promise && toastType === 'loading') || toast.duration === Number.POSITIVE_INFINITY

	// Height index is used to calculate the offset as it gets updated before the toast array, which means we can calculate the new layout faster.
	$: heightIdx = $heights.findIndex((height: any) => height.toastId === toast.id) || 0
	$: toastsHeightBefore = $heights.reduce((prev: any, curr: any, idx: any) => idx >= heightIdx ? prev : prev + curr.height, 0)

	$: if (toast.delete) {
		deleteToast()
	}
	$: {
		const iconStrIdx = LogoIcon[toast.logoIcon!] as keyof typeof TOAST_ICON_OPTIONS
		iconOptions = TOAST_ICON_OPTIONS[iconStrIdx]
	}
	$: if (toast.updated) {
		clearTimeout(timeoutId)

        remainingTime = (toast.duration || duration || TOAST_LIFETIME) + (index * TOAST_NBR_DISAPPEAR_DELAY)
		setPointerDownTime()
	}
	$: effect = useEffect(() => {
		if (!isPromiseLoadingOrInfiniteDuration) {
			(expanded || interacting) ? pauseTimer() : setPointerDownTime()
		}
		return () => clearTimeout(timeoutId)
	})

	function deleteToast() {
		removed = true
		offsetBeforeRemove = offset   // Save the offset for the exit swipe animation

		removeHeight(toast.id)
		setTimeout(() => dismiss(toast.id), TIME_BEFORE_UNMOUNT)
	}

	/**
	 *  If toast's duration changes, it will be out of sync with the remainingAtTimeout,
	 *  so we know we need to restart the timer with the new duration
	 *  
	 *  Pause the tmer on each hover
	 */
	function pauseTimer() {
		if (lastCloseTimerStartTimeRef < closeTimerStartTimeRef) {
			// Get the elapsed time since the timer started
			const elapsedTime = new Date().getTime() - closeTimerStartTimeRef
			remainingTime = remainingTime - elapsedTime
		}

		lastCloseTimerStartTimeRef = new Date().getTime()
	}

	function setPointerDownTime() {
		closeTimerStartTimeRef = new Date().getTime()
		
		// Let the toast know it has started
		timeoutId = setTimeout(() => {
			toast.onAutoClose?.(toast)
			deleteToast()
		}, remainingTime)
	}

	/* Event Handlers */

	function actionBtnClickedHandler(event: Event) {
		toast.action?.onClick(event as MouseEvent)
		if (event.defaultPrevented) return

		deleteToast()
	}
	function closeBtnClickedHandler() {
		deleteToast()
		if (toast.cancel?.onClick) {
			toast.cancel.onClick()
		}
	}
	function cancelBtnClickedHandler() {
		if (disabled) return
		deleteToast()
		toast.onDismiss?.(toast)
	}

	function onPointerDown(event: PointerEvent) {
		if (disabled) return

		offsetBeforeRemove = offset
		const target = event.target as HTMLElement
		// Ensure we maintain correct pointer capture even when going outside of the toast (e.g. when swiping)
		target.setPointerCapture(event.pointerId)
		if (target.tagName === 'BUTTON') {
			return
		}

        pointerDownTimeStamp = Date.now()

		swiping = true
		pointerStartRef = { x: event.clientX, y: event.clientY }
	}

	function onPointerUp() {
		if (swipeOut) return

		pointerStartRef = null

		const swipeAmount = Number(toastRef?.style.getPropertyValue('--swipe-amount').replace('px', '') || 0)
		const currentTime = Date.now()
		const timeDifference = currentTime - pointerDownTimeStamp 
		const isValidTime = MIN_TIME_THRESHOLD <= timeDifference && timeDifference <= MAX_TIME_THRESHOLD
		
		if (Math.abs(swipeAmount) >= SWIPE_TRESHOLD || (isValidTime && Math.abs(swipeAmount) >= MIN_SWIPE_THRESHOLD)) {
			offsetBeforeRemove = offset
			toast.onDismiss?.(toast)
			deleteToast()
			swipeOut = true
			return
		}
		toastRef.style.setProperty('--swipe-amount', '0px')
		swiping = false
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointerStartRef) return

		const yPosition = event.clientY - pointerStartRef!.y
		const xPosition = event.clientX - pointerStartRef!.x

		const clamp = coords[0] === 'top' ? Math.min : Math.max
		const clampedX = clamp(0, xPosition)
		const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2
		const isAllowedToSwipe = Math.abs(clampedX) > swipeStartThreshold

		if (isAllowedToSwipe) {
			toastRef.style.setProperty('--swipe-amount', `${xPosition}px`)
		} else if (Math.abs(yPosition) > swipeStartThreshold) {
			pointerStartRef = null
		}
	}

	onMount(() => {
		mounted = true

		// Add toast height total heights array after the toast is mounted
		const height = toastRef.getBoundingClientRect().height
		initialHeight = height

		console.log("XX")

	    addHeight({ toastId: toast.id, height })
	})
	onDestroy(() => removeHeight(toast.id))
</script>

<li
	bind:this={toastRef}
	aria-live={toast.important ? 'assertive' : 'polite'}
	aria-atomic="true"
	role="status"
	tabIndex={0}
    class="toast"
	data-sonner-toast=""
	data-styled={!(toast.component || toast?.unstyled || unstyled)}
	data-mounted={mounted}
	data-promise={Boolean(toast.promise)}
	data-removed={removed}
	data-visible={isVisible}
	data-y-position={coords[0]}
	data-x-position={coords[1]}
	data-index={index}
	data-front={isFront}
	data-swiping={swiping}
	data-type={toastType}
	data-invert={invert}
	data-swipe-out={swipeOut}
	data-expanded={Boolean(expanded || (expandByDefault && mounted))}
	style={`${$$props.style} ${toast.style}`}
	style:--index={index}
	style:--toasts-before={index}
	style:--z-index={$toasts.length - index}
	style:--offset={`${removed ? offsetBeforeRemove : offset}px`}
	style:--initial-height={expandByDefault ? 'auto' : `${initialHeight}px`}
	on:pointerdown={onPointerDown}
	on:pointerup={onPointerUp}
	on:pointermove={onPointerMove}
>
	<div class="toast__grab-bar"></div>

    <!-- Close Button -->
	{#if closeButton && !toast.component}
		<button
            class="toast__close-btn" 
			aria-label="Close toast"
			data-disabled={disabled}
            data-close-btn=""
			on:click={cancelBtnClickedHandler}
		>
            <div class="toast__close-btn-icon">
                <SvgIcon icon={Icon.Close} options={{ scale: 0.88, strokeWidth: 1.2 }} />
            </div>
		</button>
	{/if}

	<!-- Custom Component -->
	{#if toast.component}
		<svelte:component this={toast.component} {...toast.componentProps} on:closeToast={deleteToast}>
		</svelte:component>
	<!-- Loading Icon -->
	{:else if toastType !== 'default' || toast.icon || toast.promise}
		<div data-icon="">
			{#if (toast.promise || toastType === 'loading') && !toast.icon}
				<slot name="loading-icon" />
			{/if}
			{#if toast.icon}
				<svelte:component this={toast.icon}></svelte:component>
			{:else}
				{#if toastType === 'success'}
					<slot name="success-icon" />
				{:else if toastType === 'error'}
					<slot name="error-icon" />
				{:else if toastType === 'warning'}
					<slot name="warning-icon" />
				{:else if toastType === 'info'}
					<slot name="info-icon" />
				{/if}
			{/if}
		</div>
	<!-- Title and Description -->
	{:else}
		<div data-content="">
            <div class="toast__header">
				{#if toast.logoIcon != null}
					<div class="toast__header-icon">
						<Logo 
							logo={toast.logoIcon} 
							options={{ containerWidth: `100%`, ...iconOptions}} 
						/>
					</div>
				{/if}
                <div class="toast__header-title">
                    {toast.title}
                </div>
            </div>
            <div class="toast__header-description">
                {#if typeof toast.description !== 'string'}
                    <svelte:component this={toast.description} {...toast.componentProps} />
                {:else}
                    {toast.description}
                {/if}
            </div>
		</div>

        <div class="toast__bottom-container">
            <!-- Cancel -->
            {#if toast.cancel}
                <button
                    data-button data-cancel
                    style={cancelButtonStyle}
                    class={cn(classes?.cancelButton, toast?.classes?.cancelButton)}
                    on:click={closeBtnClickedHandler}
                >
                    {toast.cancel.label}
                </button>
            {/if}

            <!-- Action -->
            {#if toast.action}
                <button class="toast__action-btn" on:click={actionBtnClickedHandler}>
				{toast.action.label}
                </button>
            {/if}
        </div>
	{/if}
</li>


<style lang="scss">
    @import '../scss/toasts.scss';
    @import "../scss/brands.scss";
</style>