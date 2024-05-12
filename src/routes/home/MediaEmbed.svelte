<script lang="ts">
	import { MediaEmbedType } from "$lib/enums";
	import { mediaEmbedStore } from "$lib/store";
	import { SPOTIFY_IFRAME_ID } from "$lib/utils-music";
	import { toggleYTIFramePointerEvents } from "$lib/utils-youtube";
	import { onMount } from "svelte";

    type CursorPos = {
        x: number, y: number
    }

    let initClickPos: CursorPos | null = null
    let resizeSection: string | null = null
    let setWidth = 0
    let setHeight = 0
    let doHideResizeLayer = false

    $: store = $mediaEmbedStore!

    const HOVER_EDGE_WIDTH = 10

    function updateStylingOptions() {

    }
    
    function resizeHandler(resizeSectionPos: CursorPos) {
        if (!resizeSection) return
        const heightChange = initClickPos!.y - resizeSectionPos.y 
        const widthChange = initClickPos!.x - resizeSectionPos.x

        let newWidth = setWidth
        let newHeight = setHeight

        if (resizeSection!.includes('top')) {
            newHeight += heightChange
        } 
        if (resizeSection!.includes('bottom')) {
            newHeight += (-1 * heightChange)
        } 
        if (resizeSection!.includes('left')) {
            newWidth += widthChange * 2
        } 
        if (resizeSection!.includes('right')) {
            newWidth += (-2 * widthChange)
        }

        let negativeHtChange = newHeight < setHeight
        let vertChangeOnly = ["top", "bottom"].includes(resizeSection!)
        newWidth = Math.min(Math.max(200, newWidth), 700)

        if (vertChangeOnly && newHeight < 152) {
            newHeight = negativeHtChange ? 80 : 152
        }
        else if (vertChangeOnly && newHeight < 352) {
            newHeight = negativeHtChange ? 152 : 352
        }
        mediaEmbedStore.update((val: FloatingMediaEmbed | null) => {
            return { ...val!, width: `${newWidth}`, height: `${newHeight}` }
        })
    }

    function onMouseClicked(event: MouseEvent) {
        const target = event.target as HTMLElement
        if (!target.classList.value.includes("media-embed")) return

        initClickPos = { x: event.clientX, y: event.clientY }
        toggleYTIFramePointerEvents(false)

        window.addEventListener("mouseup", onMouseRelease)
        window.addEventListener("mousemove", onResizeMouseMove)
    }
    function onMouseRelease() {
        console.log("X")
        initClickPos = null
        window.removeEventListener("mouseup", onMouseRelease)
        window.removeEventListener("mousemove", onResizeMouseMove)
        toggleYTIFramePointerEvents(true)

        setWidth = +$mediaEmbedStore!.width
        setHeight = +$mediaEmbedStore!.height
    }
    function onResizeMouseMove(event: MouseEvent) {
        event.preventDefault()
        resizeHandler({ x: event.clientX , y: event.clientY })
    }
    function onMouseLeave() {
        if (!doHideResizeLayer) return
        doHideResizeLayer = false
    }

    function onMouseMove(event: MouseEvent) {
        if (initClickPos) return
        const target = event.target as HTMLElement
        const rect = target.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const isTop = mouseY < HOVER_EDGE_WIDTH
        const isBottom = mouseY > rect.height - HOVER_EDGE_WIDTH
        const isLeft = mouseX < HOVER_EDGE_WIDTH
        const isRight = mouseX > rect.width - HOVER_EDGE_WIDTH

        if (isTop || isBottom || isLeft || isRight) {
            doHideResizeLayer = false
        }

        if (isTop && isLeft) {
            resizeSection = 'top-left'
            target.style.cursor = "nwse-resize"
        } else if (isTop && isRight) {
            resizeSection = 'top-right'
            target.style.cursor = "nesw-resize"
        } else if (isBottom && isLeft) {
            resizeSection = 'bottom-left'
            target.style.cursor = "nesw-resize"
        } else if (isBottom && isRight) {
            resizeSection = 'bottom-right'
            target.style.cursor = "nwse-resize"
        } else if (isTop) {
            resizeSection = 'top'
            target.style.cursor = "ns-resize"
        } else if (isBottom) {
            resizeSection = 'bottom'
            target.style.cursor = "ns-resize"
        } else if (isLeft) {
            resizeSection = 'left'
            target.style.cursor = "ew-resize"
        } else if (isRight) {
            resizeSection = 'right'
            target.style.cursor = "ew-resize"
        } else {
            resizeSection = null
            target.style.cursor = "auto"
            doHideResizeLayer = true
        }
    }

    onMount(() => {
        window.addEventListener("mousedown", onMouseClicked)
        setWidth = +$mediaEmbedStore!.width
        setHeight = +$mediaEmbedStore!.height
    })
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="media-embed" on:mousemove={onMouseMove} on:mouseleave={onMouseLeave} style={`
        top: ${store.topPos}; 
        left: ${store.leftPos}; 
        ${store.leftTransform ? `transform: translate(${store.leftTransform}, ${store.topTransform});` : ""}
    `}
>
    <div 
        class="media-embed__wrapper"
        style={`width: ${store.width}px; height: ${store.height}px`}
    >
        <div 
            class="media-embed__content"
        >
            {#if store.mediaEmbedType === MediaEmbedType.Spotify}
                <div id={SPOTIFY_IFRAME_ID}></div>
            {:else}
                <div id="yt-floating-iframe"></div>
            {/if}
        </div>
        {#if !doHideResizeLayer}
            <div class="media-embed__resize-layer"></div>
        {/if}
    </div>
</div>

<style lang="scss">
    .media-embed {
        position: fixed;
        z-index: 1000000;
        @include center;
        padding: 5px;
        // background-color: red;

        &__wrapper {
            width: 100%;
            height: 100%;
            position: relative;
        }
        &__content {
            width: 100%;
            height: 100%;
            @include abs-top-left;
        }
        &__resize-layer {
            width: 100%;
            height: 100%;
            @include abs-top-left;
        }
    }
    #SPOTIFY_IFRAME_ID {
        pointer-events: auto;
    }
</style>