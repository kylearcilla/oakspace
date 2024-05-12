<script lang="ts">
	import { clickOutside, inlineStyling } from "$lib/utils-general";

    export let id = ""
    export let isHidden: boolean
    export let isAnim = true
    export let position: CSSAbsPos | undefined = undefined
    export let zIndex: number = 1
    export let onClickOutside: FunctionParam | undefined = undefined
    export let styling: StylingOptions | undefined = undefined
    export let onDismount: (() => void) | undefined = undefined

    let isMounted = false
    let doShow = false
    let removeTimeout: NodeJS.Timeout | null = null

    $: toggleElem(!isHidden)

    const TRANSITION_DURATIONS_MS = 200

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
                
                if (onDismount) onDismount()
            }, TRANSITION_DURATIONS_MS)


            removeTimeout = null
        }
    }
</script>

{#if isMounted}
    <div 
        {id}
        class="bounce-fade"
        class:bounce-fade--shown={doShow}
        class:bounce-fade--animated={isAnim}
        style={inlineStyling(styling)}
        style:z-index={zIndex}
        style:position={position != undefined ? "absolute" : "relative"}
        style:top={position?.top}
        style:left={position?.left}
        style:right={position?.right}
        style:bottom={position?.bottom}
        use:clickOutside on:click_outside={onClickOutside}
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
            transition: 0.2s opacity cubic-bezier(.2, .45, 0, 1),
                        0.2s visibility cubic-bezier(.2, .45, 0, 1),
                        0.2s transform cubic-bezier(.2, .45, 0, 1);
        }
        &--shown {
            transform: scale(1);
            @include visible;
        }
    }
</style>