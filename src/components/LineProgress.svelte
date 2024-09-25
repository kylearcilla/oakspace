<script lang="ts">
	import { onMount } from "svelte";

    export let options: {
        progress: number
        lineNumber?: number
        height?: number
        width?: number
    }

    let containerRef: HTMLElement

    const progress = options.progress
    const lineNumber = options.lineNumber ?? 30
    const height = options.height ?? "auto"
    const width = options.width ?? "auto"

    function paintLines() {
        const lines = containerRef.children as unknown as HTMLElement[]
        const count = Math.ceil(lineNumber * progress)

        for (let i = 0; i < count; i++) {
            lines[i]!.style.backgroundColor = 'rgba(var(--textColor1), 0.125)'
        }
    }

    onMount(() => {
        paintLines()
    })
</script>

<div    
    bind:this={containerRef}
    class="progress"
    style:height={height}
    style:width={width}
>
    {#each new Array(lineNumber) as _}
        <div class="progress__line">
        </div>
    {/each}
</div>

<style lang="scss">
    .progress {
        display: flex;

        &__line {
            height: 8px;
            border-radius: 10px;
            width: 2px;
            margin-right: 2px;
            background-color: rgba(var(--textColor1), 0.03);
        }
    }
</style>