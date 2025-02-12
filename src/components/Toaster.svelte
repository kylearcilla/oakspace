<script lang="ts">
	import { onMount } from 'svelte'

    import  Toast from "./Toast.svelte"
	import type { Position } from '$lib/types-toast'
	import { toasterManager } from '$lib/utils-toast'

	const VISIBLE_TOASTS_AMOUNT = 3
	const VIEWPORT_OFFSET = 32
	const TOAST_WIDTH = 356
	const STACKED_TOAST_GAP = 14
	
	const EXPAND = false
	const DURATION = 4000
	const POSITION = 'bottom-right'
	const DIR = 'ltr'
	const CLOSE_BUTTON = true

	const { toasts, heights, reset } = toasterManager

	let expanded = false
	let interacting = false
	let possiblePositions: Position[] = []

	$: if ($toasts.length <= 1) {
		expanded = false
	}
	$: {
		const existingPositions = $toasts.filter((t) => t.position).map((t) => t.position)
		const uniquePositions   = Array.from(new Set([...existingPositions, POSITION])).filter(Boolean) as Position[]

		possiblePositions = uniquePositions
	}

	onMount(() => reset())
</script>

{#if $toasts.length > 0}
	<section>
		{#each possiblePositions as position, index}
			<ol
				data-sonner-toaster
				data-y-position={position.split('-')[0]}
				data-x-position={position.split('-')[1]}
				dir={DIR}
				style:--front-toast-height={`${$heights[0]?.height}px`}
				style:--offset={`${VIEWPORT_OFFSET}px`}
				style:--width={`${TOAST_WIDTH}px`}
				style:--gap={`${STACKED_TOAST_GAP}px`}
				on:mouseenter={() => expanded = true}
				on:pointerdown={() => interacting = true}
				on:pointerup={() => interacting = false}
				on:mousemove={() => expanded = true}
				on:mouseleave={() => {
					if (!interacting) {
						expanded = false
					}
				}}
			>
				{#each $toasts.filter((toast) => (!toast.position && index === 0) || toast.position === position) as toast, index (toast.id)}
					<Toast
						{index}
						{toast}
						{interacting}
						{position}
						{expanded}
						visibleToasts={VISIBLE_TOASTS_AMOUNT}
						duration={DURATION}
						expandByDefault={EXPAND}
                        closeButton={CLOSE_BUTTON}
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