<script lang="ts">
	import { onDestroy } from "svelte"
    
	import { Icon } from "$lib/enums"
    import { imageUpload } from "$lib/pop-ups"
	import { updateUiOptions } from "$lib/api-general"
    import { clamp, clickOutside } from "$lib/utils-general"
    import { globalContext, themeState, timer } from "$lib/store"    
    import { loadDayViewOptions, setHotkeyFocus } from "$lib/utils-home"
	import { formatDatetoStr, formatTimeToHHMM, isNightTime, prefer12HourFormat } from "$lib/utils-date"
    
	import DayView from "./DayView.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"

    const MAX_DIST_BOTTOM_IMG_CONTAINER = 70
    const DRAG_OFFSET_THRESHOLD = 5

    export let options: RightBar
    export let todos: Task[]
    export let onSetHeaderImg: (img: string) => void
    export let fixed: boolean

    $: isLight = !$themeState.isDarkTheme
    $: ambience = $globalContext.ambience
    $: hasAmbience = ambience?.active ?? false

    let header = options.header
    let colors = options.routineColors
    let boxes = options.routineBoxes

    let dayViewOptions: DayViewOptions = {
        view: options.view,
        calView: "routines",
        header,
        googleCal: {
            colors: colors
        },
        routines: {
            checkbox: boxes,
            colors: colors
        }
    }

    /* time */
    let now = new Date()
    let isDayTime = true
    let currentTimeStr = ""
    let doUse12HourFormat = prefer12HourFormat()
    
    /* header image */
    let opacity = 0
    let ogTopOffset = 0
    let initDragY = 0
    let dragging = false
    let bgImgRef: HTMLImageElement

    $: headerImg = header.img
    $: headerTop = header.top
    $: showHeaderImg = header.show

    $: transparent = hasAmbience && ambience?.styling != "solid"
    $: empty = transparent || !headerImg || !showHeaderImg || isLight

    $: onSetHeaderImg(headerImg ?? "")

    // initOptions()

    const unsubscribe = timer.subscribe(({ date }) => updateTimeStr(date))

    function initOptions() {
        const data = loadDayViewOptions()
    }

    /* header ui img */
    async function onSubmitImg(src: string) {
        await updateUiOptions({
            barBanner: src,
            barBannerTop: 0
        })

        header.img = src
        header.top = 0
    }
    function onPointerDown(pe: PointerEvent) {
        if (!headerImg) return

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
        const MAX = bgImgRef.clientHeight - MAX_DIST_BOTTOM_IMG_CONTAINER

        if (Math.abs(offset) >= DRAG_OFFSET_THRESHOLD && !dragging) {
            target.setPointerCapture(pe.pointerId)

            ogTopOffset = headerTop ?? 0
            dragging = true
        }
        if (dragging) {
            const pos = clamp(-(MAX), (ogTopOffset + -offset), 0)
            headerTop = Math.round(pos)
            header.top = headerTop
        }
    }
    function onPointerUp(pe: PointerEvent) {
        const target = pe.target as HTMLElement

        if (dragging) {
            updateUiOptions({ barBannerTop: headerTop })
        }

        ogTopOffset = 0
        initDragY = -1
        dragging = false

        target.removeEventListener("pointermove", onDrag)
        target.removeEventListener("pointerup", onPointerUp)
    }
    
    /* time */
    function updateTimeStr(date: Date) {
        currentTimeStr = formatTimeToHHMM(date, doUse12HourFormat)
        isDayTime = !isNightTime()
        now = date
    }
    function toggleTimeFormatting() {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr(new Date())
    }

    onDestroy(() => unsubscribe())
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="bar"
    class:bar--dark-theme={!isLight}
    class:bar--empty={empty}
    class:bar--transparent={transparent}
    style:--margin-top={isLight ? "12px" : showHeaderImg && headerImg && !transparent ? "46px" : "10px"}
    style:--main-top-offset={ambience?.active ? "2px" : "-10px"}
    style:--fixed-offset={fixed ? "42px" : "0px"}
    on:mousedown={() => {
        setHotkeyFocus("side-bar")
    }}
    use:clickOutside on:outClick={() => {
        setHotkeyFocus("default")
    }}
>
    {#if !empty && headerImg}
        <div 
            class="bar__header"
            style:cursor={dragging ? "ns-resize" : "default"}
            on:pointerdown={onPointerDown}
        > 
            <div class="bar__header-img-wrapper">
                <div class="bar__header-img-container">
                    <img
                        bind:this={bgImgRef}
                        class="bar__header-img"
                        style:top={`${headerTop}px`}
                        style:left="0px"
                        src={headerImg ?? ""} 
                        alt="header"
                    >
                </div>
            </div>
            <div class="bar__header-overlay" style:background={`rgba(0, 0, 0, ${opacity})`}></div>

            <div class="bar__header-time-date">
                <div class="bar__header-date">
                    {`${formatDatetoStr(now, { weekday: "short", day: "numeric", month: "short" })}`}
                    {#if !headerImg}
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

    <div class="bar__overview">
        <DayView 
            options={dayViewOptions}
            todos={todos}
            onHeaderOptions={optn => {
                if (optn == "show") {
                    header.show = !header.show
                    updateUiOptions({ barBannerShow: header.show })
                }
                else {
                    imageUpload.init({ onSubmitImg })
                }
            }}
        />
    </div>
</div>

<style lang="scss">
    @use "../../scss/dropdown.scss" as *;
    @use "../../scss/inputs.scss" as *;
    @use "../../scss/blurred-bg.scss" as *;

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
        &--empty &__header-img-wrapper,
        &--empty &__header-time,
        &--empty &__header-day-icon,
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
        &--empty &__overview {
            margin-left: 0px;
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
                @include text-style(0.5, 400, 1rem);
                margin-bottom: 3px;
            }
            &-date-time {
                @include text-style(0.5, 400, 1rem);
                margin-left: 4px;
            }
            &-time h1 {
                @include text-style(1, 400, 1.5rem);
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
        &__overview {
            margin-top: var(--margin-top);
            margin-left: 2px;
            overflow: hidden;
            height: calc(100% - (var(--margin-top) - 5px + var(--main-top-offset) + var(--fixed-offset)));
        }
    }
</style>