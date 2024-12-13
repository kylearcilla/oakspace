<script lang="ts">
	import { themeState } from "$lib/store"
	import { clickOutside } from "$lib/utils-general"
	import { COLOR_SWATCHES } from "$lib/utils-colors"
	import { onMount } from "svelte"
	import BounceFade from "./BounceFade.svelte"

    export let isActive: boolean
    export let chosenColor: Color | undefined = undefined
    export let onClickOutside: FunctionParam
    export let onChoose: FunctionParam
    export let onDismount: FunctionParam | undefined = undefined
    export let zIndex = 1
    export let position: CSSAbsPos | undefined = undefined

    let _isActive = true

    $: isDark = $themeState.isDarkTheme

    function onSwatchClicked(color: Color) {
        onChoose(color)
    }

    onMount(() => { })
</script>

<BounceFade 
    {zIndex}
    isHidden={!isActive}
    onDismount={onDismount}
    position={position}
>
    <div 
        use:clickOutside on:click_outside={() => onClickOutside()}
        id="color-picker--dmenu"
        class="color-picker" 
        class:color-picker--light={!isDark}
        class:color-picker--shown={_isActive}
    >
        <ul class="color-picker__grid">
            {#each COLOR_SWATCHES.d as color, idx}
                {@const borderColor = isDark ? color.primary : color.light3}
                <div 
                    on:pointerup={() => onSwatchClicked(color)}
                    style:--color={color.primary}
                    style:--border-color={borderColor}
                    role="button"
                    tabindex="0"
                    data-idx={idx}
                    class="color-picker__swatch"
                    class:color-picker__swatch--picked={color.id === chosenColor?.id}
                    class:color-picker__swatch--light-color={color.isLight}
                >
                </div>
            {/each}
        </ul>
        <ul class="color-picker__grid color-picker__grid--pastel">
            {#each COLOR_SWATCHES.p as color}
                {@const borderColor = isDark ? color.primary : color.light3}
                <div 
                    on:pointerup={() => onSwatchClicked(color)}
                    style:--color={color.primary}
                    style:--border-color={borderColor}
                    role="button"
                    tabindex="0"
                    class="color-picker__swatch"
                    class:color-picker__swatch--picked={color.id === chosenColor?.id}
                    class:color-picker__swatch--light-color={color.isLight}
                >
                </div>
            {/each}
        </ul>
    </div>
</BounceFade>


<style lang="scss">
    .color-picker {
        padding: 11px 12px 11px 12px;
        border-radius: 18px;
        background-color: var(--bg-2);
        border: 1px solid rgba(var(--textColor1), 0.03);
        
        &--light {
            background-color: var(--bg-2);
            box-shadow: 0px 1px 16.4px 4px rgba(0, 0, 0, 0.05);
            border-color: rgba(0, 0, 0, 0.08);
        }
        &--light &__swatch--picked {
            border-color: #88A6F3 !important;
            border-width: 2px !important;
        }
        &--light &__swatch {
            border: 1.5px solid rgb(var(--border-color), 0.11);
        }

        h2 {
            @include text-style(1, 500, 1.32rem);
            margin-bottom: 11px;
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-gap: 3px;
            row-gap: 3px;

            &--pastel {
                margin-top: 10px;
            }
        }
        &__swatch {
            width: 19px;
            height: 19px;
            border: 2px solid transparent;
            border-radius: 8px;
            background-color: rgb(var(--color));
            transition: 0.12s ease-in-out;
            cursor: pointer;

            &--picked {
                border-color: white;
            }
            &:active {
                transform: scale(0.97);
            }
        }
    }
</style>