<script lang="ts">
    import { imageUpload } from "$lib/pop-ups"
	import { SideCalendar } from "$lib/side-calendar"
    import { setShortcutsFocus } from "$lib/utils-home"
    import { clamp, clickOutside } from "$lib/utils-general"
	import { Icon } from "$lib/enums"
    import { globalContext, themeState, timer } from "$lib/store"    
	import { formatDatetoStr, formatTimeToHHMM, isNightTime, prefer12HourFormat } from "$lib/utils-date"

	import Overview from "./Overview.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import { HEADER_IMG } from "../../lib/mock-data"

    const MAX_DIST_BOTTOM_IMG_CONTAINER = 70
    export let onHeaderImageChange: (img: string) => void

    $: isLight = !$themeState.isDarkTheme
    $: ambience = $globalContext.ambience
    $: hasAmbience = ambience?.active ?? false

    let calendar = new SideCalendar(null)

    /* time */
    let now = new Date()
    let isDayTime = true
    let currentTimeStr = ""
    let doUse12HourFormat = prefer12HourFormat()
    
    /* header image */
    let opacity = 0
    export let bgImgSrc = HEADER_IMG
    let showHeaderImg = true

    let topOffset = 0
    let ogTopOffset = 0
    let initDragY = 0
    let isDragging = false
    let bgImgRef: HTMLImageElement
    let DRAG_OFFSET_THRESHOLD = 5

    timer.subscribe(({ date }) => updateTimeStr(date))

    $: if (bgImgSrc && bgImgRef && $themeState != undefined) {
        requestAnimationFrame(() => topOffset = 0)
    }
    $: onHeaderImageChange(showHeaderImg && bgImgSrc)

    function onPointerDown(pe: PointerEvent) {
        if (!bgImgSrc) return

        const target = pe.target as HTMLElement
        const { clientY } = pe
        initDragY = clientY

        target.addEventListener("pointermove", onDrag)
        target.addEventListener("pointerup", onPointerUp)
    }
    function onDrag(pe: PointerEvent) {
        const { clientY } = pe
        const offset = initDragY - clientY
        const target = pe.target as HTMLElement
        const MAX    = getMaxHeaderImgOffset()

        if (Math.abs(offset) >= DRAG_OFFSET_THRESHOLD && !isDragging) {
            target.setPointerCapture(pe.pointerId)
            ogTopOffset = topOffset
            isDragging = true
        }
        if (isDragging) {
            topOffset = clamp(-(MAX), (ogTopOffset + -offset), 0)
        }
    }
    function onPointerUp(pe: PointerEvent) {
        const target = pe.target as HTMLElement

        ogTopOffset = 0
        initDragY = -1
        isDragging = false

        target.removeEventListener("pointermove", onDrag)
        target.removeEventListener("pointerup", onPointerUp)
    }
    function getMaxHeaderImgOffset() {
        return (bgImgRef.clientHeight - MAX_DIST_BOTTOM_IMG_CONTAINER)
    }
    /* Time Stuff*/
    function updateTimeStr(date: Date) {
        currentTimeStr = formatTimeToHHMM(date, doUse12HourFormat)
        isDayTime = !isNightTime()
        now = date
    }
    function toggleTimeFormatting() {
        doUse12HourFormat = !doUse12HourFormat 
    }
</script>
<div 
    class="bar"
    class:bar--dark-theme={!isLight}
    class:bar--empty={hasAmbience && ambience?.styling != "solid" || !bgImgSrc || !showHeaderImg}
    class:bar--ambient={hasAmbience && ambience?.styling != "solid"}
    style:--margin-top={isLight ? "12px" : showHeaderImg && bgImgSrc && !hasAmbience ? "55px" : "12px"}
    style:--main-top-offset={ambience?.active ? "2px" : "-20px"}
    on:mousedown={() => {
        setShortcutsFocus("side-bar")
    }}
    use:clickOutside on:click_outside={() => {
        setShortcutsFocus("default")
    }}
