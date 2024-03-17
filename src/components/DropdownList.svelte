<script lang="ts">
	import { themeState } from "$lib/store";
	import { clickOutside, getElemById } from "$lib/utils-general";
	import { onMount } from "svelte";
	import Hotkeys from "./Hotkeys.svelte";

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions

    let dropdownMenuRef: HTMLElement

    $: isDarkTheme = $themeState.isDarkTheme
    $: if (!isHidden) {
        goToStartingIdx(options.ui?.startingIdx)
    }

    function onItemClicked(e: Event, idx: number) {
        options.onListItemClicked(e, idx)
    }
    function getDefaultIcon(item: DropdownOption) {
        return item.rightIcon!.icon as string
    }
    function getHotkeys(item: DropdownOption) {
        return item.rightIcon!.icon as HotKeyCombo
    }
    function goToStartingIdx(startingIdx?: number) {
        if (!startingIdx || startingIdx < 0 || !dropdownMenuRef) return
        
        const listItems = [...dropdownMenuRef.children]
        if (!listItems || listItems.length === 0) return

        const toIdx = startingIdx
        let distanceToIdx = 0

        for (let i = 0; i < toIdx; i++) {
            distanceToIdx += listItems[i].clientHeight
        }
        dropdownMenuRef.scrollTop = distanceToIdx
    }

    onMount(() => {
        dropdownMenuRef = getElemById(id)!
    })
</script>

<!-- <div class="dropdown-menu-wrapper"> -->
    <ul 
        use:clickOutside on:click_outside={options.onClickOutside} 
        id={id}
        class="dropdown-menu"
        class:dropdown-menu--dark={isDarkTheme}
        class:dropdown-menu--hidden={isHidden}
        class:dropdown-menu--has-scroll-bar={options.ui?.hasScrollBar ?? false}
        style:top={options.position?.top}
        style:left={options.position?.left}
        style:right={options.position?.right}
        style:bottom={options.position?.bottom}
        style:z-index={options?.styling?.zIndex ?? 1}
        style:width={options?.styling?.width ?? "auto"}
        style:height={options?.styling?.height ?? "auto"}
        style:--font-family={options.styling?.fontFamily ?? "Manrope"}
        style:--font-size={options.styling?.fontSize ?? "1.24rem"}
    >
        {#each options.listItems as item, idx}
            <!-- Section Item -->
            {#if "options" in item}
                {@const section = item}
                <li class="dropdown-menu__section">
                    <!-- Option Item -->
                    {#each section.options as option}
                        {@const type = option.rightIcon?.type}
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
                                <!-- Content -->
                                <span class="dropdown-menu__option-text">
                                    {option.name}
                                </span>
                                <!-- Right Icon -->
                                <div class="dropdown-menu__option-right-icon-container">
                                    <!-- Check -->
                                    {#if options.pickedItemIdx != undefined}
                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                    {/if}
                                    <!-- Right Icon -->
                                    {#if option.rightIcon && type === "default"}
                                        <div class="dropdown-menu__option-icon">
                                            <i class={getDefaultIcon(option)}></i>
                                        </div>
                                    {:else if option.rightIcon && type === "unit"}
                                        <div class="dropdown-menu__option-icon dropdown-menu__option-icon--unit">
                                            {getDefaultIcon(option)}
                                        </div>
                                    <!-- Hot Key -->
                                    {:else if option.rightIcon}
                                        <Hotkeys hotkeys={getHotkeys(option)}  />
                                    {/if}
                                </div>
                            </button>
                    </li>
                    {/each}
                </li>
                <li class="dropdown-menu__section-divider"></li>
            <!-- Option Item -->
            {:else}
                {@const option = item}
                {@const type = item.rightIcon?.type}
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
                        <!-- Content -->
                        <span class="dropdown-menu__option-text">
                            {option.name}
                        </span>
                        <!-- Right Icon -->
                        <div class="dropdown-menu__option-right-icon-container">
                            <!-- Check -->
                            {#if options.pickedItemIdx != undefined}
                                <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            {/if}
                            <!-- Right Icon -->
                            {#if option.rightIcon && type === "default"}
                                <div class="dropdown-menu__option-icon">
                                    <i class={getDefaultIcon(option)}>
                                </div>
                            {:else if option.rightIcon && type === "unit"}
                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--unit">
                                {getDefaultIcon(option)}
                            </div>
                            <!-- Hot Key -->
                            {:else if option.rightIcon}
                                <Hotkeys hotkeys={getHotkeys(option)}  />
                            {/if}
                        </div>
                    </button>
                </li>
            {/if}
        {/each}
    </ul>
<!-- </div> -->

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>