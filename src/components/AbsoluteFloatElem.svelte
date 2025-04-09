<script lang="ts">
    import BounceFade from "./BounceFade.svelte"
	import { absoluteElem } from "$lib/pop-ups"

    const { state, close, onDismount } = absoluteElem
</script>

{#each $state as floatElem (floatElem.id)}
    <BounceFade 
        dmenuId={floatElem.id}
        zIndex={10000}
        isHidden={floatElem.isHidden}
        onClickOutside={() => {
            close(floatElem.id)
            floatElem.onClose()
        }}
        onDismount={() => {
            onDismount(floatElem.bounceId)
        }}
        position={{
            top: `${floatElem.position.top - 5}px`,
            left: `${floatElem.position.left - 5}px`
        }}
    >
        {#if floatElem.props}
            <svelte:component this={floatElem.component} {...floatElem.props} />
        {/if}
    </BounceFade>
{/each}

<style lang="scss">
</style>