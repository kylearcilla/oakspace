<script lang="ts">
    export let light: boolean
    export let width: string
    export let height = "20px"
    export let borderRadius = 5
    export let margin = "0px"

    const SHINE_WIDTH = "120px"

</script>

<div 
    class="elem"
    class:dark-shine={!light}
    class:light-shine={light}
    style:width={width}
    style:height={height}
    style:border-radius={`${borderRadius}px`}
    style:margin={margin}
    style:--shine-box-width={width}
    style:--shine-width={SHINE_WIDTH}
>
</div>  

<style lang="scss">
    $skeleton-bg-color-dark: rgba(50, 50, 50, 0.12) !important;
    $skeleton-bg-color-light: rgba(100, 100, 100, 0.05) !important;

    .elem {
        position: relative;
        overflow: hidden;

        &:before {
            content:'';
            transform: skewX(-45deg);
            position: absolute;
            left: calc(-1 * (calc(var(--shine-box-width) / 2) + var(--shine-width))); 
            width: var(--shine-width);
            height: 100%;
            animation: shine 1s infinite;
        }
    }
    .dark-shine {
        background-color: $skeleton-bg-color-dark;
        &:before {
            background-image: linear-gradient(
                90deg, 
                rgba(50, 50, 50, 0) 0px, 
                rgba(50, 50, 50, 0.15) calc(var(--shine-width) / 2),
                rgba(50, 50, 50, 0) var(--shine-width)
            );
        }
    }
    .light-shine {
        background-color: $skeleton-bg-color-light;
        &:before {
            background-image: linear-gradient(
                90deg, 
                rgba(50, 50, 50, 0) 0px, 
                rgba(157, 157, 157, 0.1) calc(var(--shine-width) / 2),
                rgba(50, 50, 50, 0) var(--shine-width)
            );  
        }
    }
    @keyframes shine {
        0% {
            left: calc(-1 * var(--shine-box-width) / 2 - var(--shine-width));
        }
        100% {
            left: calc(1.5 * var(--shine-box-width));
        }
    }
</style>