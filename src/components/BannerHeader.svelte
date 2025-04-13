<script lang="ts">
	import { imageUpload } from "$lib/pop-ups";
	import { getYearEntryData } from "$lib/utils-goals"

    export let year: number = 0
    export let showIcon: boolean = true

    let yearData: { bannerImg: { src: string, center: number } | null, smallImg: string | null } = {
        bannerImg: null,
        smallImg: null
    }

    $: updateBanner(year)
    $: hasBannerImg = !!yearData.bannerImg

    let initDragY = -1
    let ogDragVal = 0
    
    function updateBanner(yr: number) {
        yearData = getYearEntryData(yr)
    }
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0) return
        
        const target = pe.target as HTMLElement
        target.setPointerCapture(pe.pointerId)
        
        initDragY = pe.clientY
        ogDragVal = yearData.bannerImg?.center || 50
    }
    
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0 || !yearData.bannerImg) return
        
        const offset = initDragY - pe.clientY
        const target = pe.target as HTMLImageElement
        const naturalHeight = target.naturalHeight 
        const percOffset = ((offset / naturalHeight) * 100) * 2.5
        
        yearData.bannerImg.center = Math.max(0, Math.min(ogDragVal + percOffset, 100))
    }
    
    function onDragEnd() {
        ogDragVal = 0
        initDragY = -1
    }
</script>

<div 
    class="banner-header"
    style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
>
    {#if yearData.bannerImg}
        {@const { src, center } = yearData.bannerImg}
        <div 
            class="banner-header__banner"
            on:pointerdown={dragDown}
            on:pointermove={onDrag}
            on:pointerup={onDragEnd}
        >
            <img 
                style:object-position={`center ${center}%`}
                src={src} 
                alt="page banner"
            />
        </div>
    {/if}
    
    {#if showIcon && yearData.smallImg}
        <button
            class="banner-header__icon"
            style:top={hasBannerImg ? "125px" : "0px"}
            on:click={() => {
                imageUpload.init({
                    onSubmitImg: (src) => {
                        if (yearData.smallImg) {
                            yearData.smallImg = src
                        }
                    }
                })
            }}
        >
            <img src={yearData.smallImg} alt="page icon">
        </button>
    {/if}
</div>

<style lang="scss">
    .banner-header {
        width: 100%;
        position: relative;
        
        &__banner {
            width: 100%;
            height: 210px;
            position: relative;
            overflow: hidden;
            margin-bottom: 10px;
            z-index: 0;
            
            img {
                border-radius: 3.5px;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        
        &__icon {
            @include square(110px, 4px);
            overflow: hidden;
            margin: 0px 0px 11px 0px;
            @include abs-top-left(0, var(--side-padding));

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        
        &__title {
            @include text-style(1, var(--fw-400-500), 2.8rem, "Geist Mono");
            margin: 0px 0px 8px 0px;
        }
    }
</style>