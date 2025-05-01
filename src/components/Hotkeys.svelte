<script lang="ts">
	import { themeState } from "$lib/store"
	import { capitalize } from "$lib/utils-general"

    export let hotkeys: HotKeyCombo
    export let type: "dropdown" | "boxed" = "dropdown"


    $: light = !$themeState.isDarkTheme

    function isSingleKey(hotKey: string) {
        const specialKeys = ["meta", "up", "down", "plus"]

        if (specialKeys.includes(hotKey)) {
            return true
        }
        else if (hotKey.length === 1) {
            return true
        }
        return false
    }
</script>

<div 
    class="hot-keys" 
    class:hot-keys--boxed={type === "boxed"}
    class:hot-keys--light={light}
>
    {#each hotkeys as hotkey}
        {@const shiftSymbol = hotkey === "shift" && type === "dropdown"}
        <kbd 
            class={`hot-keys__key hot-keys__key--${hotkey}`}
            class:hot-keys__key--shift-symbol={shiftSymbol}
            class:hot-keys__key--single={isSingleKey(hotkey)}
        >
            {#if hotkey === "meta"}
                ⌘
            {:else if shiftSymbol}
                ⇧
            {:else if hotkey === "up"}
                ↑
            {:else if hotkey === "down"}
                ↓
            {:else if hotkey === "plus"}
                +
            {:else if hotkey === "delete" && type === "dropdown"}
                Del
            {:else}
                {capitalize(hotkey)}
            {/if}
        </kbd>
    {/each}
</div>

<style lang="scss">
    kbd {
        font-family: unset;
    }
    .hot-keys {
        gap: 3px;
        @include flex(center);

        --box-shadow: 1px 2px 0px 0px rgba(var(--textColor1), 0.00999);
        --plus-fz: 1.5rem;
        --meta-fz: 1.15rem;

        &--light {
            --box-shadow: 1px 2px 1px 0px rgba(var(--textColor1), 0.09);
        }
        &--boxed &__key {
            background-color: rgba(var(--textColor1), 0.04);
            box-shadow: var(--box-shadow);
            border-radius: 7px;
            width: auto;
            padding: 12px 9px 13px 9px;
            margin-right: 2px;
            @include text-style(0.85, var(--fw-400-500), 1.225rem);
        }
        &--boxed &__key--single {
            padding: 0px;
            @include square(25px, 7px);
        }
        &__key--shift-symbol {
            @include text-style(_, _, _, "system");
        }

        &__key {
            @include center;
            @include text-style(0.7, var(--fw-400-500), 1.1rem);
            height: 8px;
        }
        &__key--plus {
            font-size: var(--plus-fz);
        }
        &__key--meta {
            font-size: var(--meta-fz);
            margin-top: 0.5px;
        }
    }
</style>