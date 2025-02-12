<script lang="ts">
	import { onMount } from "svelte"

    export let value: number
    export let onUpdate: (value: number) => void
    export let options: RangeInputOptions | undefined = undefined

    const {
        updateOnSeek = true,
        disabled = false,
        bg = "rgba(255, 255, 255, 0.1)",
        fg = "rgba(255, 255, 255, 0.9)",
        height = 2.5,
        thumbSize = 9.5
    } = options ?? {}

    let rangeInput: HTMLInputElement
    let _val = value

    function onInput() {
        if (updateOnSeek) {
            update()
        }

        rangeInput!.style.background = `linear-gradient(to right, ${fg} 0%, ${fg} ${value * 100}%, ${bg} ${value * 100}%, ${bg} 100%)`
        rangeInput!.value = `${value}`
    }
    function update() {
        onUpdate(value)
    }

    onMount(() => onInput())
</script>

<input
    class="input-range input-range--show-thumb"
    style:--height={`${height}px`}
    style:--thumb-size={`${thumbSize}px`}
    min="0" 
    max="1"
    step="0.01"
    type="range"
    {disabled}
    bind:this={rangeInput}
    bind:value={value}
    on:input={() => onInput()}
    on:change={() => update()}
/>

<style lang="scss">
    input {
        @include center;
        width: 100%;
        height: var(--height) !important;

        &::-webkit-slider-thumb {
            @include visible;
            height: var(--thumb-size) !important;
            width: var(--thumb-size) !important;
        }
        &::-moz-range-thumb  {
            @include visible;
            height: var(--thumb-size) !important;
            width: var(--thumb-size) !important;
        }
    }
</style>