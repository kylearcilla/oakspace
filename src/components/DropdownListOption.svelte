<script lang="ts">
	import DropdownOptionIcon from "./DropdownOptionIcon.svelte"

    export let option: DropdownOption
    export let idx: number
    export let pickedItem: string | number | undefined
    export let onOptionClicked: (e: Event, optnIdx: number, name: string) => void
    export let onOptionPointerLeave: ((e: PointerEvent, option: DropdownOption) => void) | undefined = undefined

    const { rightIcon, leftIcon, name } = option
</script>

<li 
    class="dmenu__option"
    class:dmenu__option--selected={pickedItem === name || pickedItem === idx}
    data-optn-idx={idx}
    on:pointerenter={option.onPointerOver}
    on:pointerleave={(e) => {
        if (onOptionPointerLeave) {
            onOptionPointerLeave(e, option)
        }
    }}
>
    <button 
        class="dmenu__option-btn" 
        on:click={(e) => onOptionClicked(e, idx, name)}
    >
        {#if leftIcon}
            <DropdownOptionIcon 
                left={true}
                icon={leftIcon}
            />
        {/if}
        <span class="dmenu__option-text">
            {name}
        </span>
        {#if rightIcon || pickedItem}
            <DropdownOptionIcon 
                left={false}
                icon={rightIcon ?? { type: "check" }}
            />
        {/if}
    </button>
</li>