<script lang="ts">
	import { onDestroy, onMount } from "svelte"
    
    import { globalContext, themeState } from "$lib/store"    
	import { clamp, clickOutside } from "$lib/utils-general"
	import { ShortcutSectionInFocus, Icon } from "$lib/enums"
	import { setShortcutsFocus, imageUpload } from "$lib/utils-home"
	import { SideCalendar } from "$lib/side-calendar"
	import { formatDatetoStr, formatTimeToHHMM, isNightTime, prefer12HourFormat } from "$lib/utils-date"

	import Overview from "./Overview.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import DropdownList from "../../components/DropdownList.svelte"

    const SETTINGS_BTN_CUT_OFF_Y = 30
    const MAX_DIST_BOTTOM_IMG_CONTAINER = 70

    $: isLight = !$themeState.isDarkTheme
    $: ambient = $globalContext.ambience
    $: fixed = $globalContext.rightBarFixed

    let headerRef: HTMLElement
    let headerImgContainerHt = 0
    let calendar = new SideCalendar(null)

    /* time */
    let isDayTime = true
    let currentTimeStr = ""
    let interval: NodeJS.Timer | null = null
    let doUse12HourFormat = prefer12HourFormat()
    
    /* header image */
    let opacity = 0
    let settingsOpen = false
    let bgImgSrc = "https://i.pinimg.com/originals/7d/04/0e/7d040e94931427709008aaeda14db9c8.gif"
    let showHeaderImg = true
    let showSettingsBtn = false

    let topOffset = 0
    let ogTopOffset = 0
    let initDragY = 0
    let isDragging = false
    let bgImgRef: HTMLImageElement
    let DRAG_OFFSET_THRESHOLD = 5

    $: {
        bgImgSrc = $themeState.isDarkTheme ? "https://i.pinimg.com/originals/7d/04/0e/7d040e94931427709008aaeda14db9c8.gif" : ""
    }
    $: if (bgImgSrc && bgImgRef && $themeState != undefined) {
        requestAnimationFrame(() => topOffset = 0)
    }

    /* Header Image */
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

    /* General UI Handlers */
    function imgSettingsHandler(context: DropdownItemClickedContext) {
        const target   = context.event.target as HTMLElement
        const optnText = target.innerText.trim()

        if (["Replace Background", "Add Header Background"].includes(optnText)) {
            imageUpload.init({
                onSubmit: (imgSrc: string) => {
                    if (bgImgSrc != imgSrc) {
                        bgImgSrc = imgSrc
                    }
                }
            })
        }
        else {
            bgImgSrc = ""
        }

        settingsOpen = false
    }
    function onPointerMove(pe: PointerEvent) {
        if (!headerRef || isDragging) return
        const { clientY, clientX } = pe
        const SETTINGS_BTN_CUT_OFF_X = headerRef.getBoundingClientRect().left

        if (clientX >= SETTINGS_BTN_CUT_OFF_X && clientY <= SETTINGS_BTN_CUT_OFF_Y) {
            showSettingsBtn = true
        }
        else {
            showSettingsBtn = false
        }
    }

    /* Time Stuff*/
    function updateTimeStr() {
        currentTimeStr = formatTimeToHHMM(new Date(), doUse12HourFormat)
        isDayTime = !isNightTime()
    }
    function toggleTimeFormatting() {
        doUse12HourFormat = !doUse12HourFormat 
        updateTimeStr()
    }
    function initDateTimer() {
        interval = setInterval(updateTimeStr, 1000)
    }

    onMount(() => {
        updateTimeStr()
        initDateTimer()
    })
    onDestroy(() => {
        clearInterval(interval! as any)
    })
</script>
<div 
    class="bar"
    class:bar--dark-theme={!isLight}
    class:bar--light-theme={isLight}
    class:bar--empty={ambient?.styling === "clear" || ambient?.styling === "blur" || !bgImgSrc || !showHeaderImg}
    class:bar--ambient={ambient?.styling === "clear" || ambient?.styling === "blur"}
    style:--mc-ht-offset={`${fixed ? "55px" : "0px"}`}
    on:pointermove={onPointerMove}
    on:mousedown={() => setShortcutsFocus(ShortcutSectionInFocus.TASK_BAR)}
    use:clickOutside on:click_outside={() => setShortcutsFocus(ShortcutSectionInFocus.MAIN)}
