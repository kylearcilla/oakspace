<script lang="ts">
	import { getElemById, initFloatElemPos, isTargetTextEditor } from "$lib/utils-general"
	import { onMount } from "svelte"
	import { globalContext, mediaEmbedStore, ytPlayerStore } from "$lib/store"

    export let type: "youtube" | "spotify"
    import { page } from '$app/stores'
	import { YoutubePlayer } from "$lib/youtube-player";
    export let isFloating = true

    const MAX_PLAYER_WIDTH = 600
    const MIN_PLAYER_WIDTH = 100
    const MAX_PLAYER_HEIGHT = (9 / 16) * 600
    const MIN_PLAYER_HEIGHT = (9 / 16) * 100
    const INIT_PLAYER_WIDTH = 400
    const SMALL_PLAYER_WIDTH = 330

    const BORDER_WIDTH = 8
    const SAFE_MARGIN = 8

    let mediaPlayerRef: HTMLElement
    let displayObserver: ResizeObserver | null = null
    let displayContainerRef: HTMLElement
    let isHidden = false
    let windowWidth = 0
    let windowHeight = 0
    let isPointerDown = false
    let shouldMove    = false
    let isResizing    = false
    let pointerDownBoxOffset = { left: -1, top: -1 }
    let onDownPos            = { left: -1, top: -1 }

    let cursor = { 
        pos: "middle", type: "default" 
    }
    let ogBoxProps = { 
        width: 0, height: 0, top: 0, left: 0 
    }
    let boxProps = { 
        width: INIT_PLAYER_WIDTH, 
        height: (9/ 16) * INIT_PLAYER_WIDTH,
        top: SAFE_MARGIN, 
        left: SAFE_MARGIN 
    }

    $: ambience = $globalContext.ambience
    $: liveAmbience = ambience?.space.type === "video"
    $: ytPlayer = $ytPlayerStore
    $: playlist = ytPlayer?.playlist

    $: mediaEmbed = $mediaEmbedStore
    $: marginRight  = windowWidth - SAFE_MARGIN
    $: marginBottom = windowHeight - SAFE_MARGIN

    $: observePlayerDisplayHandler(isFloating)
    $: onPathChange($page.url.pathname, !!ambience)

    /* youtube display handler */
    function observePlayerDisplayHandler(isFloating: boolean) {
        if (isFloating && displayObserver) {
            displayObserver.disconnect()
            displayObserver = null
        }
        if (isFloating) {
            initLayout()
            return
        }

        if (!displayContainerRef) {
            displayContainerRef = getElemById('yt-iframe-container')!
        }
        if (!displayObserver && displayContainerRef) {

            displayObserver  = new ResizeObserver(onDisplayResize)
            displayObserver.observe(displayContainerRef)
        }
    }
    function onDisplayResize(data: any) {
        const target = data[0].target as HTMLElement
        const { top, left, height, width } = target.getBoundingClientRect()

        boxProps.top = top
        boxProps.left = left
        boxProps.height = height
        boxProps.width = width
    }
    function initLayout() {
        if (!ytPlayer) return
        const savedLayout = ytPlayer.floatLayout

        if (savedLayout && savedLayout.width > 0) {
            boxProps = { ...savedLayout }
        }
        else {
            boxProps.top = SAFE_MARGIN
            boxProps.left = SAFE_MARGIN
            boxProps.width = INIT_PLAYER_WIDTH
            boxProps.height = (9 / 16) * INIT_PLAYER_WIDTH

            ytPlayer.updateFloatPosition(boxProps)
        }
    }
    /* box prop handlers */
    function setCursor(clientX: number, clientY: number) {
        if (isResizing || !isFloating) return

        const boxWidth  = mediaPlayerRef.getBoundingClientRect().width
        const boxHeight = mediaPlayerRef.getBoundingClientRect().height

        const boxTop    = mediaPlayerRef.getBoundingClientRect().top
        const boxBottom = boxTop + boxHeight
        const boxLeft   = mediaPlayerRef.getBoundingClientRect().left 
        const boxRight  = boxLeft + boxWidth

        const isNearTop    = clientY - boxTop >= 0 && clientY - boxTop <= BORDER_WIDTH
        const isNearBottom = boxBottom - clientY >= 0 && boxBottom - clientY <= BORDER_WIDTH
        const isNearLeft   = clientX - boxLeft >= 0 && clientX - boxLeft <= BORDER_WIDTH
        const isNearRight  = boxRight - clientX >= 0 && boxRight - clientX <= BORDER_WIDTH

        if (isNearTop && isNearLeft) {
            cursor = { pos: "tl", type: "nwse-resize" }
        }
        else if (isNearTop && isNearRight) {
            cursor = { pos: "tr", type: "nesw-resize" }
        }
        else if (isNearTop) {
            cursor = { pos: "t", type: "ns-resize" }
        }
        else if (isNearBottom && isNearLeft) {
            cursor = { pos: "bl", type: "nesw-resize" }
        }
        else if (isNearBottom && isNearRight) {
            cursor = { pos: "br", type: "nwse-resize" }
        }
        else if (isNearBottom) {
            cursor = { pos: "b", type: "ns-resize" }
        }
        else if (isNearRight) {
            cursor = { pos: "r", type: "ew-resize" }
        }
        else if (isNearLeft) {
            cursor = { pos: "l", type: "ew-resize" }
        }
        else {
            cursor = { pos: "m", type: "default" }
        }
    }
    function updatePlayerDims(dim: "width" | "height", newVal: number) {
        let newWidth = 0, newHeight = 0

        if (dim === "width") {
            newWidth  = Math.min(Math.max(newVal, MIN_PLAYER_WIDTH), MAX_PLAYER_WIDTH)
            newHeight = (9 / 16) * newWidth
        }
        else {
            newHeight = Math.min(Math.max(newVal, MIN_PLAYER_HEIGHT), MAX_PLAYER_HEIGHT)
            newWidth  = (16 / 9) * newHeight
        }
        return { width: newWidth, height: newHeight }
    }
    function updatePlayerOffset(options: {
        offset: "top" | "left",
        newVal: number,
        newDims: null | BoxSize
    }) {
        const { offset, newVal, newDims } = options

        if (!newDims) return undefined
        const { width: newWidth, height: newHeight } = newDims

        if (newWidth === MAX_PLAYER_WIDTH || newHeight === MAX_PLAYER_HEIGHT) {
            return undefined
        }
        if (newWidth === MIN_PLAYER_WIDTH || newHeight === MIN_PLAYER_HEIGHT) {
            return undefined
        }
        
        let newLeft = newVal, newTop = newVal

        if (offset === "left") {
            let rightEdge = newLeft + newWidth
            newLeft  -= rightEdge > marginRight ? rightEdge - (marginRight) : 0
            newLeft   =  Math.max(newLeft, SAFE_MARGIN)
            rightEdge = newLeft + newWidth

            if (rightEdge > marginRight) return undefined
            return newLeft
        }
        else {
            let bottomEdge = newTop + newHeight
            newTop    -= bottomEdge > marginBottom ? bottomEdge - marginBottom : 0
            newTop     = Math.max(newTop, SAFE_MARGIN)
            bottomEdge = newTop + newHeight

            if (bottomEdge > marginBottom) return undefined
            return newTop
        }
    }
    function resizeHandler(clientX: number, clientY: number) {
        if (!ytPlayer) return

        const { pos } = cursor
        const currPos  = { left: clientX, top: clientY }

        if (!isPointerDown || shouldMove || pos === "m") return
        isResizing = true
        
        const leftOffset = currPos.left - onDownPos.left
        const topOffset  = currPos.top - onDownPos.top

        let newDims: BoxSize | null = { width: boxProps.width, height: boxProps.height }
        let newLeft: number | undefined = boxProps.left
        let newTop: number | undefined  = boxProps.top

        if (["br", "r"].includes(pos)) {
            newDims = updatePlayerDims("width", ogBoxProps.width + leftOffset)
        }
        else if (["b"].includes(pos)) {
            newDims = updatePlayerDims("height", ogBoxProps.height + topOffset)
            newLeft = updatePlayerOffset({ 
                offset: "left", 
                newVal: ogBoxProps.left - topOffset, 
                newDims
            })
        }
        else if (["bl", "l"].includes(pos)) {
            newDims = updatePlayerDims("width", ogBoxProps.width - leftOffset)
            newLeft = updatePlayerOffset({ 
                offset: "left", 
                newVal: ogBoxProps.left + leftOffset, 
                newDims
            })
        }
        else if (pos === "tr") {
            newDims = updatePlayerDims("height", ogBoxProps.height - topOffset)
            newTop  = updatePlayerOffset({ 
                offset: "top",  
                newVal: ogBoxProps.top + topOffset, 
                newDims
            })
        }
        else if (pos === "tl") {
            newDims = updatePlayerDims("height", ogBoxProps.height - topOffset) 
            newTop = updatePlayerOffset({ 
                offset: "top", 
                newVal: ogBoxProps.top + topOffset, 
                newDims
            })
            newLeft = updatePlayerOffset({ 
                offset: "left", 
                newVal: ogBoxProps.left + (ogBoxProps.width - (newDims?.width ?? 0)),
                newDims
            })
        }
        else if (pos === "t") {
            newDims = updatePlayerDims("height", ogBoxProps.height - topOffset)
            newTop  = updatePlayerOffset({ 
                offset: "top",  
                newVal: ogBoxProps.top + topOffset, 
                newDims
            })
            newLeft = updatePlayerOffset({ 
                offset: "left",
                newVal: ogBoxProps.left + topOffset,
                newDims
            })
        }

        if (!newDims || !newTop || !newLeft || isPlayerOFB({ ...newDims!, top: newTop, left: newLeft })) return

        boxProps = { ...newDims, left: newLeft, top: newTop }
        $ytPlayerStore!.updateFloatPosition(boxProps)
    }
    function isPlayerOFB(boxProps: { width: number, height: number, top: number, left: number }) {
        const { left, height, top, width } = boxProps
        const rightEdge = left + width
        const bottomEdge = top + height

        return rightEdge > marginRight || bottomEdge > marginBottom
    }
    function moveHandler(clientX: number, clientY: number, onResize = false) { 
        if (!ytPlayer) return
        if (!onResize && (!isPointerDown || !shouldMove)) return

        const newPos = initFloatElemPos({
            dims:          { width: boxProps.width, height: boxProps.height },
            cursorPos:     { left: clientX, top: clientY },
            containerDims: { width: windowWidth, height: windowHeight },
            margins:       { ew: SAFE_MARGIN, ns: SAFE_MARGIN },
            clientOffset:  onResize ? undefined : { 
                left: pointerDownBoxOffset.left,
                top: pointerDownBoxOffset.top
            }
        })

        boxProps = { ...boxProps, ...newPos }
        $ytPlayerStore!.updateFloatPosition(boxProps)
    }
    /* pointer handlers */
    function onPointerMove(pe: PointerEvent) {
        if (!isFloating) return
        let { target, clientX, clientY } = pe
        target = target as HTMLElement

        boxProps.left = mediaPlayerRef.offsetLeft
        boxProps.top = mediaPlayerRef.offsetTop

        resizeHandler(clientX, clientY)
        setCursor(clientX, clientY)
        moveHandler(clientX, clientY)
    }
    function onPointerDown(pe: PointerEvent) {
        if (!isFloating) return

        let   { clientX, clientY } = pe
        const { left: boxLeft, top: boxTop } = mediaPlayerRef.getBoundingClientRect()

        mediaPlayerRef.setPointerCapture(pe.pointerId)

        pointerDownBoxOffset = {
            left: clientX - boxLeft,
            top: clientY - boxTop
        }
        onDownPos = { left: clientX, top: clientY }

        isPointerDown = true
        ogBoxProps  = structuredClone(boxProps)
    }
    function onPointerLeave() {
        shouldMove = false
        isPointerDown = false
    }
    function onPointerUp(pe: PointerEvent) {
        isPointerDown = false
        ogBoxProps  = { width: 0, height: boxProps.height, left: 0, top: 0 }
        isResizing = false
        setCursor(pe.clientX, pe.clientY)
    }
    /* general */
    function onPathChange(path: string, ambience: boolean) {
        if (ambience) {
            isHidden = false
        }
        else if (ambience && path === "/home/session") {
            isHidden = true
        }
        else if (type === "youtube" && !isFloating && path != "/home") {
            isHidden = true
        }
        else if (type === "youtube") {
            isHidden = false
        }
    }
    function handleKeyDown(ke: KeyboardEvent) {
        if (shouldMove) return
        
        shouldMove = ke.code === "Space"
    }
    function handleKeyUp(ke: KeyboardEvent) {
        const { code, key, shiftKey, target } = ke
        if (isTargetTextEditor(target as HTMLElement)) return
        if (!ytPlayer) return

        shouldMove = code === "Space" ? false : shouldMove

        if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(code) && isFloating) {

            boxProps.top = getMaxPositions(code).top
            boxProps.left = getMaxPositions(code).left
            boxProps.width = SMALL_PLAYER_WIDTH
            boxProps.height = 9 / 16 * (SMALL_PLAYER_WIDTH)

            $ytPlayerStore!.updateFloatPosition(boxProps)
        } 
    }
    function getMaxPositions(digit: string) {
        const maxLeft = windowWidth - (SAFE_MARGIN + SMALL_PLAYER_WIDTH)
        const maxTop  = windowHeight - (SAFE_MARGIN + (9 / 16 * (SMALL_PLAYER_WIDTH)))

        if (digit === "Digit1") {
            return { 
                top: SAFE_MARGIN,
                left: SAFE_MARGIN
            }
        }
        else if (digit === "Digit2") {
            return { 
                top: SAFE_MARGIN,
                left: maxLeft
            }
        }
        else if (digit === "Digit3") {
            return { 
                top: maxTop,
                left: SAFE_MARGIN
            }
        }
        else {
            return { 
                top: maxTop,
                left: maxLeft
            }
        }
    }

    function onWindowResize() {
        windowWidth  = window.innerWidth
        windowHeight = window.innerHeight

        if (isFloating || !displayContainerRef) {
            moveHandler(boxProps.left, boxProps.top, true)
        }
        else {
            // this is needed when display has reached max width
            const { top, left, height, width } = displayContainerRef.getBoundingClientRect()
    
            boxProps.top = top
            boxProps.left = left
            boxProps.height = height
            boxProps.width = width
        }
    }

    onMount(() => {
        onWindowResize()
        observePlayerDisplayHandler(isFloating)
    })
