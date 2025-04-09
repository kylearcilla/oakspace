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
        autoOpacity = false,
        styles,
        noBg = true
    } = options

    const {
        fontSize = "1.32rem",
        fontFamily = "inherit"
    } = styles ?? {}

    $: isLight = !$themeState.isDarkTheme
    $: title = options.title
    $: isEmpty = !title
    $: doShowArrow = hasArrow && (!allowEmpty || ((allowEmpty && !isActive) || (allowEmpty && isEmpty)))
    
    function onRemove() {
        if (options.onRemove) {
            options.onRemove()
        }
    }
</script>

<button
    data-dmenu-id={id}
    class="dbtn"
    class:dbtn--empty={isEmpty}
    class:dbtn--no-bg={noBg}
    class:dbtn--active={isActive}
    class:dbtn--light={isLight}
    class:dbtn--arrow-on-hover={arrowOnHover}
    class:dbtn--auto-opacity={autoOpacity}
    style={inlineStyling(options.styles)}
    on:click={options.onClick}
>
    <span 
        class="dbtn__title"
        style:--font-size={fontSize}
        style:--font-family={fontFamily}
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
            class="dbtn__icon dbtn__icon--close"
            on:click={onRemove}
        >
            <SvgIcon 
                icon={Icon.Close} 
                options={{ 
                    scale: 0.96, strokeWidth: 2, height: 11, width: 11
                }}
            />
        </button>
    {/if}
</button>

<style lang="scss">
@import "../scss/dropdown.scss";
</style>