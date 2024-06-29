<script lang="ts">
	import { themeState } from "$lib/store"
	import { onMount } from "svelte"

    type ModalOptions = {
        borderRadius?: string   // default: 0px 
        overflowX?: string      // default: hidden
        overflowY?: string      // default: visible
        overflow?: string        // default: hidden
        zIndex?: string          // default: 300000
        closeOnEsc?: boolean
    }

    export let options: ModalOptions = {}
    export let onClickOutSide: FunctionParam | undefined = undefined

    let styling = ""

    const handleClickOutside = (e: Event) => {
        const target = e.target as HTMLElement
        const className = target.classList.value
        const regex = /\bmodal-bg\b/

        if (!regex.test(className) ||!onClickOutSide) return
        
        onClickOutSide(e)!
    }
    const makeModalStyling = () => {
        const arr: string[] = []
        arr.push(`border-radius: ${options?.borderRadius ?? "12px"}`)
        arr.push(`z-index: ${options?.zIndex ? options.zIndex : "200001"}`)
        
        if (options.overflow) {
            arr.push(`overflow: ${options?.overflow ? options.overflow : "hidden"}`)
        }
        else {
            arr.push(`overflow-x: ${options?.overflowX ? options.overflowX : "hidden"}`)
            arr.push(`overflow-y: ${options?.overflowY ? options.overflowY : "scroll"}`)
        }


        styling = arr.join('; ')
    }
    function onKeyPress(e: KeyboardEvent) {
        const { key } = e
        if (key == "Escape" && options.closeOnEsc && onClickOutSide) {
            onClickOutSide(e as Event)
        }
    }

    onMount(makeModalStyling)
</script>

<svelte:window on:keydown={onKeyPress} />

<div 
    class={`modal-bg ${$themeState?.isDarkTheme ? "" : "modal-bg--light"}`} 
    on:pointerdown={handleClickOutside}
>
    <div 
        class={`modal-bg__content modal-bg__content--overflow-y-scroll`}
        style={styling}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss">
</style>