<script lang="ts">
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { inlineStyling } from "$lib/utils-general"

	import SvgIcon from "./SVGIcon.svelte"

    export let id: string = ""
    export let options: DropdownBtnOptions
    export let isActive = false
    
    const { 
        allowEmpty = false,
        hasArrow = true,
        arrowOnHover = false,
        noBg = false,
    } = options

    $: isLight = !$themeState.isDarkTheme
    $: title = options.title
    $: isEmpty = !title
    $: doShowArrow = hasArrow && (!allowEmpty || ((allowEmpty && !isActive) || (allowEmpty && isEmpty)))
    
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
    class:dbtn--active={isActive}
    class:dbtn--light={isLight}
    class:dbtn--arrow-on-hover={arrowOnHover}
    style={inlineStyling(options.styles)}
    on:click={options.onClick}
>
    <span 
        class="dbtn__title"
        style:font-size={options?.styles?.fontSize}
        style:font-family={options?.styles?.fontFamily ?? "inherit"}
    >
        {title ?? "None"}
    </span>
    {#if doShowArrow}
        <div class="dbtn__icon dbtn__icon--arrow">
            <SvgIcon 
                icon={Icon.Dropdown}
                options={{ scale: 1.3 }}
            />
        </div>
    {/if}
    {#if allowEmpty && isActive && !isEmpty}
        <button 
            class="dbtn__icon dbtn__icon--close-btn"
            on:click={onRemoveBtnClicked}
        >
            <SvgIcon 
                icon={Icon.Close} 
                options={{ 
                    scale: 0.9, strokeWidth: 1.6, height: 12, width: 12
                }}
            />
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