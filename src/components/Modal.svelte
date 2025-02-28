<script lang="ts">
	import { themeState } from "$lib/store"

    export let options: ModalOptions = {}
    export let onClickOutSide: FunctionParam | undefined = undefined

    const { 
        borderRadius = "12px",
        zIndex = "1000",
        overflowX = "hidden", 
        overflowY = "scroll",
        height = "auto",
        closeOnEsc = true,
        hingeDown = false,
        scaleUp = false
    } = options

    let downElem: HTMLElement | null = null

    const pointerUp = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        const relatedTarget = downElem
        downElem = null

        if (target !== relatedTarget) return
        
        const className = target.classList.value
        const regex = /\bmodal-bg\b/

        if (!regex.test(className) || !onClickOutSide) return
        
        onClickOutSide(e)
    }
    function pointerDown(e: PointerEvent) {
        downElem = e.target as HTMLElement
    }
    function onKeyPress(e: KeyboardEvent) {
        const { key } = e
        if (key == "Escape" && closeOnEsc && onClickOutSide) {
            onClickOutSide(e as Event)
        }
    }
</script>

<svelte:window on:keydown={onKeyPress} />

<div 
    class="modal-bg"
    class:modal-bg--light={!$themeState?.isDarkTheme}
    class:modal-bg--hinge-down={hingeDown}
    class:modal-bg--scale-up={scaleUp}
    on:pointerdown={pointerDown}
    on:pointerup={pointerUp}
    style:perspective="700px"
>
    <div 
        class="modal-bg__content"
        style:border-radius={borderRadius}
        style:zIndex={zIndex}
        style:overflow-x={overflowX}
        style:overflow-y={overflowY}
        style:height={height}
        style:min-height={height}
        style:max-height={height}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss">
    .modal-bg {
        z-index: 10000;
        &--hinge-down &__content {
            animation: hinge-down 0.22s cubic-bezier(.4, 0, .2, 1) forwards;
        }
        &--scale-up &__content {
            animation: scale-up 0.22s cubic-bezier(.4, 0, .2, 1) forwards;
        }
    }
    @keyframes scale-up {
        0% {
            opacity: 0;
            transform: scale(0.95);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    @keyframes hinge-down {
        0% {
            opacity: 0;
            -webkit-transform: rotateX(-20deg);
            transform: rotateX(-20deg);
        }
        100% {
            -webkit-transform: rotateX(0);
            transform: rotateX(0);
            opacity: 1;
        }
    }
</style>