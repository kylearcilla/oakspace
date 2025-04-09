<script lang="ts">
	import { Icon } from "$lib/enums"
	import SvgIcon from "./SVGIcon.svelte"
	import { themeState } from "$lib/store"
	import { getSwatchColors } from "$lib/utils-colors"

    export let scale = 0.6
    export let tag: Tag | undefined = undefined

    $: isDark = $themeState.isDarkTheme
    $: darkTheme = $themeState.darkTheme
    $: defaultDark = isDark && darkTheme === "dark"

    let tagColors = tag ? getSwatchColors({ color: tag.symbol.color, light: !isDark, contrast: false}) : undefined
</script>

<div 
    class="complete" 
    class:complete--default-dark={defaultDark}
    style:transform={`scale(${scale})`}
    style:--bg-color={tagColors ? `rgba(${tagColors[0]}, 0.45)` : defaultDark ? "#333333" : "rgba(var(--fgColor1), 1)"}
>
    <i class="fa-solid fa-certificate">
    </i>
    <div class="complete__icon">
        {#if tagColors}
            <SvgIcon 
                icon={Icon.Check} 
                options={{
                    strokeWidth: 3.6,
                    color: `rgba(${tagColors[1]}, 1)`
                }}
            />
        {:else}
            <SvgIcon 
                icon={Icon.Check} 
                options={{
                    strokeWidth: 3.6,
                    color: defaultDark ? "white" : "rgba(var(--textColor2), 1)"
                }}
            />
        {/if}
    </div>
</div>


<style lang="scss">
    .complete {
        @include square(15px);
        @include center;
        position: relative;

        &__icon {
            position: absolute;
            top: calc(50%);
            left: calc(50%);
            transform: translate(-50%, -50%);
            opacity: 0.8;
        }
    }
    .fa-certificate {
        @include center;
        color: var(--bg-color);
        font-size: 2.5rem;
    }
</style>