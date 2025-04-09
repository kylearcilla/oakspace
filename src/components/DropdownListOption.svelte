<script lang="ts">
	import { Icon } from "$lib/enums";
	import DropdownOptionIcon from "./DropdownOptionIcon.svelte"

    export let option: DropdownOption
    export let idx: number
    export let pickedItem: string | number | undefined
    export let onOptionClicked: (e: Event, optnIdx: number, name: string) => void
    export let onItemPointerOver: ((e: PointerEvent, option: DropdownOption) => void)
    export let onItemPointerLeave: ((e: PointerEvent, option: DropdownOption) => void)

    const { rightIcon, leftIcon, name } = option
</script>

<li 
    class="dmenu__option"
    class:dmenu__option--selected={typeof pickedItem === 'string' ? pickedItem.toLowerCase() === name.toLowerCase() : pickedItem === idx}
    data-optn-idx={idx}
    data-child-id={option.childId}
    on:pointerenter={(e) => {
        onItemPointerOver(e, option)
    }}
    on:pointerleave|self={(e) => {
        onItemPointerLeave(e, option)
    }}
>
    <button 
        class="dmenu__option-btn" 
        on:click={(e) => onOptionClicked(e, idx, name)}
    >
        {#if leftIcon}
            <DropdownOptionIcon dir="l" icon={leftIcon}/>
        {/if}
        <span class="dmenu__option-text">
            {name}
        </span>
        {#if option.childId}
            <DropdownOptionIcon dir="r" icon={{ type: "svg", icon: Icon.ChevronRight }}/>
        {:else if rightIcon || pickedItem}
            <DropdownOptionIcon dir="r" icon={rightIcon ?? { type: "check" }}/>
        {/if}
    </button>
</li>