<script lang="ts">
	import { capitalizeString, isAlphaNumeric } from "$lib/utils-general";
    export let hotkeys: HotKeyCombo

    function isSymbolKey(hotKey: string) {
        return !isAlphaNumeric(hotKey)
    }
</script>

<div class="hot-keys">
    {#each hotkeys as hotkey}
        <kbd class={`hot-keys__key hot-keys__key--${hotkey}`}>
            {#if hotkey === "meta"}
                ⌘
            {:else if hotkey === "shift"}
                ⇧
            {:else if hotkey === "up"}
                ↑
            {:else if hotkey === "down"}
                ↓
            {:else if hotkey === "plus"}
                +
            {:else if hotkey === "delete"}
                ⌫
            {:else if hotkey === "ctrl"}
                ⌃
            {:else}
                {capitalizeString(hotkey)}
            {/if}
        </kbd>
    {/each}
</div>

<style lang="scss">
    .hot-keys {
        @include flex(center);

        &__key {
            @include center;
            font-family: "DM Sans";
            opacity: 0.5;
            height: 8px;
            width: 12px;
            min-width: 12px;
            font-size: 1.1rem;
        }
        &__key--delete {
            font-size: 0.95rem !important;
        }
        &__key--plus {
            font-family: "Manrope";
            font-size: 1.5rem !important;
        }
        &__key--meta {
            font-size: 1.15rem;
            margin-top: 0.5px;
        }
    }
</style>