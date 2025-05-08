<script lang="ts">
    import { onMount } from "svelte"
	import { themeState } from "$lib/store"
    
	import { clickOutside, normalToKebab } from "$lib/utils-general"
	import { getHozSpace } from "../lib/utils-general"

	import ToggleBtn from "./ToggleBtn.svelte"
	import DropdownListOption from "./DropdownListOption.svelte"
	import DropdownListMenuOptn from "./DropdownListMenuOptn.svelte"

    export let id: string = ""  // dropdown context
    export let childId: string = ""  // dropdown is a child of another parent
    export let relDir: "l" | "r" = "l"  // wether dropdown is relative to right or left of container
    export let isHidden: boolean
    export let options: DropdownListOptions
    export let renderFlag: boolean | undefined = undefined

    let dmenuRef: HTMLElement
    let listItems = options.listItems
    let pickedItem = options.pickedItem

    const { scroll } = options
    const {
        width = "auto",
        zIndex = 1,
        minWidth = "auto",
        maxWidth = "auto",
        height = "auto",
        maxHeight = "auto",
        overflow = "visible",
        fontFamily = "inherit",
        fontSize = "1.3rem"
    } = options.styling ?? {}

    $: isDark = $themeState.isDarkTheme
    $: if (!isHidden && dmenuRef && options.scroll?.goToIdx) {
        goToStartingIdxLocation(options.scroll.goToIdx)
    }
    $: if (!isHidden) {
        listItems = options.listItems
    }
    $: if (options.pickedItem != null && options.pickedItem != undefined) {
        pickedItem = options.pickedItem
    }

    /* actions */
    function onItemClicked(e: Event, idx: number, name: string) {
        if (options.onListItemClicked) {
            options.onListItemClicked({
                event: e, 
                name,
                idx, 
                parentName: options.parentId
            })
        }
    }
    function onClickOutside() {
        if (isHidden || !options.onClickOutside) {
            return
        }
        options.onClickOutside()
    }

    /* event handlers */
    function onMenuLeave(e: PointerEvent) {
        const { parentId, onPointerLeave } = options
        if (!onPointerLeave) {
            return
        }
        if (!parentId) {
            onPointerLeave()
            return
        }

        const rTarget = e.relatedTarget as HTMLElement
        const menuElem = rTarget.closest('[data-dmenu-id]') as HTMLElement
        
        // leave if not the parent menu
        if (!menuElem || getDmenuId(menuElem) != parentId) {
            onPointerLeave()
            return
        }
    }
    /* child menu stuff */
    function onItemPointerLeave(e: PointerEvent, item: DropdownOption) {
        const { onPointerLeave, childId } = item
        const rTarget   = e.relatedTarget as HTMLElement
        const rDmenu    = rTarget?.children[0]?.closest('.dmenu')

        if (!rDmenu || !rDmenu.classList.contains("dmenu") || getChildId(rDmenu as HTMLElement) != childId) {
            onPointerLeave?.({ e, item })
        }
    }
    function onItemPointerOver(e: PointerEvent, item: DropdownOption) {
        const container = options.rootRef

        if (!item.onPointerOver) {
            return
        }
        if (!container) {
            item.onPointerOver()
            return
        }
        console.log(item)
        item.onPointerOver({ 
            e, 
            item, 
            childXPos: initChildXPos(container, item.leftOffset) 
        })
    }
    /* child menu */
    function initChildXPos(container: HTMLElement, leftOffset = 2) {
        const { left, width } = dmenuRef.getBoundingClientRect()
        const { left: cLeft, width: cWidth } = container.getBoundingClientRect()
        const pWidth = width - 4

        const childMenuWidth = 150
        const leftPosition = left - cLeft
        const rightPosition = cWidth - leftPosition + pWidth
        const pos = relDir === "r" ? rightPosition : leftPosition

        // space between the container's right edge and the parent's right edge
        const space = getHozSpace({
            left:  { elem: dmenuRef, edge: "right" },
            right: { elem: container, edge: "right" },
            absolute: false
        })

        if (childMenuWidth <= space) {
            return pos + pWidth + 6
        }
        else {
            return pos - pWidth - leftOffset
        }
    }
    function getDmenuId(elem: HTMLElement) {
        return elem.dataset.dmenuId
    }
    function getChildId(elem: HTMLElement) {
        return elem.dataset.childId
    }

    /* indices */
    function goToStartingIdxLocation(goToIdx: number) {
        if (goToIdx < 0) return
        
        const listItems = [...dmenuRef.children]
        if (!listItems || listItems.length === 0) return
        
        const toIdx = goToIdx
        let distanceToIdx = 0
        
        for (let i = 0; i < toIdx; i++) {
            distanceToIdx += listItems[i].clientHeight
        }
        dmenuRef.scrollTop = distanceToIdx
    }
    function onToggle(idx: number) {
        let item = listItems[idx] as DropdownToggleOption
        if (!item) return

        item.active = !item.active
        item.onToggle()
    }

    onMount(() => {
        goToStartingIdxLocation(options.scroll?.goToIdx ?? -1)
    })
