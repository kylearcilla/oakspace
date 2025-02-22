<script lang="ts">
	import { clickOutside } from "$lib/utils-general"

    export let id = ""
    export let isHidden: boolean
    export let isAnim = true
    export let position: CSSAbsPos | undefined = undefined
    export let staticPos = false
    export let zIndex: number = 1
    export let onClickOutside: ((e: CustomEvent) => any) | undefined = undefined
    export let onDismount: (() => void) | undefined = undefined
    
    const TRANSITION_DURATIONS_MS = 200

    let isMounted = false
    let doShow = false
    let removeTimeout: NodeJS.Timeout | null = null

    $: toggleElem(!isHidden)

    function toggleElem(isActive: boolean) {
        // mount if active, mount on DOM, then toggle aniamtion
        if (isActive) {
            isMounted = true
            requestAnimationFrame(() => doShow = true)
        }
        // if timeout has been set but user quickly toggles active agin, remove the timeout
        if (isActive && removeTimeout) {
            clearTimeout(removeTimeout)
            removeTimeout = null    
        }
        // if inactive, allow the animation, then dismount
        if (!isActive) {
            doShow = false
            
            removeTimeout = setTimeout(() => {
                isMounted = false
                removeTimeout = null

                if (onDismount != undefined) {
                    onDismount()
                }
            }, TRANSITION_DURATIONS_MS)
        }
    }
</script>

{#if isMounted}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        {id}
        class="bounce-fade"
        class:bounce-fade--shown={doShow}
        class:bounce-fade--animated={isAnim}
        style:position={staticPos ? "fixed" : "absolute"}
        style:z-index={zIndex}
        style:top={position?.top}
        style:left={position?.left}
        style:right={position?.right}
        style:bottom={position?.bottom}
        style:--duration={`${TRANSITION_DURATIONS_MS}ms`}
        on:contextmenu|preventDefault
        use:clickOutside on:outClick={onClickOutside}
    >
        <slot></slot>
    </div>
{/if}

<style lang="scss">
    .bounce-fade {
        transform: scale(0.9);
        z-index: 999;
        @include not-visible;

        &--animated {
            transition: var(--duration) opacity cubic-bezier(.2, .45, 0, 1),
                        var(--duration) visibility cubic-bezier(.2, .45, 0, 1),
                        var(--duration) transform cubic-bezier(.2, .45, 0, 1);
        }
        &--shown {
            transform: scale(1);
            @include visible;
        }
    }
</style>