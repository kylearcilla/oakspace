<script lang="ts">
	import { themeState } from "$lib/store";
	import { clickOutside } from "$lib/utils-general";

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions

    $: isDarkTheme = $themeState.isDarkTheme

    function onItemClicked(e: Event, idx: number) {
        options.onListItemClicked(e, idx)
    }
</script>

<!-- <div class="dropdown-menu-wrapper"> -->
    <ul 
        use:clickOutside on:click_outside={options.onClickOutside} 
        id={id}
        class="dropdown-menu dropdown-menu-dark"
        class:dropdown-menu--dark={isDarkTheme}
        class:dropdown-menu--hidden={isHidden}
        style:top={options.position?.top}
        style:left={options.position?.left}
        style:right={options.position?.right}
        style:bottom={options.position?.bottom}
        style:z-index={options?.zIndex ?? 1}
        style:width={options.width}
    >
        {#each options.listItems as option, idx}
            <li 
                class="dropdown-menu__option"
                class:dropdown-menu__option--selected={options.pickedItemIdx === idx}
            >
                <button class="dropdown-menu__option-btn" on:click={(e) => onItemClicked(e, idx)}>
                    <!-- Left Icon -->
                    {#if option.leftIcon}
                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                            <i class={option.leftIcon}></i>
                        </div>
                    {/if}
                        <span class="dropdown-menu__option-text">
                            {option.name}
                        </span>
                    <!-- Check -->
                    {#if options.pickedItemIdx != undefined}
                    <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <!-- Right Icon -->
                    {:else if option.rightIcon}
                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--right">
                            <i class={option.rightIcon}></i>
                        </div>
                    {/if}
                </button>
            </li>
        {/each}
    </ul>
<!-- </div> -->

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>