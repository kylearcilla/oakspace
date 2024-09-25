<script lang="ts">
    import { Icon, ModalType } from "$lib/enums"
	import { handleChooseVideo } from "$lib/utils-youtube"
	import { globalContext, ytPlayerStore } from "$lib/store"
	import { SPACES, POPULAR_SPACES } from "$lib/data-spaces"
	import { closeModal, updateAmbience } from "$lib/utils-home"
	import { getMaskedGradientStyle } from "$lib/utils-general"
    
	import { onMount } from "svelte"
	import Modal from "../components/Modal.svelte"
	import SvgIcon from "../components/SVGIcon.svelte"

    $: ambience = $globalContext.ambience
    $: isoVideo = $ytPlayerStore?.isoVideo

    let chosenGroup = POPULAR_SPACES
    let chosenGroupIdx = -1
    let chosenItem: AmbientSpace | null = $globalContext.ambience?.space ?? null
    let clickedItem: AmbientSpace | null = null
    
    let carouselRef: HTMLElement
    let carouselGradient = ""
    let carouselLeftArrow = false
    let carouselRightArrow = false

    const TAB_SCROLL_STEP = 50
    const WALLPAPER_SCROLL_STEP = 350

    const CATEGORIES = [
        "Lofi",
        "Nature",
        "Worlds",
        "Weather",
        "City",
        "Space / Sci-Fi"
    ]

    function onTabClicked(groupIdx: number) {
        if (groupIdx < 0) {
            chosenGroup = POPULAR_SPACES
        }
        else {
            const chosen   = CATEGORIES[groupIdx]
            const groupKey = chosen === "Space / Sci-Fi" ? "space" : chosen.toLowerCase() as keyof typeof SPACES
            chosenGroup    = SPACES[groupKey]
        }
        
        chosenGroupIdx = groupIdx
        requestAnimationFrame(() => handleCarouselScroll(carouselRef))
    }
    function onItemClicked(space: AmbientSpace) {
        clickedItem = space
    }
    async function onItemChoose() {
        const { type, sourceId } = clickedItem!
        const fromVidToWallpaper = ambience?.space.type === "video" && type === "wallpaper"

        if (type === "video" && (await handleChooseVideo(sourceId))) {
            updateAmbience({ space: clickedItem! })
        }
        else if (type === "wallpaper") {
            updateAmbience({ space: clickedItem! })
        }

        if (fromVidToWallpaper)  {
            $ytPlayerStore?.backToPlaylist()
        }
    }
    function handleCarouselScroll(carouselRef: HTMLElement) {
        const { styling, scrollStatus } = getMaskedGradientStyle(carouselRef, {
           isVertical: false 
        }) as HozScrollMaskedGradient

        carouselGradient = styling
        carouselRightArrow = !scrollStatus.hasReachedEnd
        carouselLeftArrow = !scrollStatus.hasReachedStart
    }
    onMount(() => {
        handleCarouselScroll(carouselRef)
    })

</script>

<Modal 
    options={{ borderRadius: "15px" }} 
    onClickOutSide={() => closeModal(ModalType.Spaces)}
