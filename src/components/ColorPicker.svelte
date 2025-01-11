<script lang="ts">
    import { themeState } from "$lib/store"
    import { colorPicker } from "../lib/pop-ups"
	import { clickOutside, capitalize } from "$lib/utils-general"
	import { COLOR_SWATCHES } from "$lib/utils-colors"
    
	import BounceFade from "./BounceFade.svelte"
    
    const { state, onSubmit } = colorPicker

    $: isDark = $themeState.isDarkTheme
    $: isOpen =  $state.isOpen
    $: position =  $state.position
    $: picked = $state.picked

    function onSwatchClicked(color: Color) {
        onSubmit(color)
    }
</script>

<BounceFade 
    isHidden={!isOpen}
    zIndex={2000}
    position={{
        top: `${position.y}px`,
        left: `${position.x}px`
    }}
>
    <div 
        use:clickOutside on:click_outside={() => onSubmit(null)}
        id="color-picker--dmenu"
        class="color-picker" 
        class:color-picker--light={!isDark}
    >
        <h2>Colors</h2>
        <ul class="color-picker__grid">
            {#each COLOR_SWATCHES as color, idx}
                {@const { primary, name } = color }
                <button 
                    on:click={() => onSwatchClicked(color)}
                    style:--color={primary}
                    class="color-picker__color"
                    class:color-picker__color--picked={idx === 0}
                >
                    <div class="color-picker__color-swatch"></div>
                    <div class="color-picker__color-name">
                        {capitalize(name)}
                    </div>
                </button>
            {/each}
        </ul>
    </div>
</BounceFade>


<style lang="scss">
    .color-picker {
        padding: 14px 4px 17px 17px;
        border-radius: 18px;
        background-color: #1d1d1d;
        border: 1px solid rgba(var(--textColor1), 0.03);

        h2 {
            @include text-style(1, 400, 1.3rem, "DM Mono");
            margin: 0px 0 13px -3px;
            display: none;
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(6, 1fr);
            grid-auto-flow: column;
            grid-gap: 24px;
            row-gap: 12px;
        }
        &__color {
            display: flex;
            width: 110px;
            cursor: pointer;

            &:hover &-name {
                opacity: 1;
            }
            &:hover &-swatch {
                box-shadow: rgba(#0C8CE9, 0.5) 0px 0px 0px 3.5px;
            }
        }
        &__color--picked &__color-swatch {
            box-shadow: rgba(#0C8CE9, 0.7) 0px 0px 0px 3px inset, 
                        rgba(#0C8CE9, 0.4) 0px 0px 0px 3.5px;
        }
        &__color--picked &__color-name {
            color: #0C8CE9 !important;
            opacity: 1;
        }
        &__color-swatch {
            @include square(21px, 20px);
            background-color: var(--color);
            margin-right: 10px;
        }
        &__color-name {
            @include text-style(1, 400, 1.25rem, "DM Mono");
            margin-top: 1px;
            opacity: 0.7;
        }
    }
</style>