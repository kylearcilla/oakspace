<script lang="ts">
	import { themeState } from "$lib/store"
	import { clickOutside } from "$lib/utils-general"
	import { onMount } from "svelte"

    type ModalOptions = {
        borderRadius?: string,   // default: 0px 
        overflowX?: string,      // default: hidden
        overflowY?: string,      // default: visible
        overflow?: string        // default: hidden
    }

    export let options: ModalOptions = {}
    export let onClickOutSide: any

    let styling = ""

    const handleClickOutside = () => onClickOutSide()!
    const makeModalStyling = () => {
        const arr: string[] = []
        arr.push(`border-radius: ${options?.borderRadius ?? "12px"}`)
        arr.push(`overflow-x: ${options?.overflowX ? options.overflowX : "hidden"}`)
        arr.push(`overflow: ${options?.overflow ? options.overflow : "hidden"}`)
        arr.push(`overflow-y: ${options?.overflowY ? options.overflowY : "scroll"}`)

        styling = arr.join('; ')
    }

    onMount(makeModalStyling)
</script>

<div class={`modal-bg ${$themeState?.isDarkTheme ? "" : "modal-bg--light"}`}>
    <div 
        use:clickOutside on:click_outside={() => handleClickOutside()} 
        class={`modal-bg__content modal-bg__content--overflow-y-scroll`}
        style={styling}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss"></style>