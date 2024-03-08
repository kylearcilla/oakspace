<script lang="ts">
	import { Icon } from "$lib/enums";
	import { themeState } from "$lib/store";
	import { clickOutside } from "$lib/utils-general";
	import SvgIcon from "./SVGIcon.svelte";

    export let options: DropdownBtn
    export let isActive = false


    $: isDarkTheme = $themeState.isDarkTheme
    $: console.log(isActive)

    function onClick(e: Event) {
        options.onClick(e)
    }

</script>

<button
    class="dropdown-btn"
    class:dropdown-btn--active={isActive}
    class:dropdown-btn--dark={isDarkTheme}
    class:dropdown-btn--arrow-on-hover={options.arrowOnHover}
    style:padding={options?.styles?.padding}
    on:click={onClick}
>
    <span 
        class="dropdown-btn__title"
        style:font-size={options?.styles?.fontSize}
    >
        {options.title}
    </span>
    {#if options.hasArrow != undefined ? options.hasArrow : true}
        <div class="dropdown-btn__icon dropdown-btn__icon--arrow">
            <SvgIcon icon={Icon.Dropdown}/>
        </div>
    {/if}
</button>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .dropdown-btn {
        &--dark {
            @include dropdown-btn-dark;
        }
    }
</style>