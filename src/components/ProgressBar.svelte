<script lang="ts">
    export let progress: number
    
    let   fgColor = "rgba(255, 255, 255, 0.9)"
    const bgColor = "rgba(255, 255, 255, 0.1)"

    let slider: HTMLElement

    $: if (slider) {
        const rval = Math.max(200 - ((200 - 125) * (progress / 100)), 125)
        fgColor = `rgb(${rval}, 245, 125)`
        const bg = `linear-gradient(to right, ${fgColor} 0%, ${fgColor} ${progress * 100}%, ${bgColor} ${progress * 100}%, ${bgColor} 100%)`

        slider.style.background  = bg
    }
</script>

<div class="progress">
    <div class="progress__num">
        {Math.floor(progress * 100)}%
    </div>
    <div 
        bind:this={slider}
        class="progress__slider"
    >
    </div>
</div>

<style lang="scss">
    .progress {
        @include flex(center);
        &__num {
            @include text-style(0.2, 400, 1.12rem, "DM Sans");
            margin-right: 12px;
            display: none;
        }
        &__slider {
            width: 50px;
            height: 3px;
            border-radius: 2px;
        }
    }
</style>
