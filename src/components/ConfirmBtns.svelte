<script lang="ts">
	import { themeState } from "$lib/store"
    import { inlineStyling } from "$lib/utils-general"

    export let confirmText = "Save"
    export let cancelText = "Cancel"
    export let isLoading = false
    export let weakDisable = false
    export let disabled = false
    export let onCancel: () => void
    export let onOk: () => Promise<void>

    $: isLight = !$themeState.isDarkTheme

    async function _actionFunc() {
        if (isLoading) return
        await onOk()
    }
</script>

<div 
    class="confirm-btns"
    class:confirm-btns--light={isLight}
>
    <button 
        class="confirm-btns__cancel" 
        on:click={onCancel}
    >
        {cancelText}
    </button>
    <button 
        type="submit"
        class="confirm-btns__ok" 
        class:confirm-btns__ok--loading={isLoading}
        class:confirm-btns__ok--weak-disabled={weakDisable && disabled}
        style={inlineStyling({
            borderRadius: "9px",
            fontSize: "1.4rem",
            padding: "11px 25px",
            height: "18.5px"
        })}
        disabled={(!weakDisable && disabled) || isLoading}
        on:click={_actionFunc}
    >
        {#if isLoading}
            <div 
                class="confirm-btns__ok-dots loading-dots"
                style:--dots-color={isLight ? "var(--modalBgColor)" : "white"}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
        {:else}
            {confirmText}
        {/if}
    </button>
</div>

<style lang="scss">
    .confirm-btns {
        @include flex(center);
        width: 100%;
        --cancel-btn-opacity: 0.025;

        &--light {
            --cancel-btn-opacity: 0.065;
        }
        &--light &__ok {
            color: var(--modalBgColor) !important;
        }
        button {
            height: 39px;
            padding: 0px 25px;
            @include text-style(0.55, var(--fw-400-500), 1.3rem);
            @include center;
        }
        &__cancel {
            width: 35%;
            margin-right: 8px;
            border-radius: 9px;
            @include center;
            background: rgba(var(--textColor1), var(--cancel-btn-opacity));

            &:hover {
                background: rgba(var(--textColor1), calc(var(--cancel-btn-opacity) + 0.035));
            }
        }
        &__ok {
            width: calc(100% - 35% - 8px);
            position: relative;
            border-radius: 15px;
            background-color: rgba(var(--fgColor1));
            color: white !important;
            
            &--loading {
                opacity: 0.8 !important;
            }
            &--loading:hover {
                filter: brightness(1) !important;
            }
            &--weak-disabled {
                opacity: 0.3 !important;
            }
            &:hover {
                filter: brightness(1.1);
            }
        }
        &__ok-dots {
            @include abs-top-left(50%, 50%);
        }
    }
</style>