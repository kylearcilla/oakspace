<script lang="ts">
	import { Icon, LogoIcon } from '$lib/enums'
	import type { ToastClassnames, ToastProps, ToastTypes } from '$lib/types-toast'
	import { cn, toasterManager, useEffect } from '$lib/utils-toast'
	import { onDestroy, onMount } from 'svelte'
	import Logo from './Logo.svelte'
	import SvgIcon from './SVGIcon.svelte'
	import { globalContext, themeState } from '$lib/store';
	import { extractNum } from '$lib/utils-general'
	import { COLOR_SWATCHES, getColorTrio } from "$lib/utils-colors"
	import Loader from './Loader.svelte';

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
	const TOAST_LIFETIME = 100000
	const TOAST_NBR_DISAPPEAR_DELAY = 3000
	const TIME_BEFORE_UNMOUNT = 200
	const SWIPE_TRESHOLD = 130
	const MIN_SWIPE_THRESHOLD = 20
	const MIN_TIME_THRESHOLD = 20
	const MAX_TIME_THRESHOLD = 100
	const MIN_SWIPE_X_FROM_EDGE_DIFF = 5

	const TOAST_ICON_OPTIONS = {
		AppleMusic:   { iconWidth: "50%" },
		Spotify:      { iconWidth: "90%", hasBgColor: false },
		YoutubeMusic: { iconWidth: "60%" },
		Soundcloud:   { iconWidth: "60%" },
		Youtube:      { iconWidth: "60%" },
		Google:       { iconWidth: "60%" },
		Todoist:      { iconWidth: "100%", containerWidth: "14px" }
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
	$: coords = position.split('-')
	$: invert = toast.invert || invert
	$: $effect
	$: disabled = toastType === 'loading'
	$: offset = heightIdx * EXPANDED_GAP + toastsHeightBefore
	$: isPromiseLoadingOrInfiniteDuration = (toast.promise && toastType === 'loading') || toast.duration === Number.POSITIVE_INFINITY

	$: isLight = !$themeState.isDarkTheme

	// Height index is used to calculate the offset as it gets updated before the toast array, which means we can calculate the new layout faster.
	$: heightIdx		  = $heights.findIndex((height: any) => height.toastId === toast.id) || 0
	$: toastsHeightBefore = $heights.reduce((prev: any, curr: any, idx: any) => idx >= heightIdx ? prev : prev + curr.height, 0)
	$: isDarkTheme		  = $themeState.isDarkTheme

	$: if (toast.delete) {
		deleteToast()
	}
	$: if (typeof toast.icon === "number") {
		const iconStrIdx = LogoIcon[toast.icon!] as keyof typeof TOAST_ICON_OPTIONS
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

	$: isContextMsg = ["success", "warning", "info", "error"].some((type) => toastType === type)

	function deleteToast() {
		removed = true
		offsetBeforeRemove = offset   // Save the offset for the exit swipe animation

		// removeHeight(toast.id)
		// setTimeout(() => dismiss(toast.id), TIME_BEFORE_UNMOUNT)
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

		const target = event.target as HTMLElement
		offsetBeforeRemove = offset

		// Ensure we maintain correct pointer capture even when going outside of the toast (e.g. when swiping)
		target.setPointerCapture(event.pointerId)

		if (target.tagName === 'BUTTON') {
			return
		}

        pointerDownTimeStamp = Date.now()

		swiping = true
		pointerStartRef = { x: event.clientX, y: event.clientY }
	}

	function onPointerUp(e: PointerEvent) {
		if (swipeOut) return

		const target = e.target as HTMLElement
		pointerStartRef = null

		target.style.userSelect = "text"

		const swipeVal = toastRef?.style.getPropertyValue('--swipe-amount')
		const swipeAmount = swipeVal ? extractNum(swipeVal)[0] : 0
		const currentTime = Date.now()
		const timeDifference = currentTime - pointerDownTimeStamp 
		const isValidTime = MIN_TIME_THRESHOLD <= timeDifference && timeDifference <= MAX_TIME_THRESHOLD
		
		if (Math.abs(swipeAmount) >= SWIPE_TRESHOLD || (isValidTime && Math.abs(swipeAmount) >= MIN_SWIPE_THRESHOLD)) {
			swipeAwayToast()
		}
		else {
			toastRef.style.setProperty('--swipe-amount', '0px')
			swiping = false
		}
	}

	function swipeAwayToast() {
		offsetBeforeRemove = offset
		toast.onDismiss?.(toast)
		deleteToast()
		swipeOut = true
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointerStartRef) return

		const target = event.target as HTMLElement
		const className = target.classList.value
		const isText = className.includes("title") || className.includes("description")

		const yPosition = event.clientY - pointerStartRef!.y
		const xPosition = event.clientX - pointerStartRef!.x

		const clamp = coords[0] === 'top' ? Math.min : Math.max
		const clampedX = clamp(0, xPosition)
		const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2
		const isAllowedToSwipe = !isText && (Math.abs(clampedX) > swipeStartThreshold)

		const distFromEdge = window.innerWidth - event.clientX

		if (isAllowedToSwipe) {
			target.style.userSelect = "none"
			toastRef.style.setProperty('--swipe-amount', `${xPosition}px`)

			if (distFromEdge < MIN_SWIPE_X_FROM_EDGE_DIFF) swipeAwayToast()
		} 
		else if (Math.abs(yPosition) > swipeStartThreshold) {
			target.style.userSelect = "text"
			pointerStartRef = null
		}
	}
	function getToastIconColor() {
		if (isContextMsg) {
			return `rgba(${getContextColors()[0]})`
		}
		else {
			return undefined
		}

	}
	function getContextColors() {
		let color

		if (toastType === 'success') {
			color = COLOR_SWATCHES[3]
		}
		else if (toastType === 'warning') {
			color = COLOR_SWATCHES[2]
		}
		else if (toastType === 'info') {
			color = COLOR_SWATCHES[5]
		}
		else {
			color = COLOR_SWATCHES[11]
		}

		return getColorTrio(color, !isDarkTheme)
	}
	function initContextColorVars() {
		const colorTrio = getContextColors()

		return `;
			--context-rich-color-1: ${colorTrio[0]};
			--context-rich-color-2: ${colorTrio[1]};
			--context-rich-color-3: ${colorTrio[2]};
		`
	}

	onMount(() => {
		mounted = true

		// Add toast height total heights array after the toast is mounted
		const height = toastRef.getBoundingClientRect().height
		initialHeight = height

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
    class:toast--flat={!toast.description}
    class:toast--context={isContextMsg}
    class:toast--success={toastType === 'success'}
    class:toast--warning={toastType === 'warning'}
    class:toast--info={toastType === 'info'}
    class:toast--error={toastType === 'error'}
    class:toast--light={isLight}
	data-toast-context={toast.contextId}
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
	data-expanded={expanded}
	style={`${$$props.style} ${toast.style} ${isContextMsg ? initContextColorVars() : ""}`}
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
	{#if closeButton && !toast.component && toastType != "loading"}
		{@const toastIconColor = getToastIconColor()}
		<button
            class="toast__close-btn" 
			aria-label="Close toast"
			data-disabled={disabled}
            data-close-btn=""
			on:click={cancelBtnClickedHandler}
		>
            <div class="toast__close-btn-icon">
                <SvgIcon 
					icon={Icon.Close} 
					options={{ 
						height: 10, width: 10, scale: 0.88, strokeWidth: 2, color: toastIconColor
					}} 
				/>
            </div>
		</button>
	{/if}

	<!-- Main Content -->
	<div class="toast__content" data-content="">
		<div class="toast__header">
			{#if toast.icon || ["success", "info", "warning", "error", "loading"].includes(toastType) || toastType === "default"  && toast.icon}
				<div class="toast__header-icon">
					{#if toastType === "loading"}
						<Loader visible={true} />
					{:else if typeof toast.icon === "number"}
						<Logo 
							logo={toast.icon} 
							options={{ containerWidth: `100%`, ...iconOptions}} 
						/>
					{:else if toast.icon && toast.icon.startsWith("fa")}
						<i class={toast.icon}></i>
					{:else if toast.icon}
						{toast.icon}
					{:else if toastType === "success"}
						<i class="fa-solid fa-circle-check"></i>
					{:else if toastType === "info"}
						<i class="fa-solid fa-circle-exclamation"></i>
					{:else if toastType === "warning"}
						<i class="fa-solid fa-triangle-exclamation"></i>
					{:else if toastType === "error"}
						<i class="fa-solid fa-circle-exclamation"></i>
					{/if}
				</div>
			{/if}
			<div class="toast__header-title" title={toast.title}>
				{toast.title}
			</div>
		</div>
		{#if toast.description}
			<div class="toast__description">
				{#if typeof toast.description !== 'string'}
					<svelte:component this={toast.description} {...toast.componentProps} />
				{:else}
					{toast.description}
				{/if}
			</div>
		{/if}
	</div>
	<div class="toast__bottom-container">
		<!-- Cancel -->
		{#if toast.cancel}
			<button
				data-toast-context={toast.contextId}
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
			<button 
				data-toast-context={toast.contextId}
				class="toast__action-btn" 
				on:click={actionBtnClickedHandler}
			>
				{toast.action.label}
			</button>
		{/if}
	</div>
</li>


<style lang="scss">
    @import '../scss/toasts.scss';
    @import "../scss/brands.scss";
</style>