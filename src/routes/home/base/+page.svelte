<script lang="ts">    
	import { themeState } from "../../../lib/store"
	import { clamp } from "../../../lib/utils-general"

	import YearView from "./YearView.svelte"
	import MonthView from "./MonthView.svelte"
	import LeftMargin from "./LeftMargin.svelte";
	import Header from "./Header.svelte";

    const SMALLER_WIDTH = 630
    const SMALL_WIDTH = 1000

    $: isLight = !$themeState.isDarkTheme

    let width = 0
    let leftHt = 0
    let initDragY = -1
    let ogDragVal = 0

    let bannerImg: Banner = {
        src: "https://i.imgur.com/MEjZkXW.png",
        center: 50
    }
    let options: BaseOptions = {
        view: "month",
        banner: true,
        margin: true
    }
    let header: BaseHeader = {
        icon: {
            src: "https://i.pinimg.com/736x/b3/90/0d/b3900d7712279767b687231f36fad8a0.jpg",
            type: "img",
            show: true
        },
        showText: true,
        pos: "top"
    }

    /* ui */
    function onBaseEvent({ detail }: BaseEventDetail) {
        const { context, payload } = detail
        if (context === "banner") {
            bannerImg = payload
        } 
        else if (context === "options") {
            options = payload
        }
        else if (context === "header") {
            header = payload
        }
    }

    /* drag */
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0) {
            return
        }
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = bannerImg.center
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) {
            return
        }
        const offset = initDragY - pe.clientY
        const target = pe.target as HTMLImageElement
        const naturalHeight = target.naturalHeight 
        const percOffset = ((offset / naturalHeight) * 100) * 2.5

        bannerImg.center = clamp(0, ogDragVal + percOffset, 100)
        bannerImg = bannerImg
    }
    function onDragEnd() {
        ogDragVal = 0
        initDragY = -1
    }
</script>

<div 
    bind:clientWidth={width}
    class={`base base--${options.view}`}
    class:base--no-margin={!options.margin}
    class:base--no-banner={!options.banner}
    class:base--light={isLight}
    class:base--small={width <= SMALL_WIDTH}
    class:base--right-bar-flex={SMALLER_WIDTH < width && width <= SMALL_WIDTH}
    style:--month-img-ht={"261px"}
    style:--left-ht={`${leftHt}px`}
    style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
>   
    {#if options.banner}
        <div 
            class="base__banner"
            on:pointerdown={dragDown}
            on:pointermove={onDrag}
            on:pointerup={onDragEnd}
        >
            <img 
                style:object-position={`center ${bannerImg.center}%`}
                src={bannerImg.src} 
                alt="banner"
            >
        </div>
    {/if}
    <div class="base__content">
        {#if header.pos === "top"}
            <div class="base__top-header">
                <Header 
                    {bannerImg} 
                    {options} 
                    {header}
                    on:base={onBaseEvent}
                />
            </div>
        {/if}
        <div class="base__content-flx">
            {#if options.margin}
                <div class="base__left" bind:clientHeight={leftHt}>
                    <LeftMargin fullWidth={width <= SMALL_WIDTH} />
                </div>
            {/if}
            <div class="base__right">
                {#if header.pos === "side"}
                    <div class="base__overview-header">
                        <Header 
                            {bannerImg} 
                            {options} 
                            {header}
                            on:base={onBaseEvent}
                        />
                    </div>
                {/if}
                <div class="base__month-insight">
                    <MonthView/>
                    {#if width <= SMALL_WIDTH}
                        <div class="divider" style:margin="25px 0px 10px 0px"></div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .base {
        width: 100%;
        margin-top: 0px;
        overflow-x: hidden;
        overflow-y: scroll;
        height: calc(100% - 20px);

        /* light */
        &--light h1 {
            font-weight: 600 !important;
        }
        &--light &__context-header {
            @include text-style(0.95, 600);
        }
        &--light .divider {
            @include l-div
        }

        /* small */
        &--small &__content-flx {
            display: flex;
            flex-direction: column-reverse;
        }
        &--small &__left {
            width: 100%;
            padding-right: 0px;
            display: flex;
        }
        &--small &__bulletin {
            width: 220px;
        }
        &--small &__context {
            width: calc(100% - 220px - 25px);
            margin-left: 25px;
        }
        &--small &__right {
            width: 100%;
        }
        &--right-bar-flex &__goals {
            height: 600px;
            padding-left: 30px;
            width: calc(100% - 300px);

            .divider {
                display: none;
            }
        }
        &--smaller &__right {
            width: 100%;
        }
        &--smaller &__goals {
            width: 100%;
        }

        /* adjustments */
        &--no-margin &__content {
            margin-top: 5px;
        }
        &--no-margin &__right {
            width: 100%;
        }
        &--no-banner &__content {
            padding: 0px 30px 20px 30px;
        }
        &--no-banner &__header{
            margin-top: 0px;
        }

        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            width: 100%;
            height: 1px;
            margin: 6px 0px 10px 0px;
        }

        &__top-header {
            margin: 15px 0px -10px 0px;
        }
        &__content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
            position: relative;
        }
        &__content-flx {
            display: flex;
            margin-top: 20px;
        }
        &__left {
            width: 260px;
            padding: 5px 40px 0px 0px;
        }
        &__right {
            width: calc(100% - 260px);
            position: relative;
        }

        /* text */
        &__heading {
            @include text-style(0.95, 400, 1.7rem);
            margin-bottom: 0px;
        }
        &__subheading {
            @include text-style(1, 400, 1.525rem);
            margin: 18px 0px 10px 0px;
        }
        &__text {
            @include text-style(0.45, 400, 1.475rem);
        }

        /* header */
        &__banner {
            height: 210px;
            width: 100%;
            position: relative;
            overflow: hidden;
            img {
                height: 210px;
                object-fit: cover;
                width: 100%;
            }
        }
        /* month header */
        &__overview-header {
            @include flex(flex-start, space-between);
            position: relative;
            position: relative;
            margin-bottom: 4px;
        }
    }
</style>