>
    <div class="spaces modal__content">
        <h1>Ambient Spaces</h1>
        <div class="spaces__tabs">
            <button 
                on:click={() => onTabClicked(-1)}
                class="tab-btn"
                class:tab-btn--selected={chosenGroupIdx === -1}
            >
                Popular
            </button>
            <div class="divider"></div>
            <div class="spaces__tabs-carousel scroll-bar-hidden">
                {#each CATEGORIES as category, groupIdx}
                    <button 
                        on:click={() => onTabClicked(groupIdx)}
                        class="tab-btn"
                        class:tab-btn--selected={groupIdx === chosenGroupIdx}
                    >
                        {category}
                    </button>
                {/each}
            </div>
        </div>
        {#if chosenGroup.wallpapers.length > 0}
            <div class="spaces__type">
                Wallpapers
            </div>
            <div class="spaces__content-carousel-container">
                {#if carouselLeftArrow}
                    <button 
                        class="spaces__arrow"
                        on:click={() => {
                            carouselRef.scrollLeft -= WALLPAPER_SCROLL_STEP
                        }}
                    >
                        <SvgIcon icon={Icon.ChevronLeft}/>
                    </button>
                {/if}
                <div 
                    bind:this={carouselRef}
                    on:scroll={() => handleCarouselScroll(carouselRef)}
                    class="spaces__content-carousel scroll-bar-hidden"
                    style={carouselGradient}
                >
                    {#each chosenGroup.wallpapers as item}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            on:click={() => onItemClicked(item)}
                            role='button'
                            tabindex="0"
                            title={`${item.title} - ${item.subtitle}`}
                            class="spaces__content-item smooth-bounce"
                            class:spaces__content-item--selected={(!clickedItem && chosenItem?.sourceId === item.sourceId) || clickedItem?.sourceId === item.sourceId}
                        >
                            <div class="spaces__content-item-img">
                                <img src={item.thumbnail} alt="space">
                            </div>
                            <div class="spaces__content-item-details">
                                <div class="spaces__content-item-title">
                                    {item.title}
                                </div>
                                <div class="spaces__content-item-subtitle">
                                    {item.subtitle}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                {#if carouselRightArrow}
                    <button 
                        class="spaces__arrow spaces__arrow--right"
                        on:click={() => {
                            carouselRef.scrollLeft += WALLPAPER_SCROLL_STEP
                        }}
                    >
                        <SvgIcon icon={Icon.ChevronRight}/>
                    </button>
                {/if}
            </div>
        {/if}
        <div class="spaces__type">
            Videos
        </div>
        <div 
            class="spaces__content-grid"
            class:spaces__content-grid--no-wallpapers={chosenGroup.wallpapers.length === 0}
        >
            {#each chosenGroup.videos as item}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div 
                    on:click={() => onItemClicked(item)}
                    role='button'
                    tabindex="0"
                    title={`${item.title} - ${item.subtitle}`}
                    class="spaces__content-item spaces__content-item--vid smooth-bounce"
                    class:spaces__content-item--selected={(!clickedItem && isoVideo && chosenItem?.sourceId === item.sourceId) || clickedItem?.sourceId === item.sourceId}
                >
                    <div class="spaces__content-item-img">
                        <img src={item.thumbnail} alt="space">
                    </div>
                    <div class="spaces__content-item-details">
                        <div class="spaces__content-item-title">
                            {item.title}
                        </div>
                        <div class="spaces__content-item-subtitle">
                            {item.subtitle}
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        {#if clickedItem && clickedItem.sourceId != chosenItem?.sourceId}
            <button class="spaces__choose-btn" on:click={onItemChoose}>
                Choose
            </button>
        {/if}
    </div>
</Modal>

<style lang="scss">
    .spaces {
        height: 720px;
        width: 550px;
        padding: 16px 0px 0px 25px;
        overflow: hidden;
        position: relative;

        h1 {
            @include text-style(1, 500, 1.6rem);
            margin-bottom: 10px;
        }
        &__arrow {
            @include abs-top-left(35px, -20px);
            @include circle(25px);
            @include center;
            z-index: 2;
            opacity: 0.25;
            
            &:hover {
                opacity: 0.85;
            }
            &:active {
                transform: scale(0.95);
            }
            &--right {
                left: unset;
                @include abs-top-right(35px, 0px);
            }
        }
        &__tabs {
            @include flex(center);
            position: relative;
            margin: 0px 0px 16px -4px;

            .divider {
                margin: 7px 9px;
                @include divider(0.1, 15px, 1px);
            }
        }
        &__tabs &__arrow {
            @include abs-top-left(2px, 80px);
        }
        &__tabs &__arrow--right {
            left: unset;
            @include abs-top-right(2px, 5px);
        }
        &__tabs-carousel {
            @include flex(center);
            overflow: scroll;
            scroll-behavior: smooth;
        }
        &__content-header {
            margin: 16px 0px 17px 0px;
            padding-right: 25px;
            @include flex(center, space-between);

            h4 {
                @include text-style(0.4, 400, 1.32rem);
            }
        }
        &__type {
            @include text-style(0.4, 400, 1.1785rem, "DM Mono");
            margin-bottom: 12px;
        }
        &__content-carousel-container {
            position: relative;
        }
        &__content-carousel {
            padding-top: 2px;
            @include flex(center);
            overflow-x: scroll;
            margin-bottom: 24px;
            padding-left: 4px;
            position: relative;
            scroll-behavior: smooth
        }
        &__content-grid {
            display: flex;
            flex-wrap: wrap;
            row-gap: 18px;
            overflow-y: scroll;
            max-height: calc(100% - 285px);
            padding: 2px 0px 20px 2px;

            &--no-wallpapers {
                max-height: calc(100% - 125px);
            }
        }
        &__content-item {
            min-width: 110px;
            width: 110px;
            cursor: pointer;
            margin-right: 14px;

            &:active {
                transform: scale(0.998);
            }
            &--selected &-img {
                box-shadow: rgba(white, 1) 0px 0px 0px 2px;   
            }
            &--vid {
                width: 155px;
                margin-right: 18px;
            }
        }
        &__content-item-img {
            aspect-ratio: (16 / 9);
            border-radius: 6px;
            overflow: hidden;
        }
        &__content-item img {
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        &__content-item-details {
            margin-top: 8px;
        }
        &__content-item-title {
            @include text-style(0.85, 500, 1.12rem);
            @include elipses-overflow;
            margin-bottom: 2px;
        }
        &__content-item-subtitle {
            @include elipses-overflow;
            @include text-style(0.4, 500, 1.1rem);
        }
        &__choose-btn {
            @include abs-bottom-right(18px, 18px);
            @include text-style(1, 500, 1.3rem, "DM Mono");
            background: var(--hoverColor2);
            padding: 6px 20px 7px 20px;
            border-radius: 15px;
        }
    }    
</style>