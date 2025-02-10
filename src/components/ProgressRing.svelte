<script lang="ts">
	import { themeState } from "../lib/store";
    import { DARK_COLOR_PROGRESS, LIGHT_COLOR_PROGRESS } from "../lib/utils-colors"

    export let progress: number = 0
    export let options: {
        size?: number
        strokeWidth?: number
        style?: "rich-colored" | "default" | "simple" | "light"
    } | undefined = undefined

    const size = options?.size ?? 14
    const strokeWidth = options?.strokeWidth ?? 2.5
    const style = options?.style ?? "default"

    const halfSize = size / 2
    const radius = (size - strokeWidth) / 2
    const circumference = radius * Math.PI * 2

    let fgColor = "", bgColor = ""

    $: isLight = !$themeState.isDarkTheme
    $: progress = Math.min(progress * 100, 100)
    $: updateColor(progress)

    themeState.subscribe(() => updateColor(progress))

    function updateColor(progress: number) {
        const { isDarkTheme, lightTheme } = $themeState
        const isLight = !isDarkTheme
        const settings = isLight ? LIGHT_COLOR_PROGRESS : DARK_COLOR_PROGRESS
        const { max, min, gVal, bVal } = settings
        const isTerracotta = lightTheme === "terracotta" && isLight

        if (style === "rich-colored" && !isTerracotta) {
            const rval = Math.max(max - ((max - min) * (progress / 100)), min)
            fgColor    = `rgb(${rval}, ${gVal}, ${bVal})`
            bgColor    = `rgba(var(--textColor1), ${isLight ? 0.1 : 0.05})`
        }
        else {
            const bgOpacity = isLight ? 0.1 : 0.04
            const usefgColor = isLight && lightTheme != "light"
            const opacity = isLight ? 0.45 : 0.25

            fgColor = usefgColor ? "var(--elemColor1)" : `rgba(var(--textColor1), ${opacity})`
            bgColor = `rgba(var(--textColor1), ${bgOpacity})`
        }
    }
  
    const dash = (progress: number) => (progress * circumference) / 100
  </script>
  
  <svg
    class="circular-progress"
    style:--fg-color={fgColor}
    style:--bg-color={bgColor}
    style:--size={size}
    style:--stroke-width={strokeWidth}
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
  >
    <circle
      class="bg"
      cx={halfSize}
      cy={halfSize}
      r={radius}
    />
    <circle
        class="fg"
        class:fg__hide={progress === 0}
        cx={halfSize}
        cy={halfSize}
        r={radius}
        stroke-dasharray={`${dash(progress)} ${circumference - dash(progress)}`}
    />
  </svg>
  
<style lang="scss">
    .circular-progress {
        --half-size: calc(var(--size) / 2);

        // SVG Circle Styling
        circle {
            stroke-width: var(--stroke-width);
            fill: none;
            stroke-linecap: round;
        }

        circle.bg {
            stroke: var(--bg-color);
        }

        circle.fg {
            transform: rotate(-90deg);
            transform-origin: var(--half-size) var(--half-size);
            stroke: var(--fg-color);
            transition: 0.3s cubic-bezier(.4, 0, .2, 1);

            &__hide {
                opacity: 0;
            }
        }
    }
</style>