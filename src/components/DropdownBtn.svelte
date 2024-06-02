<script lang="ts">
	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { inlineStyling } from "$lib/utils-general";
	import SvgIcon from "./SVGIcon.svelte"

    export let id: string = ""
    export let options: DropdownBtnOptions
    export let isActive = false
    
    $: isDarkTheme = $themeState.isDarkTheme
    $: pickedOptionName = options.pickedOptionName
    $: isEmpty = !pickedOptionName

    $: doShowArrow = hasArrow && (!allowEmpty || ((allowEmpty && !isActive) || (allowEmpty && isEmpty)))
    
    const allowEmpty = options.allowEmpty ?? false
    const arrowLeft  = options.arrowLeft ?? false
    const hasArrow   = options.hasArrow != undefined ? options.hasArrow : true
    const noBg       = options.noBg != undefined ? options.noBg : false
    const bgOnactive = options.bgOnactive != undefined ? options.bgOnactive : false

    function onRemoveBtnClicked() {
        if (options.onRemove) {
            options.onRemove()
        }
    }

</script>

<button
    id={`${id}--dropdown-btn`}
    class="dropdown-btn"
    class:dropdown-btn--empty={isEmpty}
    class:dropdown-btn--no-bg={noBg}
    class:dropdown-btn--bg-on-active={bgOnactive}
    class:dropdown-btn--active={isActive}
    class:dropdown-btn--dark={isDarkTheme}
    class:dropdown-btn--arrow-on-hover={options.arrowOnHover}
    class:dropdown-btn--arrow-left={arrowLeft}
    style={inlineStyling(options.styles)}
    on:click={options.onClick}
>
    {#if doShowArrow && arrowLeft}
        <div 
            class="dropdown-btn__icon dropdown-btn__icon--arrow"
            style={inlineStyling(options.arrowStyles)}
        >
            <SvgIcon 
                icon={Icon.Dropdown}
                options={{
                    scale: 1.1, height: 12, width: 12, strokeWidth: 1.2
                }}
            />
        </div>
    {/if}
    <span 
        class="dropdown-btn__title"
        style:font-size={options?.styles?.fontSize}
        style:font-family={options?.styles?.fontFamily ?? "Manrope"}
    >
        {pickedOptionName ?? "None"}
    </span>
    {#if doShowArrow && !arrowLeft}
        <div 
            class="dropdown-btn__icon dropdown-btn__icon--arrow"
            style={inlineStyling(options.arrowStyles)}
        >
            <SvgIcon 
                icon={Icon.Dropdown}
                options={{
                    scale: 1.1, height: 12, width: 12, strokeWidth: 1.4
                }}
            />
        </div>
    {/if}
    {#if allowEmpty && isActive && !isEmpty}
        <button 
            class="dropdown-btn__icon dropdown-btn__icon--close-btn"
            on:click={onRemoveBtnClicked}
        >
            <SvgIcon icon={Icon.Close} options={{ scale: 0.9, strokeWidth: 1.6, height: 12, width: 12, }} />
        </button>
    {/if}
</button>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .dropdown-btn {
        &--no-bg {
            background-color: transparent !important;
            background: transparent !important;
        }
        &--dark {
            @include dropdown-btn-dark;
        }
        &__icon--close-btn {
            transition: 0.05s ease-in-out;
            opacity: 0.4;
            margin-bottom: -2px;
            @include center;

            &:hover {
                opacity: 1;
            }
            &:active {
                transform: scale(0.9);
            }
        }
    }
</style>