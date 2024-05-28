<script lang="ts">
	import { capitalizeString, isAlphaNumeric } from "$lib/utils-general";

    type HotKeyStyling = {
        opacity?: number
        fontSize?: CSSPxVal | CSSREMVal
        gap?: CSSPxVal
        symbolWidth?: CSSPxVal | "auto"
    }

    const DEFAULT_STYLING: HotKeyStyling = {
        opacity: 0.3,
        fontSize: "0.98rem",
        gap: "3px",
        symbolWidth: "auto"
    }

    export let hotkeys: HotKeyCombo
    export let styling: HotKeyStyling = {}

    let _styling: HotKeyStyling = {
      opacity     : styling?.opacity ?? DEFAULT_STYLING.opacity,
      fontSize    : styling?.fontSize ?? DEFAULT_STYLING.fontSize,
      gap         : styling?.gap ?? DEFAULT_STYLING.gap,
      symbolWidth : styling?.symbolWidth ?? DEFAULT_STYLING.symbolWidth
    }

    function isNonSymbolHotKey(hotKey: string) {
        if (["meta", "ctrl"].includes(hotKey)) {
            return true
        }
        else if (hotKey.length > 1) {
            return false
        }
        else {
            return isAlphaNumeric(hotKey)
        }
    }
</script>

<div class="hot-keys">
    {#each hotkeys as hotkey}
        {@const isNonSymbol = isNonSymbolHotKey(hotkey)}
        <div 
            class={`hot-keys__key hot-keys__key--${hotkey}`}
            class:hot-keys__key--symbol={!isNonSymbol}
            style:--opacity={_styling.opacity}
            style:--font-size={_styling.fontSize}
            style:--gap={_styling.gap}
            style:--symbol-width={_styling.symbolWidth}
        >
            {#if hotkey === "meta"}
                ⌘
            {:else if hotkey === "shift"}
                ⇧
            {:else if hotkey === "up"}
                <i class="fa-solid fa-up-long"></i>
            {:else if hotkey === "down"}
                <i class="fa-solid fa-down-long"></i>
            {:else if hotkey === "plus"}
                <i class="fa-solid fa-plus"></i>
            {:else if hotkey === "delete"}
                <i class="fa-solid fa-delete-left"></i>
            {:else if hotkey === "delete"}
                <i class="fa-solid fa-delete-left"></i>
            {:else if hotkey === "delete"}
                <i class="fa-solid fa-delete-left"></i>
            {:else if hotkey === "shift"}
                <i class="fa-solid fa-up-long"></i>
            {:else}
                {capitalizeString(hotkey)}
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
    .hot-keys {
        display: flex;

        &__key {
            @include center;
            font-family: "DM Mono";
            opacity: var(--opacity);
            font-size: var(--font-size);

            &:not(:last-child) {
                margin-right: var(--gap);
            }
        }
        &__key--meta {
            font-size: calc(var(--font-size) + 0.2rem);
            margin-top: 0.5px;
        }
        &__key--symbol {
            width: var(--symbol-width);
            font-size: calc(var(--font-size) + 0rem);
        }
    }
</style>