</script>

<svelte:window 
    on:keydown={handleKeyDown} 
    on:keyup={handleKeyUp}
    on:resize={onWindowResize}
/>

<div
    class="media-player"
    class:media-player--resize={isResizing}
    class:media-player--live-ambience={liveAmbience}
    class:media-player--grab={shouldMove && !isPointerDown}
    class:media-player--grabbing={shouldMove && isPointerDown}
    class:media-player--hidden={!liveAmbience && (!playlist || mediaEmbed?.hidden || isHidden)}
    class:media-player--iframe-hidden={!$ytPlayerStore}
    style:--BORDER_WIDTH={`${BORDER_WIDTH}px`}
    style:--SAFE_MARGIN={`${SAFE_MARGIN}px`}
    style:--cursor-type={cursor.type}
    style:width={`${boxProps.width}px`}
    style:height={`${boxProps.height}px`}
    style:left={`${boxProps.left}px`}
    style:top={`${boxProps.top}px`}
    bind:this={mediaPlayerRef}
    on:pointermove={onPointerMove}
    on:pointerdown={onPointerDown}
    on:pointerup={onPointerUp}
    on:pointerleave={onPointerLeave}
>
    <div class="media-player__content">
        <div class="media-player__grab-handle media-player__grab-handle--top">
        </div>
        <div class="media-player__grab-handle media-player__grab-handle--left">
        </div>
        <div class="media-player__grab-handle media-player__grab-handle--right">
        </div>
        <div class="media-player__grab-handle media-player__grab-handle--bottom">
        </div>
        <div class="iframe-vid-player" id={YoutubePlayer.IFRAME_ID}>
        </div>
    </div>
