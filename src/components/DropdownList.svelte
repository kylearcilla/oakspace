<script lang="ts">
	import { themeState } from "$lib/store";
	import { clickOutside, findAncestor } from "$lib/utils-general";
	import { onMount } from "svelte";
	import Hotkeys from "./Hotkeys.svelte";
	import BounceFade from "./BounceFade.svelte";

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions

    let dropdownMenuRef: HTMLElement
    let idxCount = 0
    let listItems = options.listItems
    let pickedItem = options.pickedItem

    $: isDarkTheme = $themeState.isDarkTheme

    $: if (isHidden != undefined) { 
        resetCount(!isHidden)
    }
    
    $: if (!isHidden && dropdownMenuRef && options.scroll?.goToIdx) {
        goToStartingIdxLocation(options.scroll.goToIdx)
    }
    $: if (!isHidden) {
        // allow list items to change only as it opens
        // avoid list items from changing immediately as the list fades out before unmount
        listItems = options.listItems
    }
    $: if (options.pickedItem != null && options.pickedItem != undefined) {
        pickedItem = options.pickedItem
    }

    function resetCount(isActive: boolean) {
        idxCount = 0
    }
    function onItemClicked(e: Event, idx: number) {
        options.onListItemClicked({
            event: e, idx, parentName: options.parent?.optnName
        })
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
    function onPointerLeave(e: PointerEvent) {
        if (!options.onPointerLeave) return

        // no parent
        if (!options.parent) {
            options.onPointerLeave()
            return
        }

        const rTarget = e.relatedTarget as HTMLElement
        const optnBtn = findAncestor({
            child: rTarget, queryStr: "dropdown-menu__option-btn", queryBy: "class", strict: true
        })
        const menuElem = findAncestor({
            child: rTarget, queryStr: "dropdown-menu", queryBy: "id"
        })
        const optionElem = findAncestor({
            child: rTarget, queryStr: "dropdown-menu__option", queryBy: "class", strict: true
        })
        
        // leaves outside of menu and not parent
        if (!optnBtn || !menuElem || !optionElem) {
            options.onPointerLeave()
            return
        }

        const optionsElemIdx = +optionElem!.getAttribute("data-optn-idx")!
        
        // leaves into a dropdown menu but not the parent and not the parent option
        if (menuElem.id != `${options.parent.id}--dropdown-menu` || optionsElemIdx != options.parent.optnIdx) {
            options.onPointerLeave()
        }
    }
    function onItemPointerLeave(e: PointerEvent, item: DropdownOption) {
        if (!item.onPointerLeave) return

        // no child menu
        if (!options.childId) {
            item.onPointerLeave()
            return
        }

        const childId   = `${options.childId}--dropdown-menu`
        const rTarget   = e.relatedTarget as HTMLElement
        const rTargetId = rTarget?.children[0]?.id

        if (childId != rTargetId) {
            item.onPointerLeave()
        }
    }

    onMount(() => {
        goToStartingIdxLocation(options.scroll?.goToIdx ?? -1)
    })
</script>

<BounceFade 
    {isHidden} 
    onDismount={options.onDismount}
    position={options.position}
    zIndex={options?.styling?.zIndex ?? 1}
>
    <div 
        class="dropdown-menu-container"
        class:dropdown-menu-container--child={options.parent}
        on:pointerleave={onPointerLeave}
    >
        <ul 
            use:clickOutside on:click_outside={onClickOutside} 
            bind:this={dropdownMenuRef}
            id={`${id}--dropdown-menu`}
            class="dropdown-menu"
            class:dropdown-menu--dark={isDarkTheme}
            class:dropdown-menu--has-scroll-bar={options.scroll?.bar ?? false}
            style:width={options?.styling?.width ?? "auto"}
            style:height={options?.styling?.height ?? "auto"}
            style:max-height={options?.styling?.maxHeight ?? "auto"}
            style:--font-family={options.styling?.fontFamily ?? "Manrope"}
            style:--font-size={options.styling?.fontSize ?? "1.24rem"}
        >
            {#each listItems as item, idx}
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
                                class:dropdown-menu__option--selected={pickedItem === optnIdx}
                            >
                                <button 
                                    class="dropdown-menu__option-btn" 
                                    on:click={(e) => onItemClicked(e, optnIdx)}
                                >
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
                                        {#if pickedItem != undefined}
                                            <div class="dropdown-menu__option-icon dropdown-menu__option-icon--check">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        {/if}
                                        {#if option.rightIcon && type != "hotkey"}
                                            <div class={`dropdown-menu__option-icon dropdown-menu__option-icon--${type}`}>
                                                <i class={getDefaultIcon(option)}></i>
                                            </div>
                                        {:else if option.rightIcon}
                                            <!-- Hot Key -->
                                            <Hotkeys hotkeys={getHotkeys(option)} />
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
                    {@const name = item.name}

                    <li 
                        class="dropdown-menu__option"
                        class:dropdown-menu__option--selected={pickedItem === name || pickedItem === optnIdx}
                        data-optn-idx={idx}
                        on:pointerenter={item.onPointerOver}
                        on:pointerleave={(e) => onItemPointerLeave(e, option)}
                    >
                        <button 
                            class="dropdown-menu__option-btn" 
                            on:click={(e) => onItemClicked(e, optnIdx)}
                        >
                            <!-- Left Icon -->
                            {#if option.leftIcon}
                                <div class="dropdown-menu__option-icon dropdown-menu__option-icon--left">
                                    <i class={option.leftIcon}></i>
                                </div>
                            {/if}
                            <!-- Content -->
                            <span class="dropdown-menu__option-text">
                                {name}
                            </span>
                            <!-- Right Icon -->
                            <div class="dropdown-menu__option-right-icon-container">
                                <!-- Check -->
                                {#if pickedItem != undefined}
                                    <div 
                                        class="dropdown-menu__option-icon"
                                        class:dropdown-menu__option-icon--check={true}
                                    >
                                        <i class="fa-solid fa-check"></i>
                                    </div>
                                {/if}
                                {#if option.rightIcon && type != "hotkey"}
                                    <div class={`dropdown-menu__option-icon dropdown-menu__option-icon--${type}`}>
                                        <i class={getDefaultIcon(option)}></i>
                                    </div>
                                {:else if option.rightIcon}
                                    <!-- Hot Key -->
                                    <Hotkeys hotkeys={getHotkeys(option)} />
                                {/if}
                            </div>
                        </button>
                    </li>
                {/if}
            {/each}
        </ul>
    </div>
</BounceFade>

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>