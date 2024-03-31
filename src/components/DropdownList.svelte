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
    $: toggleMenu(!isHidden)

    $: if (!isHidden && dropdownMenuRef && options.scroll?.goToIdx) {
        goToStartingIdxLocation(options.scroll.goToIdx)
    }

    let idxCount = 0
    let removeTimeout: NodeJS.Timeout | null = null
    let isMounted = false
    let _isActive = true

    const TRANSITION_DURATIONS_MS = 200

    function toggleMenu(isActive: boolean) {
        idxCount = 0

        // mount if active, mount on DOM, then toggle aniamtion
        if (isActive) {
            isMounted = true
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
                isMounted = false

                if (options.onDismount) {
                    options.onDismount()
                }

            }, TRANSITION_DURATIONS_MS)
            removeTimeout = null
        }
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
    function goToStartingIdxLocation(goToIdx: number) {
        if (goToIdx < 0) return
        
        const listItems = [...dropdownMenuRef.children]
        if (!listItems || listItems.length === 0) return

        const toIdx = goToIdx
        let distanceToIdx = 0

        for (let i = 0; i < toIdx; i++) {
            distanceToIdx += listItems[i].clientHeight
        }
        dropdownMenuRef.scrollTop = distanceToIdx
    }
    function onClickOutside() {
        if (isHidden || !options.onClickOutside) return
        options.onClickOutside()
    }
    function initOptnIdx() {
        return idxCount++
    }

    onMount(() => {
        goToStartingIdxLocation(options.scroll?.goToIdx ?? -1)
    })
</script>

{#if isMounted}
    <ul 
        use:clickOutside on:click_outside={onClickOutside} 
        id={`${id}--dropdown-menu`}
        bind:this={dropdownMenuRef}
        class="dropdown-menu"
        class:dropdown-menu--dark={isDarkTheme}
        class:dropdown-menu--shown={_isActive}
        class:dropdown-menu--has-scroll-bar={options.scroll?.bar ?? false}
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
                        {@const optnIdx = initOptnIdx()}
                        <li 
                            class="dropdown-menu__option"
                            class:dropdown-menu__option--selected={options.pickedItemIdx === optnIdx}
                        >
                            <button class="dropdown-menu__option-btn" on:click={(e) => onItemClicked(e, optnIdx)}>
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
                {@const optnIdx = initOptnIdx()}

                <li 
                    class="dropdown-menu__option"
                    class:dropdown-menu__option--selected={options.pickedItemIdx === optnIdx}
                >
                    <button class="dropdown-menu__option-btn" on:click={(e) => onItemClicked(e, optnIdx)}>
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
{/if}

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>