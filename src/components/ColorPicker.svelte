<script lang="ts">
    import { themeState } from "$lib/store"
    import { colorPicker } from "../lib/pop-ups"
	import { capitalize } from "$lib/utils-general"
	import { COLOR_SWATCHES } from "$lib/utils-colors"
    
	import BounceFade from "./BounceFade.svelte"
    
    const { state, onSubmitColor, close } = colorPicker

    $: isDark = $themeState.isDarkTheme
    $: isOpen =  $state.isOpen
    $: position =  $state.position
    $: picked = $state.picked

    function onSwatchClicked(color: Color) {
        onSubmitColor(color)
    }
</script>

<BounceFade 
    id="color-picker--dmenu"
    isHidden={!isOpen}
    zIndex={10001}
    position={{
        top: `${position.top}px`,
        left: `${position.left}px`
    }}
    onClickOutside={() => close()}
>
    <div 
        class="color-picker" 
        class:color-picker--light={!isDark}
    >
        <ul>
            {#each COLOR_SWATCHES as color}
                {@const { primary, name } = color }
                <li>
                    <button 
                        class="color-picker__color"
                        class:color-picker__color--picked={picked?.name === name}
                        style:--color={primary}
                        on:click={() => {
                            onSwatchClicked(color)
                        }}
                    >
                        <div class="color-picker__color-swatch"></div>
                        <div class="color-picker__color-name">
                            {capitalize(name)}
                        </div>
                    </button>
                </li>
            {/each}
        </ul>
    </div>
</BounceFade>


<style lang="scss">

    @mixin picked {
        background-color: rgba(var(--textColor1), var(--bg-opacity));
        
        .color-picker__color-name { 
            opacity: 1;
        }
        .color-picker__color-swatch {
            filter: brightness(var(--hov-brightness));
        }
    }

    .color-picker {
        padding: 4px 7px 6px 5px;
        border-radius: 7px;
        border: 1px solid rgba(var(--textColor1), 0.03);
        @include contrast-bg("bg-2");

        --bg-opacity: 0.025;
        --hov-brightness: 1.15;
        
        &--light {
            --bg-opacity: 0.06;
            --hov-brightness: 1.05;
        }

        li {
            margin-bottom: 1px;
            border-radius: 4px;

            &:last-child {
                margin-bottom: 0px;
            }
        }
        &__color {
            display: flex;
            cursor: pointer;
            padding: 6px 4px 6px 5px;
            border-radius: 6px;
            width: calc(100% - 6px);
            transition: 0s;

            &:hover {
                @include picked;
            }
        }
        &__color--picked  {
            @include picked;
        }
        &__color--picked &__color-name {
            opacity: 1;
        }
        &__color-swatch {
            @include square(14px, 6px);
            background-color: var(--color);
        }
        &__color-name {
            @include text-style(1, var(--fw-400-500), 1.225rem, "Geist Mono");
            margin: -2px 22px 0px 11px;
            opacity: 0.6;
        }
    }
</style>