<script lang="ts">
    export let progress: number = 0
    export let options: {
        size?: number
        strokeWidth?: number
        style?: "rich-colored" | "default" | "simple"
    } | undefined = undefined

    const size = options?.size ?? 14
    const strokeWidth = options?.strokeWidth ?? 2.5
    const style = options?.style ?? "default"

    const halfSize = size / 2
    const radius = (size - strokeWidth) / 2
    const circumference = radius * Math.PI * 2

    let fgColor = "rgba(var(--textColor1), 0.4)"
    let bgColor = "rgba(var(--textColor1), 0.05)"

    $: progress = Math.min(progress * 100, 100)
    $: if (style === "rich-colored") {
        const rval = Math.max(243 - ((243 - 125) * (progress / 100)), 125)
        fgColor    = `rgb(${rval}, 245, 125)`
    }
    else if (style === "simple") {
        fgColor = "rgba(var(--textColor1), 0.09)"
        bgColor = "none"
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
    <!-- Background Circle -->
    <circle
      class="bg"
      cx={halfSize}
      cy={halfSize}
      r={radius}
    />
  
    <!-- Foreground Circle (Progress) -->
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