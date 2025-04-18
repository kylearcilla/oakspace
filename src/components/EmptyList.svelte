<script lang="ts">
	import { themeState } from "$lib/store"

    import Loader from "./Loader.svelte"
    
    export let loading = false
    export let emptyText = "Empty list"
    export let buttonText = "Add a Item"
    export let loadingText = "Loading"
    export let subtitle: string | undefined = undefined
    export let onButtonClick: (() => void) | undefined = undefined

    $: isLight = !$themeState.isDarkTheme

</script>

<div 
    class="empty-list"
    class:empty-list--light={isLight}
>
    {#if loading}
        <span>
            {loadingText}
        </span>
        <div class="empty-list__loading">
            <Loader visible={true} />
        </div>
    {:else}
        <span>
            {emptyText}
        </span>
        {#if subtitle}
            <span class="empty-list__subtitle">
                "{subtitle}"
            </span>
        {/if}
        {#if onButtonClick}
            <button on:click={onButtonClick}>
                {buttonText}
            </button>
        {/if}
    {/if}
</div>

<style lang="scss">
    .empty-list {
        text-align: center;
        width: 100%;

        --btn-bg-opacity: 0.055;
        --btn-opacity: 0.75;

        &--light {
            --btn-bg-opacity: 0.055;
            --btn-opacity: 1;
        }
        &--light &__txt span {
            @include text-style(0.9);
        }
        &--light &__txt button {
            @include text-style(1);
        }
        &--light button {
            opacity: 0.8;
        }
        &--light &__subtitle {
            opacity: 1 !important;
        }

        span {
            @include text-style(1, var(--fw-400-500), 1.225rem, "Geist Mono");
            opacity: 0.35;
            display: block;
        }
        button {
            opacity: var(--btn-opacity);
            margin-top: 15px;
            background-color: rgba(var(--textColor1), var(--btn-bg-opacity));
            padding: 7px 17px 8px 17px;
            border-radius: 4px;
            @include text-style(1, var(--fw-400-500), 1.14rem, "Geist Mono");
            
            &:hover {
                opacity: 1;
                background-color: rgba(var(--textColor1), calc(var(--btn-bg-opacity) * 1.5));
            }
        }
        &__subtitle {
            opacity: 1 !important;
            font-size: 1.2rem !important;
            margin: 12px 0px 10px 0px;
        }
        &__loading {
            position: relative;
            height: 20px;
            width: 20px;
            margin: 12px auto 0px auto;
        }
    }
</style>