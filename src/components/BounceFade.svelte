<script lang="ts">
    import { clickOutside, initFloatElemPos } from "$lib/utils-general"
    import { ambienceSideBarOffset, cursorPos, modalSideBarOffset } from "$lib/utils-home"

    export let id = ""
    export let isHidden: boolean
    export let isAnim = true
    export let position: CSSAbsPos | undefined = undefined
    export let fixPos = false
    export let zIndex: number = 1
    export let onClickOutside: ((e: CustomEvent) => any) | undefined = undefined
    export let onDismount: (() => void) | undefined = undefined
    export let offsetContext: "side-bar" | "modal" | "default" = "default"
    
    let TRANSITION_DURATIONS_MS = 200

    let isMounted = false
    let doShow = false
    let showFlag = true
    let self: HTMLDivElement | null = null
    let removeTimeout: NodeJS.Timeout | null = null
    let _fixPos: CSSAbsPos | undefined = undefined

    $: toggleElem(!isHidden)

    function toggleElem(isActive: boolean) {
        // mount if active, mount on DOM, then toggle animation
        if (isActive) {
            isMounted = true

            // get the height and width after mount then init position then show
            requestAnimationFrame(() => {
                doShow = true
                fixPos && (initGlobalPos())
            })
        }
        if (isActive && removeTimeout) {
            clearTimeout(removeTimeout)
            removeTimeout = null    
        }
        // if inactive, allow the animation, then dismount
        if (!isActive) {
            doShow = false

            if (fixPos) {
                // position will be reset to undefined when toggled off, changing the position
                // keep it to where it was placed
                position = _fixPos
                showFlag = false
            }
            
            removeTimeout = setTimeout(() => {
                isMounted = false
                removeTimeout = null
                if (onDismount != undefined) {
                    onDismount()
                }
            }, TRANSITION_DURATIONS_MS)
        }
    }

    function initGlobalPos() {
        const { height, width } = self!.getBoundingClientRect()
        let pos = initFloatElemPos({
            dims: { 
                height,
                width
            }, 
            containerDims: { 
                height: window.innerHeight - 50, 
                width: window.innerWidth - 50
            },
            cursorPos: {
                left: cursorPos.left - 50,
                top: cursorPos.top - 20
            }
        })
        if (offsetContext === "side-bar") {
            pos.left = ambienceSideBarOffset(pos.left)
        }
        else if (offsetContext === "modal") {
            pos = modalSideBarOffset(pos)
        }
        position = {
            top: `${pos.top}px`, 
            left: `${pos.left}px` 
        }
        _fixPos = position
        showFlag = true
    }
</script>

{#if isMounted}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        {id}
        bind:this={self}
        data-top={`${position?.left} xxx `}
        class="bounce-fade"
        class:bounce-fade--shown={doShow && showFlag}
        class:bounce-fade--animated={isAnim}
        style:position={fixPos ? "fixed" : "absolute"}
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