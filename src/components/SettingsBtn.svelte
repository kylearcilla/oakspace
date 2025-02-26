<script lang="ts">
	import { Icon } from "../lib/enums";
	import SvgIcon from "./SVGIcon.svelte";

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

    let { position, opacity, hOpacity } = options ?? {}

    export let onClick: () => void
</script>

<button 
    id={`${id}--dbtn`}
    class="settings-btn"
    class:settings-btn--abs={!!position}
    style:--fg-o={opacity?.fg ?? 0.45}
    style:--bg-o={opacity?.bg ?? 0.065}
    style:--fg-ho={hOpacity?.fg ?? 0.45}
    style:--bg-ho={hOpacity?.bg ?? 0.185}
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
        opacity: var(--fg-o);
        background-color: rgba(var(--textColor1), var(--bg-o));

        &--abs {
            position: absolute;
        }

        &:disabled {
            opacity: 0.25 !important;
        }
        &:hover {
            opacity: var(--fg-ho);
            background-color: rgba(var(--textColor1), var(--bg-ho));
        }
    }
</style>