</div>

<style lang="scss">
    .media-player {
        z-index: 500;
        position: absolute;
        user-select: none;
        @include center;
        cursor: var(--cursor-type);
        
        &--live-ambience {
            z-index: 2;
            opacity: 1 !important;
            visibility: visible !important;
            aspect-ratio: calc(16 / 9);

            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;

            pointer-events: none;


            @media (max-aspect-ratio: 16 / 9) {
                width: 177.78vh !important;
                height: 120% !important;
            }
            @media (min-aspect-ratio: 16 / 9) {
                height: 86.25vw !important;
                width: 100% !important;
            }
        }
        &--live-ambience &__content::after {
            content: " ";
            width: 100%;
            height: 100%;
            z-index: 2;
            @include abs-top-left;
            background-image: linear-gradient(rgba(0, 0, 0, var(--ambient-opacity)), rgba(0, 0, 0, var(--ambient-opacity)));
        }
        &--hidden {
            opacity: 0;
            visibility: hidden;
            z-index: -100;
        }
        &--grab {
            cursor: grab !important;
        }
        &--grab &__content {
            pointer-events: none;
        }
        &--resizing &__content {
            pointer-events: none;
        }
        &--grabbing {
            cursor: grabbing !important;
        }
        &--iframe-hidden .iframe-vid-player {
            @include not-visible;
        }
        &__content {
            width: 100%;
            height: 100%;
            position: relative;        
        }
        &__grab-handle {            
            z-index: 3;
            &--top {
                @include abs-top-left;
                height: var(--BORDER_WIDTH);
                width: 100%;
            }
            &--left {
                @include abs-top-left;
                width: var(--BORDER_WIDTH);
                height: 100%;
            }
            &--right {
                @include abs-top-right;
                width: var(--BORDER_WIDTH);
                height: 100%;
            }
            &--bottom {
                @include abs-bottom-left;
                height: var(--BORDER_WIDTH);
                width: 100%;
            }
        }
        
        #yt-player {
            border-radius: 0px;
            z-index: 2;
            @include abs-top-left;
        }
    }
</style>