<script lang="ts">
	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { inlineStyling } from "$lib/utils-general";
	import SvgIcon from "./SVGIcon.svelte"

    export let id: string = ""
    export let options: DropdownBtnOptions
    export let isActive = false
    
    $: isLight = !$themeState.isDarkTheme
    $: title = options.pickedOptionName
    $: isEmpty = !title

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
    id={`${id}--dbtn`}
    class="dbtn"
    class:dbtn--empty={isEmpty}
    class:dbtn--no-bg={noBg}
    class:dbtn--bg-on-active={bgOnactive}
    class:dbtn--active={isActive}
    class:dbtn--light={isLight}
    class:dbtn--arrow-on-hover={options.arrowOnHover}
    class:dbtn--arrow-left={arrowLeft}
    style={inlineStyling(options.styles)}
    on:click={options.onClick}
>
    {#if doShowArrow && arrowLeft}
        <div 
            class="dbtn__icon dbtn__icon--arrow"
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
        class="dbtn__title"
        style:font-size={options?.styles?.fontSize}
        style:font-family={options?.styles?.fontFamily ?? "inherit"}
    >
        {title ?? "None"}
    </span>
    {#if doShowArrow && !arrowLeft}
        <div 
            class="dbtn__icon dbtn__icon--arrow"
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
            class="dbtn__icon dbtn__icon--close-btn"
            on:click={onRemoveBtnClicked}
        >
            <SvgIcon icon={Icon.Close} options={{ scale: 0.9, strokeWidth: 1.6, height: 12, width: 12, }} />
        </button>
    {/if}
</button>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .dbtn {
        &--no-bg {
            background-color: transparent !important;
            background: transparent !important;
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