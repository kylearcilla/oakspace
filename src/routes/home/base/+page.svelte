<script lang="ts">    
	import { themeState } from "../../../lib/store"
	import { months } from "../../../lib/utils-date"
	import { imageUpload } from "../../../lib/pop-ups"
	import { MONTH_THOUGHT_ENTRY } from "../../../lib/mock-data"
	import { clamp, clickOutside } from "../../../lib/utils-general"

	import Header from "./Header.svelte"
	import YearView from "./YearView.svelte"
	import TextEntry from "./TextEntry.svelte"
	import MonthView from "./MonthView.svelte"
	import LeftMargin from "./LeftMargin.svelte";
	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import SettingsBtn from "../../../components/SettingsBtn.svelte"

    const SMALLER_WIDTH = 630
    const SMALL_WIDTH = 860

    $: isLight = !$themeState.isDarkTheme

    let settingsOpen = false
    let width = 0
    let leftHt = 0
    let initDragY = -1
    let ogDragVal = 0

    let bannerImg = {
        src: "https://i.imgur.com/MEjZkXW.png",
        center: 50
    }
    let header: BaseHeader = {
        icon: {
            src: "https://i.pinimg.com/originals/29/c6/21/29c62126c883a48d0bb1622648f00330.gif",
            type: "img",
            show: true
        },
        title: "Home",
        text: {
            icon: null,
            show: true
        }
    }
    let options = {
        view: "month",
        header: false,
        banner: true,
        margin: true
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
    function openImgModal() {
        imageUpload.init({
            onSubmit: (imgSrc: string) => {
                if (imgSrc && bannerImg.src != imgSrc) {
                    bannerImg.src = imgSrc
                    bannerImg.center = 50
                    bannerImg = bannerImg
                }
            }
        })
        settingsOpen = false
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
        <!-- header -->
        {#if options.header}
            <Header options={header} showBanner={options.banner} />
        {/if}
        <div 
            class="divider" 
            class:no-bg={!options.header}
            style:margin={!options.header ? "15px 0px 0px 0px" : "12px 0px 12px 0px"}
        >
        </div>

        <div class="base__content-flx">
            <!-- left margin -->
            {#if options.margin}
                <div class="base__left" bind:clientHeight={leftHt}>
                    <LeftMargin fullWidth={width <= SMALL_WIDTH} />
                </div>
            {/if}
            <!-- overview -->
            <div class="base__right">
                <div class="base__overview-header">
                    <div style:width="100%">
                        <div class="base__overview-heading">
                            {months[MONTH_THOUGHT_ENTRY.date.getMonth()]}
                        </div>
                        <div style:width="100%">
                            <TextEntry 
                                id="month"
                                entry={MONTH_THOUGHT_ENTRY}
                            />
                        </div>
                    </div>
                </div>
    
                <!-- insights -->
                <div class="base__month-insight">
                    {#if options.view === "month"}
                        <MonthView/>
                    {:else}
                        <YearView/>
                    {/if}
                    {#if width <= SMALL_WIDTH}
                        <div class="divider" style:margin="25px 0px 20px 0px"></div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- settings -->
        <div 
            class="base__settings-btn"
            style:top={`${options.header ? header.icon.show ? "80px" : "10px" : "-5px"}`}
        >
            <SettingsBtn 
                id={"base--dbtn"}
                options={{ 
                    opacity: {
                        fg: 0.25,
                        bg: 0
                    },
                    hOpacity: {
                        fg: 0.5,
                        bg: 0.05
                    },
                }}
                onClick={() => settingsOpen = !settingsOpen}
            />
        </div>

        <!-- settings menu -->
        <BounceFade 
            isHidden={!settingsOpen}
            zIndex={200}
            position={{ 
                top: `${options.header ? header.icon.show ? "105px" : "35px" : "20px"}`, 
                right: "25px"
            }}
        >
            <div 
                id="base--dmenu"
                class="base__dmenu dmenu" 
                class:dmenu--light={isLight}
                style:width={"170px"}
                use:clickOutside on:click_outside={() => settingsOpen = false} 
            >
                <li class="dmenu__section">
                    <div class="dmenu__section-name">
                        Banner
                    </div>
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Show Banner</span>
                        <ToggleBtn 
                            active={options.banner}
                            onToggle={() => {
                                options.banner = !options.banner
                                options = options
                            }}
                        />
                    </div>
                    {#if options.banner}
                        <div class="dmenu__option">
                            <button class="dmenu__option-btn" on:click={() => openImgModal()}>
                                <span class="dmenu__option-text">
                                    Change Wallpaper
                                </span>
                            </button>
                        </div>
                    {/if}
                </li>
                <li class="dmenu__section-divider"></li>
                <li class="dmenu__section">
                    <div class="dmenu__section-name">
                        Header
                    </div>
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Show Header</span>
                        <ToggleBtn 
                            active={options.header}
                            onToggle={() => {
                                options.header = !options.header
                                options = options
                            }}
                        />
                    </div>
                    {#if options.header}
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Header Icon</span>
                            <ToggleBtn 
                                active={header.icon.show}
                                onToggle={() => {
                                    header.icon.show = !header.icon.show
                                    header = header
                                }}
                            />
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Day Summary</span>
                            <ToggleBtn 
                                active={header.text.show}
                                onToggle={() => {
                                    header.text.show = !header.text.show
                                    header.text.icon = null
                                    header = header
                                }}
                            />
                        </div>
                    {/if}
                </li>
                <li class="dmenu__section-divider"></li>
                <li class="dmenu__section">
                    <div class="dmenu__section-name">
                        Side Margin
                    </div>
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Show Margin</span>
                        <ToggleBtn 
                            active={options.margin}
                            onToggle={() => {
                                options.margin = !options.margin
                                options = options
                            }}
                        />
                    </div>
                </li>
            </div>
        </BounceFade>
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
        &--small &__context .divider {
            display: none;
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

        &__content {
            max-width: 1560px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
            position: relative;
        }
        &__content-flx {
            display: flex;
            margin-top: 4px;
        }
        &__left {
            width: 260px;
            padding: 5px 40px 0px 0px;
        }
        &__right {
            width: calc(100% - 260px);
            position: relative;
        }
        &__settings-btn {
            @include abs-top-right(10px, 25px);
            z-index: 100;
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
        &__header {
            padding: 15px 0px 0px 0px;
            // padding: 20px 0px 0px 0px;
            width: 100%;
            position: relative;
            margin-top: -70px;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        /* month header */
        &__overview-header {
            @include flex(flex-start, space-between);
            position: relative;
            margin-bottom: 0px;
            position: relative;
            min-width: 680px;
        }
        &__overview-heading {
            @include text-style(1, 400, 2.2rem, "DM Mono");
            margin: -2px 0px 0px 0px;
            @include flex(flex-start, space-between);
        }
        &__month-insight {
            margin-top: 0px;
        }
    }
</style>