>
    <div 
        class="bar__header"
        style:cursor={isDragging ? "ns-resize" : "default"}
        bind:this={headerRef}
        on:pointerdown={onPointerDown}
    > 
        <div class="bar__header-img-wrapper">
            <div 
                class="bar__header-img-container"
                bind:clientHeight={headerImgContainerHt}
            >
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
            style:background={`rgba(0, 0, 0, ${opacity}`}
        >
        </div>
        <!-- Header -->
        <div class="bar__header-time-date">
            <!-- Header Date -->
            <div class="bar__header-date">
                {#if !bgImgSrc || !showHeaderImg || isLight}
                    {`${formatDatetoStr(new Date(), { weekday: "short" })}`}
                    <button 
                        class="bar__header-date-time"
                        on:click={toggleTimeFormatting}
                    >
                        {currentTimeStr}
                    </button>
                {:else}
                    {`${formatDatetoStr(new Date(), { weekday: "short", day: "2-digit", month: "short" })}`}
                {/if}
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
            <!-- Time -->
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
    <div class="bar__main-content">
        <Overview {calendar} />
    </div>

    <!-- Header Img Stuff -->
    <button     
        id="right-bar--dbtn"
        class="bar__settings-btn" 
        class:bar__settings-btn--show={showSettingsBtn}
        on:click={() => {
            settingsOpen = !settingsOpen
        }}
    >
        <SvgIcon 
            icon={Icon.Settings} options={{ opacity: 0.4, scale: 0.9 }} 
        />
    </button>

    <DropdownList 
        id={"right-bar"}
        isHidden={!settingsOpen} 
        options={{
            listItems: !bgImgSrc ? 
                [{ name: "Add Header Background"}] : 
                [{ name: "Replace Background" }, { name: "Remove" }],
            position: { 
                top: "28px", right: "10px"
            },
            styling:  {
                width: bgImgSrc ? "150px" : "170px",
                fontSize: "1.2rem",
                zIndex: 500
            },
            onListItemClicked: (context) => {
                imgSettingsHandler(context)
            },
            onClickOutside: () => {
                settingsOpen = false
            }
        }}
    />
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

        &--ambient &__settings-btn {
            display: none !important;
        }
        &--light-theme &__header {
            margin-bottom: 14px;
            height: auto;

            &-time h1 {
                font-weight: 500;
                margin-bottom: 2px;
            }
            &-text {
                font-weight: 500;
                @include txt-color(0.5);
            }
            &-time-date {
                top: 68px;
                display: block;   
                position: relative;
            }
            &-date {
                font-weight: 500;
                margin-bottom: 1.5px;
                @include text-style(0.5, 600);
            }
            &-date-time {
                top: 68px;
                @include text-style(0.6, 600);
            }
            &-img-wrapper {
                height: 60px;
                overflow: hidden;
            }
            &-blur-layer {
                display: none;
            }
        }
        &--light-theme &__main-content {
            margin-top: 90px;
            height: calc(100% - 80px);
        }

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
        &--empty &__main-content {
            margin-top: 32px;
            height: calc(100% - 45px - var(--mc-ht-offset));
        }
        
        /* Top Header */
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
                @include text-style(0.6, 400, 1.1rem, "DM Sans");
                margin-left: 4px;
                opacity: 0.4;
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
        &__settings-btn {
            @include circle(20px);
            @include center;
            @include abs-top-right;
            @include not-visible;
            margin: 6px 6px 0px 0px;
            
            &--show {
                @include visible(0.5);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.08);
                @include visible(1);
            }
        }

        /* Calendar */
        &__main-content {
            margin-top: 57px;
            height: calc(100% - 45px - var(--mc-ht-offset));
        }
    }
</style>