</script>


<div 
    class="dmenu-container"
    class:dmenu-container--child={options.parentId}
    on:pointerleave={onMenuLeave}
>
    <ul 
        data-dmenu-id={id}
        data-child-id={childId}
        class="dmenu"
        class:dmenu--light={!isDark}
        class:dmenu--has-scroll-bar={scroll?.bar ?? false}
        style:width={width}
        style:min-width={minWidth}
        style:max-width={maxWidth}
        style:height={height}
        style:max-height={maxHeight}
        style:font-family={fontFamily}
        style:overflow={overflow}
        style:--font-size={fontSize}
        style:z-index={zIndex}
        use:clickOutside on:outClick={onClickOutside} 
        bind:this={dmenuRef}
    >
        {#key renderFlag}
            {#each listItems as item, idx}
                <!-- section name -->
                {#if "sectionName" in item}
                    <li 
                        class="dmenu__section-name"
                        class:dmenu__section-name--mono={item.font === "mono"}
                    >
                        {item.sectionName}
                    </li>
                <!-- menu -->
                {:else if "twinItems" in item}
                    {@const { twinItems, pickedItem, onListItemClicked } = item}
                    <div style:display="flex" style:margin="5px 0px 10px 7px">
                        {#each twinItems as twinItem}
                            {@const { name, faIcon, size } = twinItem}
                            <button 
                                class="dmenu__box" 
                                class:dmenu__box--selected={pickedItem === name}
                                on:click={(e) => {
                                    onListItemClicked({
                                        event: e,
                                        name,
                                        idx
                                    })
                                }}
                            >
                                <div class="dmenu__box-icon">
                                    <i class={faIcon} style:font-size={size}></i>
                                </div>
                                <span>{name}</span>
                            </button>
                        {/each}
                    </div>
                <!-- menu -->
                {:else if "pickedItem" in item && item.name}
                    <li class="dmenu__option--static">
                        <span class="dmenu__option-heading">
                            {item.name}
                        </span>
                        <DropdownListMenuOptn {item} id={normalToKebab(item.name)} />
                    </li>
                    {#if item.divider}
                        <li 
                            class="dmenu__section-divider"
                            style:margin-top="9px"
                        >
                        </li>
                    {/if}
                <!-- toggle button -->
                {:else if "active" in item && item.name}
                    {@const { name, active } = item}
                    <li class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">
                            {name}
                        </span>
                        <ToggleBtn 
                            {active} 
                            onToggle={() => onToggle(idx)}
                        />
                    </li>
                    {#if item.divider}
                        <li class="dmenu__section-divider">
                        </li>
                    {/if}
                <!-- regular option-->
                {:else if "name" in item && item.name}
                    {@const option = item}
                    <DropdownListOption 
                        {idx}
                        {option}
                        {pickedItem}
                        {onItemPointerLeave}
                        {onItemPointerOver}
                        onOptionClicked={onItemClicked}
                    />
                    {#if item.divider}
                        <li class="dmenu__section-divider"></li>
                    {/if}
                {/if}
            {/each}
        {/key}
    </ul>
</div>

<style lang="scss">
    @use "../scss/dropdown.scss" as *;
</style>