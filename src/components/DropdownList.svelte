<script lang="ts">
	import { themeState } from "$lib/store"
	import { onMount } from "svelte"
    
	import { getHozSpace } from "../lib/utils-general"
	import { clickOutside, findAncestor } from "$lib/utils-general"

	import BounceFade from "./BounceFade.svelte"
	import DropdownListOption from "./DropdownListOption.svelte"
	import ToggleBtn from "./ToggleBtn.svelte";
	import DropdownListMenuOptn from "./DropdownListMenuOptn.svelte";

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions

    let dmenuRef: HTMLElement
    let listItems = options.listItems
    let pickedItem = options.pickedItem

    const {       
        fixPos = false,
        context = "default",
        onDismount,
        scroll
    } = options
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

    /* actions*/
    function onItemClicked(e: Event, idx: number, name: string) {
        if (options.onListItemClicked) {
            options.onListItemClicked({
                event: e, 
                name,
                idx, 
                parentName: options.parent?.optnName
            })
        }
    }
    function onClickOutside() {
        if (isHidden || !options.onClickOutside) {
            return
        }
        options.onClickOutside()
    }

    /* child menu hover */
    function onPointerLeave(e: PointerEvent) {
        if (!options.onPointerLeave) {
            return
        }
        if (!options.parent) {
            options.onPointerLeave()
            return
        }

        const rTarget = e.relatedTarget as HTMLElement
        const optnBtn = findAncestor({
            child: rTarget, queryStr: "dmenu__option-btn", queryBy: "class", strict: true
        })
        const menuElem = findAncestor({
            child: rTarget, queryStr: "dmenu", queryBy: "id"
        })
        const optionElem = findAncestor({
            child: rTarget, queryStr: "dmenu__option", queryBy: "class", strict: true
        })
        
        // leaves outside of menu and not parent
        if (!optnBtn || !menuElem || !optionElem) {
            options.onPointerLeave()
            return
        }

        const optionsElemIdx = +optionElem!.getAttribute("data-optn-idx")!
        
        // leaves into a dropdown menu but not the parent and not the parent option
        if (menuElem.id != `${options.parent.id}--dmenu` || optionsElemIdx != options.parent.optnIdx) {
            options.onPointerLeave()
        }
    }
    function onItemPointerLeave(e: PointerEvent, item: DropdownOption) {
        const { childId } = options.parentContext ?? {}
        if (!item.onPointerLeave) {
            return
        }

        // do not leave if off to child menu
        const rTarget   = e.relatedTarget as HTMLElement
        const rTargetId = rTarget?.children[0]?.id

        if (`${childId}--dmenu` != rTargetId) {
            item.onPointerLeave({ e, item })
        }
    }
    function onItemPointerOver(e: PointerEvent, item: DropdownOption) {
        const { container } = options.parentContext ?? {}
        if (!item.onPointerOver) {
            return
        }
        if (!container) {
            item.onPointerOver()
            return
        }
        item.onPointerOver({ 
            e, 
            item, 
            childLeft: initChildLeft(container) 
        })
    }
    function initChildLeft(container: HTMLElement) {
        const { left, width } = dmenuRef.getBoundingClientRect()
        const { left: cLeft } = container.getBoundingClientRect()
        const childMenuWidth = 150

        const space = getHozSpace({
            left:  { elem: dmenuRef, edge: "right" },
            right: { elem: container, edge: "right" },
            absolute: false
        })

        if (childMenuWidth <= space) {
            return left - cLeft + width + 4
        }
        else {
            return left - cLeft - width + 10
        }
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

<BounceFade 
    id={id}
    {isHidden} 
    {fixPos}
    offsetContext={context}
    onDismount={onDismount}
    position={fixPos ? undefined :options?.position}
    zIndex={zIndex}
>
    <div 
        class="dmenu-container"
        class:dmenu-container--child={options.parent}
        on:pointerleave={onPointerLeave}
    >
        <ul 
            id={`${id}--dmenu`}
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
            use:clickOutside on:outClick={onClickOutside} 
            bind:this={dmenuRef}
        >
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
                {:else if "pickedItem" in item}
                    <li class="dmenu__option--static">
                        <span class="dmenu__option-heading">
                            {item.name}
                        </span>
                        <DropdownListMenuOptn {item}/>
                    </li>
                    {#if item.divider}
                        <li 
                            class="dmenu__section-divider"
                            style:margin-top="9px"
                        >
                        </li>
                    {/if}
                <!-- toggle button -->
                {:else if "active" in item}
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
                {:else if "name" in item}
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
        </ul>
    </div>
</BounceFade>

<style lang="scss">
    @import "../scss/dropdown.scss";
</style>