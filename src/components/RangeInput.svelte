<script lang="ts">
	import { onMount } from "svelte"

    export let value: number
    export let onUpdate: (value: number) => void
    export let options: {
        updateOnSeek?: boolean,
        disabled?: boolean,
        bg?: string,
        fg?: string,
        height?: number,
        thumbSize?: number
    } | undefined = undefined

    const updateOnSeek = options?.updateOnSeek ?? true
    const disabled = options?.disabled ?? false
    const fg = options?.bg ?? "rgba(255, 255, 255, 0.9)"
    const bg = options?.bg ?? "rgba(255, 255, 255, 0.1)"
    const height = options?.height ?? 2.5
    const thumbSize = options?.thumbSize ?? 9.5

    let rangeInput: HTMLInputElement
    let _val = value


    $: console.log("xx", value)

    function onInput(newVal: number) {
        _val = newVal

        if (updateOnSeek) {
            onChange()
        }

        rangeInput!.style.background = `linear-gradient(to right, ${fg} 0%, ${fg} ${_val * 100}%, ${bg} ${_val * 100}%, ${bg} 100%)`
        rangeInput!.value = `${_val}`
    }
    function onChange() {
        onUpdate(_val)
    }

    onMount(() => {
        onInput(value)
    })
</script>

<div class="range-input">
    <input
        bind:this={rangeInput}
        class="input-range input-range--show-thumb"
        style:--height={`${height}px`}
        style:--thumb-size={`${thumbSize}px`}
        on:input={() => onInput(+rangeInput.value)}
        on:change={() => onChange()}
        min="0" 
        max="1"
        step="0.01"
        {disabled}
        type="range"
    />
</div>

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