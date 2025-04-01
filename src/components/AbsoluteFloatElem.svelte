<script lang="ts">
    import BounceFade from "./BounceFade.svelte"
	import { absoluteDropdown } from "$lib/pop-ups"
	import DropdownContent from "./DropdownContent.svelte"

    const { state, close } = absoluteDropdown

    $: position =  $state.position
    $: component =  $state.component
    $: props =  $state.props
    $: isHidden =  $state.isHidden
</script>

<BounceFade 
    zIndex={10000}
    isHidden={isHidden}
    onClickOutside={() => close()}
    position={{
        top: `${position.top - 5}px`,
        left: `${position.left - 5}px`
    }}
>
    {#if props}
        <svelte:component this={component} {...props} />
    {/if}
</BounceFade>

<style lang="scss">
</style>