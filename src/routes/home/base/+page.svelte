<script lang="ts">    
	import { themeState } from "$lib/store"
	import { iconPicker } from "$lib/pop-ups"
	import { clamp } from "$lib/utils-general"
	import { updateHome } from "$lib/api-general"
	import { loadBaseView, saveBaseView } from "$lib/utils-home"
	import { BASE_BANNER, BASE_HEADER, HOME_THOUGHT_ENTRY } from "$lib/mock-data"

	import Header from "./Header.svelte"
	import MonthView from "./MonthView.svelte"
	import LeftMargin from "./LeftMargin.svelte"

    export let data: InitialDataLoad

    const SMALL_WIDTH = 1000
    const BASE_HEADER_ICON_ID = "base-header--icon"
    
    let home = data.home
    let { banner, header, leftMargin, bulletin } = home

    let width = 0
    let leftHt = 0
    let initDragY = -1
    let ogDragVal = 0
    let dragging = false
    
    let options: BaseView = {
        banner: {
            show: true,
            img: BASE_BANNER
        },
        header: BASE_HEADER,
        entry: HOME_THOUGHT_ENTRY,
        leftMargin: true
    }

    $: isLight = !$themeState.isDarkTheme
    $: showIcon = header.icon?.show ?? false
    $: saveBaseView(options)

    // initViewOptions()

    function initViewOptions() {
        const data = loadBaseView()

        if (data) options = data
    }
    function initIconPicker() {
        iconPicker.init({
            id: BASE_HEADER_ICON_ID,
            onSubmitIcon: async (icon: SmallIconSrc) => {
                await updateHome({
                    iconSrc: icon.src,
                    iconType: icon.type,
                    showIcon: true
                })

                header.icon = { ...icon, show: true }
            } 
        })
    }

    /* drag */
    function dragDown(pe: PointerEvent) {
        if (pe.button != 0) {
            return
        }
        const target = pe.target as HTMLElement
        initDragY = pe.clientY

        target.setPointerCapture(pe.pointerId)
        ogDragVal = banner!.img!.center
        dragging = true
    }
    function onDrag(pe: PointerEvent) {
        if (initDragY < 0) {
            return
        }
        const offset = initDragY - pe.clientY
        const target = pe.target as HTMLImageElement
        const naturalHeight = target.naturalHeight 
        const percOffset = ((offset / naturalHeight) * 100) * 2.5
        const center = clamp(0, ogDragVal + percOffset, 100)

        banner!.img!.center = Math.round(center)
        banner!.img = banner!.img
    }
    function onDragEnd() {
        ogDragVal = 0
        initDragY = -1

        if (dragging) {
            updateHome({  bannerCenter: banner!.img!.center })
        }
    }
    function onUpdateOptions(updated: Partial<BaseView>) {
        home = { ...home, ...updated }

        banner = home.banner
        header = home.header
        leftMargin = home.leftMargin
        bulletin = home.bulletin
    }
</script>

<div 
    bind:clientWidth={width}
    class="base"
    class:base--no-margin={!leftMargin}
    class:base--no-banner={!banner?.show}
    class:base--emoji-icon={header.icon?.type === "emoji"}
    class:base--light={isLight}
    class:base--small={width <= SMALL_WIDTH}
    style:--month-img-ht="261px"
    style:--left-ht={`${leftHt}px`}
    style:cursor={initDragY >= 0 ? "ns-resize" : "default"}
>   
    {#if banner && banner?.show}
        {@const { src, center } = banner.img}
        <div 
            class="base__banner"
            on:pointerdown={dragDown}
            on:pointermove={onDrag}
            on:pointerup={onDragEnd}
        >
            <img 
                style:object-position={`center ${center}%`}
                src={src} 
                alt="banner"
            >
        </div>
    {/if}
    <div class="base__content">
        {#if header.icon && showIcon}
            {@const { type, src } = header.icon}
            <button
                id={BASE_HEADER_ICON_ID}
                class="base__icon"
                on:click={() => initIconPicker()}
            >
                {#if type === "emoji"}
                    <span>{src}</span>
                {:else}
                    <img {src} alt="header icon">
                {/if}
            </button>
        {/if}
        {#if header.pos === "top"}
            <div class="base__top-header">
                <Header 
                    {showIcon}
                    options={home}
                    onOptionUpdate={(updated) => onUpdateOptions(updated)}
                />
            </div>
        {/if}
        <div class="base__content-flx">
            {#if leftMargin}
                <div class="base__left" bind:clientHeight={leftHt}>
                    <LeftMargin 
                        {bulletin}
                        marginView={home.leftMarginView}
                        fullWidth={width <= SMALL_WIDTH}
                    />
                </div>
            {/if}
            <div class="base__right">
                {#if header.pos === "side"}
                    <div class="base__overview-header">
                        <Header 
                            {showIcon}
                            options={home}
                            onOptionUpdate={(updated) => onUpdateOptions(updated)}
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
    @use "../../../scss/dropdown.scss" as *;

    .base {
        width: 100%;
        margin-top: 0px;
        overflow-x: hidden;
        overflow-y: scroll;
        height: calc(100% - 20px);

        --icon-top-offset: -80px;

        /* light */
        &--light h1 {
            font-weight: 600 !important;
        }
        &--light &__context-header {
            @include text-style(0.95, 600);
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
        &--no-banner {
            --icon-top-offset: 5px;
        }
        &--no-banner &__content {
            padding: 0px 30px 20px 30px;
        }
        &--no-banner &__header {
            margin-top: 0px;
        }
        &--emoji-icon &__icon {
            margin-bottom: -10px;
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
        &__icon {
            margin: var(--icon-top-offset) 0px 0px 0px;
            font-size: 6rem;
            height: 80px;
            width: 80px;
            position: relative;
            transition-property: transform;
            
            img {
                @include square(80px);
                border-radius: 4px;
                object-fit: cover;
            }
        }
        &__content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
            position: relative;
        }
        &__content-flx {
            display: flex;
            margin-top: 16px;
        }
        &__left {
            width: 235px;
            padding: 5px 26px 0px 0px;
        }
        &__right {
            width: calc(100% - 235px);
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

        &__banner {
            height: 180px;
            width: 100%;
            position: relative;
            overflow: hidden;
            z-index: 0;
            img {
                height: 100%;
                object-fit: cover;
                width: 100%;
            }
        }
        &__overview-header {
            @include flex(flex-start, space-between);
            position: relative;
            margin-bottom: 4px;
        }
    }
</style>