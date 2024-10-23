<script lang="ts">
    export let progress: number = 0
    export let size: number = 13
    export let strokeWidth: number = 2.5
  
    const halfSize = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI * 2;

    console.log({ progress })

    $: progress = progress * 100
    $: rval = Math.max(243 - ((243 - 125) * (progress / 100)), 125)
  
    const dash = (progress: number) => (progress * circumference) / 100
  </script>
  
  <svg
    class="circular-progress"
    style:--fg-color={`${rval}, 245, 125`}
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
            stroke: rgba(var(--textColor1), 0.05);
        }

        circle.fg {
            transform: rotate(-90deg);
            transform-origin: var(--half-size) var(--half-size);
            stroke: rgb(var(--fg-color));
            transition: 0.3s cubic-bezier(.4, 0, .2, 1);

            &__hide {
                opacity: 0;
            }
        }
    }
</style>