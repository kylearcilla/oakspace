<script lang="ts">
	import { themeState } from "$lib/store";
	import { Icon } from "../lib/enums";

	import SvgIcon from "./SVGIcon.svelte"

    export let id: string
    export let options: {
        position?: CSSAbsPos
        bg?: boolean
        opacity?: {
            fg?: number
            bg?: number
        }
        hOpacity?: {
            fg?: number
            bg?: number
        }
    } | undefined = undefined

    let { position, opacity, hOpacity, bg = true } = options ?? {}

    $: light = !$themeState.isDarkTheme

    export let onClick: (e: MouseEvent) => void
</script>

<button 
    data-dmenu-id={id}
    class="settings-btn"
    class:settings-btn--light={light}
    class:settings-btn--abs={!!position}
    class:settings-btn--no-bg={!bg}
    style:--fg-o={(opacity?.fg ?? 0.3)}
    style:--bg-o={opacity?.bg ?? 0}
    style:--fg-ho={hOpacity?.fg ?? 0.55}
    style:--bg-ho={hOpacity?.bg ??  0.085}
    style:top={position?.top}
    style:left={position?.left}
    style:right={position?.right}
    style:bottom={position?.bottom}
    on:click={onClick}
>
    <SvgIcon 
        icon={Icon.Settings} 
        options={{ scale: 1.15 }}
    />
</button>

<style lang="scss">
    .settings-btn {
        @include center;
        @include circle(24px);

        &--abs {
            position: absolute;
        }
        &--no-bg {
            background-color: transparent !important;
        }

        opacity: var(--fg-o);
        background-color: rgba(var(--textColor1), var(--bg-o));

        &:disabled {
            opacity: 0.25 !important;
        }
        &:hover {
            opacity: var(--fg-ho);
            background-color: rgba(var(--textColor1), var(--bg-ho));
        }
    }
</style>