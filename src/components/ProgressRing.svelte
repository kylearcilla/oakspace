<script lang="ts">
	import { themeState } from "../lib/store";
    import { DARK_COLOR_PROGRESS, LIGHT_COLOR_PROGRESS } from "../lib/utils-colors"

    export let progress: number = 0
    export let options: ProgressRingOptions | undefined = undefined

    const { size = 14, strokeWidth = 2.5, style = "default" } = options
    const halfSize = size / 2
    const radius = (size - strokeWidth) / 2
    const circumference = radius * Math.PI * 2

    let fgColor = "", bgColor = ""

    $: progress = Math.min(progress * 100, 100)
    $: updateColor(progress)

    themeState.subscribe(() => updateColor(progress))

    function updateColor(progress: number) {
        const { isDarkTheme, lightTheme } = $themeState
        const isLight = !isDarkTheme
        const progressColor = isLight ? LIGHT_COLOR_PROGRESS : DARK_COLOR_PROGRESS
        const isTerracotta = lightTheme === "terracotta" && isLight
        const { max, min, gVal, bVal } = progressColor

        // colored progress for terracotta creates too low contrast
        if (style === "colored" && !isTerracotta) {
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
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    style:--fg-color={fgColor}
    style:--bg-color={bgColor}
    style:--size={size}
    style:--stroke-width={strokeWidth}
  >
    <circle
      class="bg"
      cx={halfSize}
      cy={halfSize}
      r={radius}
    />
    <circle
        class="fg"
        style:opacity={progress === 0 ? 0 : 1}
        cx={halfSize}
        cy={halfSize}
        r={radius}
        stroke-dasharray={`${dash(progress)} ${circumference - dash(progress)}`}
    />
  </svg>
  
<style lang="scss">
    .circular-progress {
        --half-size: calc(var(--size) / 2);

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
        }
    }
</style>