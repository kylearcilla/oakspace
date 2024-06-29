<script lang="ts">
	import { themeState } from "$lib/store"
    import { inlineStyling } from "$lib/utils-general"

    export let title = "Save"
    export let isLoading: boolean
    export let disabled: boolean
    export let actionFunc: AsyncFunc
    export let styling: StylingOptions | undefined = undefined

    $: isLight = !$themeState.isDarkTheme

    async function _actionFunc() {
        if (isLoading) return
        await actionFunc()
    }
</script>

<button 
    type="submit"
    class="async-btn" 
    class:async-btn--loading={isLoading}
    class:async-btn--light={isLight}
    style={inlineStyling(styling)}
    disabled={isLoading || disabled}
    on:click={_actionFunc}
>
    {#if isLoading}
        <div 
            class="async-btn__dots loading-dots"
            style:--dots-color={isLight ? "var(--modalBgColor)" : "white"}
        >
            <span></span>
            <span></span>
            <span></span>
        </div>
    {:else}
        {title}
    {/if}
</button>

<style lang="scss">
    .async-btn {
        height: 39px;
        width: 94px;
        position: relative;
        border-radius: 15px;
        background-color: rgba(var(--fgColor1));
        @include center;
        @include text-style(1, 500, 1.28rem);
        
        &--light {
            color: var(--modalBgColor) !important;
        }

        &--loading {
            opacity: 0.8 !important;
        }
        &--loading:hover {
            filter: brightness(1) !important;
        }
        &:hover {
            filter: brightness(1.1);
        }

        &__dots {
            @include abs-top-left(50%, 50%);
        }
    }
</style>