>
    {#if !isLight && bgImgSrc && showHeaderImg && !hasAmbience}
        <div 
            class="bar__header"
            style:cursor={isDragging ? "ns-resize" : "default"}
            on:pointerdown={onPointerDown}
        > 
            <div class="bar__header-img-wrapper">
                <div class="bar__header-img-container">
                    <img
                        bind:this={bgImgRef}
                        class="bar__header-img"
                        style:top={`${topOffset}px`}
                        style:left={`${0}px`}
                        src={bgImgSrc} 
                        alt=""
                    >
                </div>
            </div>
            <div 
                class="bar__header-overlay" 
                style:background={`rgba(0, 0, 0, ${opacity})`}
            >
            </div>

            <div class="bar__header-time-date">
                <div class="bar__header-date">
                    {`${formatDatetoStr(now, { weekday: "short", day: "numeric", month: "short" })}`}
                    {#if !bgImgSrc}
                        <div class="bar__header-day-icon bar__header-day-icon--top">
                            {#if isDayTime}
                                <SvgIcon icon={Icon.ColorSun} options={{ scale: 0.65 }} />
                            {:else}
                                <SvgIcon icon={Icon.ColorMoon} />
                            {/if}
                        </div>
                    {/if}
                </div>
                {#if !isLight}
                    <button 
                        class="bar__header-time-container"
                        on:click={toggleTimeFormatting}
                    >
                        <div class="bar__header-time">
                            <h1>{currentTimeStr}</h1>
                        </div>
                        <div class="bar__header-day-icon">
                            {#if isDayTime}
                                <SvgIcon icon={Icon.ColorSun} />
                            {:else}
                                <SvgIcon icon={Icon.ColorMoon} />
                            {/if}
                        </div>
                    </button>
                {/if}
            </div>
            <div class="bar__header-blur-layer">
                <div 
                    class="blur-bg blur-bg--blurred-bg"
                    style:background={`rgba(0, 0, 0, ${0.1})`}
                >
                </div>
            </div>
        </div>
    {/if}

    <div class="bar__main-content">
        <Overview 
            {calendar}
            onUpdateHeaderOptions={optn => {
                if (optn == "add" || optn == "replace") {
                    imageUpload.init({
                        onSubmit: (imgSrc) => {
                            if (bgImgSrc != imgSrc && imgSrc) {
                                bgImgSrc = imgSrc
                            }
                        }
                    })
                }
                else if (optn == "show") {
                    showHeaderImg = !showHeaderImg
                }
            }}
            headerOptions={{
                img: bgImgSrc,
                show: showHeaderImg
            }}
        />
    </div>
</div>

<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/inputs.scss";
    @import "../../scss/blurred-bg.scss";

    $side-padding: 18px;
    $color-a: rgba(var(--textColor1), 0.15);
    $todo-minimized-height: 40px;

    .bar {
        width: 100%;
        height: 100vh;
        position: relative;
        overflow: hidden;
        @include txt-color;

        /* no bg image */
        &--empty &__header-time,
        &--empty &__header-day-icon,
        &--empty &__header-img-wrapper,
        &--empty &__header-blur-layer,
        &--empty &__header-overlay {
            display: none;
        }
        &--empty &__header-day-icon--top {
            display: none;
        }
        &--empty &__header-time-date {
            top: 9px;
        }
        &--empty &__header {
            height: 10px;
        }
        &--empty &__header-date {
            @include flex(center);
        }
        &--empty &__header-time-date {
            opacity: 0.8;
        }
        
        &__header {
            width: 100%;
            margin: 0px 0px 13px 0px;
            height: 85px;
            @include abs-top-left;

            &-img-wrapper {
                width: 100%;
                position: absolute;
                height: 80px;
                overflow: hidden;
                @include abs-top-left;
            }
            &-img-container {
                height: 100%;
                width: 100%;
                position: relative;
            }
            &-img {
                width: 100%;
                position: absolute;
                object-fit: cover;
                min-height: 100px;
            }
            &-overlay {
                height: 100%;
                width: 100%;
                @include abs-top-left;
            }
            &-time-date {
                @include abs-top-left(9px, 14px);
                z-index: 1;
                width: fit-content;
            }
            &-date {
                @include text-style(0.5, 400, 1.1rem, "DM Sans");
                margin-bottom: 3px;
            }
            &-date-time {
                @include text-style(0.5, 400, 1.1rem, "DM Sans");
                margin-left: 4px;
            }
            &-time h1 {
                @include text-style(1, 400, 1.7rem, "DM Sans");
                margin-right: 7px;
                white-space: nowrap;
            }
            &-time-container {
                position: relative;
                display: flex;
                cursor: default;
            }
            &-day-icon {
                height: 20px;
                width: 20px;
                overflow: visible;
                position: relative;
                @include center;
            }
            &-day-icon--top {
                margin: 0px 0px 1.5px 3px;
                height: 10px;
            }
            &-day-icon .svg-icon {
                @include abs-center;
            }
            &-text {
                margin-top: 3px;
                font-size: 1.2rem;
                font-weight: 200;
                @include txt-color(0.32);
            }
        }
        &__header-blur-layer {
            @include abs-top-left(0px, -2px);
            z-index: 0;
            width: calc(100% + 2px);
            height: 160px;
        }
        &__header-blur-layer .blur-bg {
            position: relative;
            border-radius: 0px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            -webkit-mask-image: linear-gradient(
                    180deg, 
                    transparent 0%, 
                    rgba(0, 0, 0, 0.45) 10px, 
                    rgba(0, 0, 0, 0.64) 35px, 
                    rgba(0, 0, 0, 1) 80%, 
                    rgba(0, 0, 0, 1) 60%, 
                    transparent 100%
            );
            mask-image: linear-gradient(
                    180deg, 
                    transparent 0%, 
                    rgba(0, 0, 0, 0.45) 0px, 
                    rgba(0, 0, 0, 0.64) 30px, 
                    rgba(0, 0, 0, 1) 40%, 
                    rgba(0, 0, 0, 1) 60%, 
                    transparent 100%
            );
        }


        &__main-content {
            margin-top: var(--margin-top);
            height: calc(100% - (var(--margin-top) + var(--main-top-offset)));
        }
    }
</style>