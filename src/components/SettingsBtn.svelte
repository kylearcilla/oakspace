<script lang="ts">
	import { Icon } from "../lib/enums";
	import SvgIcon from "./SVGIcon.svelte";

    export let id: string
    export let options: {
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
    export let onClick: () => void
</script>

<button 
    {id}
    class="settings-btn"
    style:--fg-o={options?.opacity?.fg ?? 0.45}
    style:--bg-o={options?.opacity?.bg ?? 0.065}
    style:--fg-ho={options?.hOpacity?.fg ?? 0.25}
    style:--bg-ho={options?.hOpacity?.bg ?? 0}
    on:click={onClick}
>
    <SvgIcon 
        icon={Icon.Settings} 
        options={{ scale: 1.2 }}
    />
</button>

<style lang="scss">
    .settings-btn {
        @include center;
        @include circle(26px);
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