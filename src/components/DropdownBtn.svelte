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
    
    const allowEmpty = options.allowEmpty ?? false
    const hasArrow = options.hasArrow != undefined ? options.hasArrow : true

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
    class:dropdown-btn--active={isActive}
    class:dropdown-btn--dark={isDarkTheme}
    class:dropdown-btn--arrow-on-hover={options.arrowOnHover}
    style={inlineStyling(options.styles)}
    on:click={options.onClick}
>
    <span 
        class="dropdown-btn__title"
        style:font-size={options?.styles?.fontSize}
    >
        {pickedOptionName ?? "None"}
    </span>
    {#if hasArrow && (!allowEmpty || ((allowEmpty && !isActive) || (allowEmpty && isEmpty)))}
        <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
            <SvgIcon icon={Icon.Dropdown}/>
        </div>
    {/if}
    {#if allowEmpty && isActive && !isEmpty}
        <button 
            class="dropdown-btn__icon dropdown-btn__icon--close-btn"
            on:click={onRemoveBtnClicked}
        >
            <SvgIcon icon={Icon.Close} options={{ scale: 0.9, strokeWidth: 1.2 }} />
        </button>
    {/if}
</button>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .dropdown-btn {
        &--dark {
            @include dropdown-btn-dark;
        }
        &__icon--close-btn {
            transition: 0.05s ease-in-out;
            opacity: 0.4;
            &:hover {
                opacity: 1;
            }
            &:active {
                transform: scale(0.9);
            }
        }
    }
</style>