<script lang="ts">
	import { themeState } from "$lib/store";
	import { COLOR_SWATCHES, TEST_TAGS, clickOutside } from "$lib/utils-general";
	import { onMount } from "svelte"

    export let isActive: boolean
    export let chosenColor: Color | undefined = undefined
    export let onClickOutside: FunctionParam
    export let onChoose: FunctionParam
    export let onDismount: FunctionParam | undefined = undefined

    let colorPickerRef: HTMLElement
    let removeTimeout: NodeJS.Timeout | null = null
    let isPickerMounted = true
    let _isActive = true

    const TRANSITION_DURATIONS_MS = 200

    $: toggleMenu(isActive)
    $: isDark = $themeState.isDarkTheme

    
    function toggleMenu(isActive: boolean) {
        // mount if active, mount on DOM, then toggle aniamtion
        if (isActive) {
            isPickerMounted = true
            requestAnimationFrame(() => _isActive = true)
        }
        // if timeout has been set but user quickly toggles active agin, remove the timeout
        if (isActive && removeTimeout) {
            clearTimeout(removeTimeout)
            removeTimeout = null    
        }
        // if inactive, allow the animation, then dismount
        if (!isActive) {
            _isActive = false
            removeTimeout = setTimeout(() => { 
                if (onDismount) onDismount()
                
                isPickerMounted = false

            }, TRANSITION_DURATIONS_MS)
            removeTimeout = null
        }
    }

    function onSwatchClicked(color: Color) {
        onChoose(color)
    }

    onMount(() => {

    })
</script>

{#if isPickerMounted}
    <div 
        id="color-picker--dropdown-menu"
        class="color-picker" 
        class:color-picker--dark={!isDark}
        class:color-picker--shown={_isActive}
        style:--trans-duration={`${TRANSITION_DURATIONS_MS}ms`}
        use:clickOutside on:click_outside={() => onClickOutside()}
        bind:this={colorPickerRef}
    >
        <h2>Pick a Color</h2>
        <!-- Default Colors -->
        <ul class="color-picker__grid">
            {#each COLOR_SWATCHES.d as color}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div 
                    role="button"
                    tabindex="0"
                    class="color-picker__swatch"
                    class:color-picker__swatch--picked={color.id === chosenColor?.id}
                    class:color-picker__swatch--light-color={color.isLight}
                    style:--swatch-rgb-color={color.primary}
                    on:click={() => onSwatchClicked(color)}
                >
                </div>
            {/each}
        </ul>
        <!-- Earth / Pastel Colors -->
        <ul class="color-picker__grid color-picker__grid--pastel">
            {#each Array.from({ length: 21 }, (_, i) => i) as i}
                {@const swatch = COLOR_SWATCHES.d[1]}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div 
                    role="button"
                    tabindex="0"
                    class="color-picker__swatch"
                    class:color-picker__swatch--picked={i === 20}
                    class:color-picker__swatch--light-color={swatch.isLight}
                    style:--swatch-rgb-color={swatch.primary}
                    on:click={() => onSwatchClicked(swatch)}
                >
                </div>
            {/each}
        </ul>
    </div>
{/if}


<style lang="scss">
    .color-picker {
        padding: 9px 15px 15px 15px;
        border-radius: 17px;
        background-color: var(--dropdownMenuBgColor1);
        transition: var(--trans-duration) opacity cubic-bezier(.2, .45, 0, 1),
                    var(--trans-duration) visibility cubic-bezier(.2, .45, 0, 1),
                    var(--trans-duration) transform cubic-bezier(.2, .45, 0, 1);
        border: 1px solid rgba(white, 0.03);
        transform: scale(0.9);
        @include not-visible;
        
        &--light {
            
        }
        &--shown {
            transform: scale(1);
            @include visible;
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
            width: 18px;
            height: 18px;
            border: 2px solid transparent;
            border-radius: 8px;
            background-color: rgb(var(--swatch-rgb-color));
            transition: 0.12s ease-in-out;
            cursor: pointer;

            &--light {

            }
            &--picked {
                border-color: white;
            }
            &:active {
                transform: scale(0.97);
            }
        }
    }
</style>