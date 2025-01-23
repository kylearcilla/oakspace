<script lang="ts">
	import { themeState } from "$lib/store"
	import { clickOutside, findAncestor } from "$lib/utils-general"
	import { onMount } from "svelte"
	import BounceFade from "./BounceFade.svelte"
	import DropdownListOption from "./DropdownListOption.svelte"
	import { getHozSpace } from "../lib/utils-general";

    export let id: string = ""
    export let isHidden: boolean
    export let options: DropdownListOptions

    let dmenuRef: HTMLElement
    let idxCount = 0
    let listItems = options.listItems
    let pickedItem = options.pickedItem

    $: isDark = $themeState.isDarkTheme

    $: if (isHidden != undefined) { 
        resetCount()
    }
    $: if (!isHidden && dmenuRef && options.scroll?.goToIdx) {
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

    function resetCount() {
        idxCount = 0
    }
    function onItemClicked(e: Event, idx: number, name: string) {
        options.onListItemClicked({
            event: e, 
            name,
            idx, 
            parentName: options.parent?.optnName
        })
    }
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
    function onClickOutside() {
        if (isHidden || !options.onClickOutside) return
        options.onClickOutside()
    }
    function initOptnIdx() {
        return idxCount++
    }
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
        const { childId, container } = options.parentContext ?? {}
        if (!item.onPointerLeave) {
            return
        }
        if (!childId) {
            item.onPointerLeave({ e, item })
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
        const { childId, container } = options.parentContext ?? {}
        const { onPointerOver } = item
        if (!childId || !onPointerOver) {
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
        class="dmenu-container"
        class:dmenu-container--child={options.parent}
        on:pointerleave={onPointerLeave}
    >
        <ul 
            use:clickOutside on:click_outside={onClickOutside} 
            bind:this={dmenuRef}
            id={`${id}--dmenu`}
            class="dmenu"
            class:dmenu--light={!isDark}
            class:dmenu--has-scroll-bar={options.scroll?.bar ?? false}
            style:width={options?.styling?.width ?? "auto"}
            style:min-width={options?.styling?.minWidth ?? "auto"}
            style:max-width={options?.styling?.maxWidth ?? "auto"}
            style:height={options?.styling?.height ?? "auto"}
            style:max-height={options?.styling?.maxHeight ?? "auto"}
            style:--font-family={options.styling?.fontFamily ?? "Manrope"}
        >
            {#each listItems as item}
                {#if "sectionName" in item}
                    <div class="dmenu__section-name">
                        {item.sectionName}
                    </div>
                {:else if "name" in item}
                    {@const option = item}
                    <DropdownListOption 
                        {option}
                        {pickedItem}
                        {onItemPointerLeave}
                        {onItemPointerOver}
                        idx={initOptnIdx()}
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

    .dmenu--light {
        @include dmenu--light;
    }
</style>