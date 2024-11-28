<script lang="ts">    
	import { themeState } from "../../../lib/store"
	import { capitalize, clamp, clickOutside } from "../../../lib/utils-general"

	import Bulletin from "./Bulletin.svelte"
	import YearView from "./YearView.svelte"
	import MonthView from "./MonthView.svelte"
	import DailyHabits from "./DailyHabits.svelte"
	import SettingsBtn from "../../../components/SettingsBtn.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import GoalCard from "../../../components/GoalCard.svelte";
	import { TEST_GOALS } from "../../../lib/mock-data";
	import DropdownList from "../../../components/DropdownList.svelte";
	import { months, getQuarter } from "../../../lib/utils-date";
	import RingCalendar from "../../../components/RingCalendar.svelte";

    const SMALLER_WIDTH = 630
    const SMALL_WIDTH = 860

    let width = 0
    let leftHt = 0
    let settingsOpen = false
    let today = new Date()

    /* margins */
    let marginDropdown = false
    let marginViewDropdown = false
    let marginOptn: "habits" | "goals" = "habits"
    let marginView: "today" | "month" | "year" | "quarter" = "today"

    let isDragging = false
    let initDragY = 0
    let ogBulletingHt = 0
    let bulletinHt = 300

    const monthHeader = {
        title: "September",
        entry: {
            word: "Unwind",
            type: "noun",
            img: "https://i.pinimg.com/564x/11/b7/12/11b712e5eb6a081dbcec3a7b439825dd.jpg",
            def: `
                <p>A mindful pause to recharge, reconnect, and rediscover balance amidst life's demands. </p>
                <br>
                <p>Unwinding is more than a break; it's an intentional step back from the hustle, restore inner calm, and regain clarity.</p>
            `
        }
    }
    const yrHeader = {
        title: "2024",
        entry: {
            word: "Balance",
            type: "noun",
            img: "https://i.pinimg.com/736x/98/6c/eb/986ceb87af5f7442463be09d5e49c2ae.jpg",
            def: `
                <p>2024 is all about balance. My focus this year is on intentional growth, embracing routines that ground me, and prioritizing rest alongside ambition.</p>
            `
        }
    }
    const bannerImg = {
        src: "https://preview.redd.it/ancient-tree-from-mononoke-3840-x-2160-v0-qrghesb0z65c1.png?width=1080&crop=smart&auto=webp&s=c42a4dfc07a2734d3489faaccd1febb56b6859b3",
        opacity: 0.15
    }
    let options = {
        view: "year",
        header: false,
        banner: true,
        margin: true
    }

    $: detailsHeader = options.view === "month" ? monthHeader : yrHeader
    $: isLight = !$themeState.isDarkTheme

    $: if (isLight) {
        bannerImg.opacity = 0
    }

    /* bulleting height */
    function onPointerDown(pe: PointerEvent) {
        initDragY = pe.clientY
        isDragging = true
        ogBulletingHt = bulletinHt
    }
    function onDrag(pe: PointerEvent) {
        if (!isDragging) return
        const offset = initDragY - pe.clientY
        bulletinHt = clamp(200, ogBulletingHt + -offset, 350)
    }
    function onPointerUp(pe: PointerEvent) {
        if (!isDragging) return

        ogBulletingHt = 0
        initDragY = -1
        isDragging = false
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
    class:base--smaller={width <= SMALLER_WIDTH}
    style:--month-img-ht={"261px"}
    style:--left-ht={`${leftHt}px`}
    style:cursor={isDragging ? "ns-resize" : "default"}
>   
    {#if options.banner}
        <div 
            class="base__header-img bg-img"
            style:background-image={`linear-gradient(rgba(0, 0, 0, ${bannerImg.opacity}), rgba(0, 0, 0, ${bannerImg.opacity})), url(${bannerImg.src})`}
        >
        </div>
    {/if}
    <div class="base__content">
        {#if options.header}
            <!-- header -->
            <div class="base__header">
                <div 
                    class="base__header-icon bg-img"
                    style:background-image={`linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(https://i.pinimg.com/564x/a7/27/df/a727dfcc29381d933b295b036c9239d5.jpg)`}
                >
                </div>
                <div class="base__header-details">
                    <h1>Home</h1>
                    <div class="base__header-callout insight-sentence">
                        <div class="base__header-callout-icon">🌙</div>
                        <div>
                            <!-- <p>Good <strong>evening</strong> Kyle.</p> -->
                            <p>
                                <!-- You have completed <strong>2</strong> of <strong>3</strong> of your habits today with <strong>1</strong> of <strong>2</strong> goals achieved. -->
                                "How we spend our days is, of course, how we spend our lives." – Annie Dillard
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        <div 
            class="divider" 
            class:no-bg={!options.header}
            style:margin={!options.header ? "15px 0px 0px 0px" : "15px 0px"}
        >
        </div>

        <div class="base__content-flx">
            {#if options.margin}
                <!-- left side -->
                <div 
                    class="base__left"
                    bind:clientHeight={leftHt}
                    on:pointermove={onDrag}
                    on:pointerup={onPointerUp}
                >
                    <div class="base__bulletin" style:height={`${bulletinHt}px`}>
                        <Bulletin />
                    </div>
                    <div class="base__context">
                        <div 
                            on:pointerdown={onPointerDown}
                            class="divider divider--handle" 
                            style:cursor="ns-resize"
                        >
                        </div>
                        <div class="base__context-header">
                            <button 
                                on:click={() => marginDropdown = !marginDropdown}
                                class="base__context-btn"
                                id="margin-optn--dbtn"
                            >
                                {capitalize(marginOptn)}
                            </button>
                            <button 
                                on:click={() => marginViewDropdown = !marginViewDropdown}
                                class="base__context-btn base__context-btn--view"
                                id="margin-view--dbtn"
                            >
                                {#if marginView === "today"}
                                    Today
                                {:else if marginView === "month"}
                                    {months[today.getMonth()].substring(0, 3)}
                                {:else if marginView === "quarter"}
                                    Q{getQuarter(today)}
                                {:else if marginView === "year"}
                                    This Year
                                {/if}
                            </button>
                        </div>

                        <!-- today's habits -->
                        {#if marginView === "today"}
                            <DailyHabits options={{ view: "default" }} />
                        <!-- month habit trends -->
                        {:else if marginOptn === "habits" && marginView === "month"}
                            <div class="habits">
                                <div class="habits__details">
                                    <div class="habits__stat">
                                        <span>Perfect Days</span>
                                        <span>16</span>
                                    </div>
                                    <div class="habits__stat">
                                        <span>Missed Days</span>
                                        <span>2</span>
                                    </div>
                                </div>
                                <RingCalendar />
                            </div>
                        <!-- goals view -->
                        {:else}
                            <div class="goals-list">
                                {#each TEST_GOALS as goal}
                                    {@const done = goal.status === "accomplished"}
                                    <div class="goal-item">
                                        <div 
                                            class="goal-item__symbol"
                                            style:opacity={done ? 0.35 : 1}
                                        >
                                            {goal.tag.symbol.emoji}
                                        </div>
                                        <!-- svelte-ignore a11y-missing-attribute -->
                                        <div 
                                            class="goal-item__title"
                                            class:strike={done}
                                        >
                                            {goal.name}
                                        </div>
                                        <i class="fa-solid fa-check" class:hidden={!done}>
                                        </i>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        <DropdownList 
                            id="margin-optn"
                            isHidden={!marginDropdown} 
                            options={{
                                pickedItem: capitalize(marginOptn),
                                listItems: [
                                    { name: "Habits" }, { name: "Goals" }
                                ],
                                position: { 
                                    top: "40px", left: "-8px" 
                                },
                                styling: { 
                                    width: "100px" 
                                },
                                onClickOutside: () => { 
                                    marginDropdown = false 
                                },
                                onListItemClicked: ({ name }) => {
                                    const newOptn = name.toLowerCase() 
                                    if (newOptn != marginOptn) {
                                        marginOptn = newOptn
                                        marginView = newOptn === "habits" ? "today" : "month"
                                    }
                                    marginDropdown = false 
                                }
                            }}
                        />
                        <DropdownList
                            id="margin-view"
                            isHidden={!marginViewDropdown} 
                            options={{
                                pickedItem: capitalize(marginView),
                                listItems: marginOptn === "habits" ?
                                    [{ name: "Today" }, { name: "Month" }] : 
                                    [{ name: "Month" }, { name: "Quarter" }, { name: "Year" }, ]
                                ,
                                position: { 
                                    top: "40px", right: "0px" 
                                },
                                styling: { 
                                    width: "100px" 
                                },
                                onClickOutside: () => { 
                                    marginViewDropdown = false 
                                },
                                onListItemClicked: ({ name }) => {
                                    marginView = name.toLowerCase()
                                    marginViewDropdown = false 
                                }
                            }}
                        />
                    </div>
                </div>
            {/if}
            <!-- right side -->
            <div class="base__right">
                <!-- settings -->
                <div class="base__settings-btn">
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

                <!-- overview details -->
                <div class="base__overview-header">
                    <div style:width="100%">
                        <div class="base__overview-heading">
                            {detailsHeader.title}
                        </div>
                        <div style:width="100%">
                            <div 
                                class="base__wom"
                                class:base__wom--default={false}
                                class:base__wom--img={true}
                            >
                                <div class="base__wom-img">
                                    <img 
                                        src={detailsHeader.entry.img}
                                        alt="month-img"
                                    />
                                </div>
                                <div class="flx flx--algn-center">
                                    <div class="base__word">
                                        {detailsHeader.entry.word}
                                    </div>
                                    <div class="base__word-type">
                                        {detailsHeader.entry.type}
                                    </div>
                                </div>
                                <div class="base__word-def">
                                    {@html detailsHeader.entry.def}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    
                <!-- overview -->
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

                <!-- options menu -->
                <BounceFade 
                    isHidden={!settingsOpen}
                    zIndex={200}
                    position={{ 
                        top: "20px", right: "0px"
                    }}
                >
                    <div 
                        id="base--dmenu"
                        class="base__dmenu dmenu" 
                        class:dmenu--light={isLight}
                        style:width={"235px"}
                        use:clickOutside on:click_outside={() => settingsOpen = false} 
                    >
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Overview
                            </div>
                            <div class="dmenu__boxes">
                                <button
                                    class="dmenu__box"
                                    class:dmenu__box--selected={options.view === "month"}
                                    on:click={() => {
                                        options.view = "month"
                                        options = options                                        
                                    }}
                                >
                                    <div class="dmenu__box-title">
                                        Monthly
                                    </div>
                                    <div class="dmenu__box-text">
                                        Detailed and intimate.
                                    </div>
                                </button>
                                <button 
                                    class="dmenu__box" 
                                    class:dmenu__box--selected={options.view === "year"}
                                    on:click={() => {
                                        options.view = "year"
                                        options = options                                        
                                    }}
                                >
                                    <div class="dmenu__box-title">
                                        Yearly
                                    </div>
                                    <div class="dmenu__box-text">
                                        Big picture trends.
                                    </div>
                                </button>
                            </div>
                        </li>
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Home Display
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Page Header</span>
                                <ToggleBtn 
                                    active={options.header}
                                    onToggle={() => {
                                        options.header = !options.header
                                        options = options
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Side Margin</span>
                                <ToggleBtn 
                                    active={options.margin}
                                    onToggle={() => {
                                        options.margin = !options.margin
                                        options = options
                                    }}
                                />
                            </div>
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Image Banner</span>
                                <ToggleBtn 
                                    active={options.banner}
                                    onToggle={() => {
                                        options.banner = !options.banner
                                        options = options
                                    }}
                                />
                            </div>
                        </li>
                    </div>
                </BounceFade>
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
        &--light &__header-callout {
            @include text-style(1, 500);
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

        &--right-bar-flex &__right {
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

        /* overview */
        &--year &__overview-heading {
            font-size: 2.85rem;
            font-weight: 400;
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

            &--handle {
                border-top: 1px solid rgba(var(--textColor1), 0.06);
                background-color: transparent;
                padding: 3px 0px 4px 0px;
                margin: 0px;
            }
        }

        &__content {
            max-width: 1560px;
            margin: 0 auto;
            padding: 0px 30px 20px 30px;
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
            @include abs-top-right(-5px, -2px);
            z-index: 1;
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
        &__header-img {
            height: 180px;
            width: 100%;
        }
        &__header {
            padding: 15px 0px 0px 0px;
            // padding: 20px 0px 0px 0px;
            width: 100%;
            position: relative;
            margin-top: -90px;

            .divider {
                height: 100%;
                width: 1px;
                margin: 0px 25px 0px 20px;
            }
        }
        &__header-icon {
            height: 90px;
            width: 90px;
            margin-bottom: 17px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 0px;
            }
        }
        &__header-details {
            flex: 1;
            position: relative;
            @include flex-col;

            h1 {
                @include text-style(1, 500, 2.75rem, "Manrope");
                margin: -3px 0px 10px 0px;
            }
            h4 {
                @include text-style(0.25, 400, 1.45rem);
                margin: 0px 0px 10px 0px;
            }
        }
        &__header-callout {
            position: relative;
            padding: 8px 25px 13px 13px;
            background-color: var(--lightColor);
            border-radius: 10px;
            display: flex;
            width: fit-content;

            p:first-of-type {
                margin-top: 2px;
            }
            p:not(:first-of-type) {
                margin-top: 3px;
            }
        }
        &__header-callout-icon {
            margin: 1px 12px 0px 0px;
            font-size: 1.5rem;
            color: white !important;
        }

        /* overview */
        &__overview {
            padding: 0px 30px 0px 0px;
            margin-bottom: 10px;
            @include flex(flex-end);
            display: none;

            .base__text {
                margin-bottom: 20px;
            }
        }
        &__overview-details {
            width: clamp(250px, 35%, 350px);
            margin: 0px 30px 0px 0px;
            height: 100%;
        }
        &__heat-map {
            flex: 1;
            padding: 2px 80px 0px 40px;
            overflow-x: scroll;
        }

        /* month insights */
        &__month-insight {
            margin: 7px 0px 0px 0px;
        }
        &__bulletin {
        }

        /* goals */
        &__context {
            margin-bottom: 30px;
            position: relative;

            .divider {
                width: 100%;
                margin: 11px 0px 4px 4px !important;
            }
        }
        &__context-btn {
            @include text-style(1, 400, 1.55rem, "DM Mono");
            padding: 5px 12px 6px 11px;
            margin-left: -11px;
            border-radius: 12px;
            
            &--view {
                @include text-style(1, 400, 1.5rem);
                margin-right: -10px;
                padding: 6px 10px 7px 9px;
                opacity: 0.2;
            }
            &--view:hover {
                opacity: 0.8;
            }
            &:hover {
                opacity: 0.5;
            }
        }
        &__context-header {
            @include flex(center, space-between);
            margin: 0px 0px 4px 2px;
        }
        &__context-count {
            opacity: 0.2;
            font-family: "DM MOno";
            font-weight: 400;
        }
        &__context-list {
            padding: 5px 15px 0px 6px;
            max-height: 500px;
            overflow-y: scroll;
            width: calc(100% + 15px);
            margin: 0px 0px 20px -6px;
        }
        /* month header */
        &__overview-header {
            @include flex(flex-start, space-between);
            margin-bottom: 0px;
            position: relative;
            min-width: 680px;
        }
        &__overview-heading {
            @include text-style(1, 400, 2.2rem, "DM Mono");
            margin: -2px 0px 0px 0px;
            @include flex(flex-start, space-between);
        }

        /* month entry */
        &__month-txt {
        }

        /* word of the month */
        &__month-journal {
            
        }
        /* word of the month */
        &__wom {
            padding: 0px 0px 0px 16px;
            position: relative;
            margin: 2px 30px 0px 0px;
            width: 100%;
            
            &--default {
                padding: 0px 30px 0px 13px;
            }
            &--default:before {
                // display: block !important;
            }
            &--img {
                padding: 10px 0px 16px 72px;
                // border: 0.5px solid rgba(var(--textColor1), 0.04);
                margin-left: -10px;
                // background-color: rgba(var(--textColor1), 0.0145);
                border-radius: 15px;
            }
            &--img &-img {
                display: block;
            }
            &:before {
                // display: none;
                content: " ";
                width: 2px;
                height: calc(100% - 25px);
                @include abs-top-left(13px, 13px);
                background-color: rgba(var(--textColor1), 0.09);
            }
            p:not(:first-of-type) {
                margin-top: 7px;
            }
        }
        &__word {
            @include text-style(1, 500, 1.5rem);
            margin-right: 10px;
        }
        &__word-type {
            @include text-style(0.4, 500, 1.5rem);
        }
        &__word-def {
            @include text-style(0.315, 400, 1.5rem);
            margin-top: 6px;
            width: calc(100% - 160px);
            max-width: 720px;
        }
        &__wom-img {
            @include abs-top-left(13px, 28px);
            height: 28px;
            width: 28px;
            display: none;

            img {
                border-radius: 3px;
                height: 100%;
                width: 100%;
                object-fit: cover;
            }
        }
    }

    .dmenu {
        overflow: visible;
        padding-bottom: 10px;
        &__section-name {
            margin-bottom: 1px;
        }
        &__option {
            overflow: visible;
        }
        &__toggle-optn {
            padding: 6px 7px 5px 7px;
            width: 100%;
            @include flex(center, space-between);
        }
        &__section-divider:last-child {
            display: none;
        }
        &__boxes {
            display: flex;
            margin: 6px 0px 10px 4px;
        }
        &__box {
            padding: 8px 7px 10px 11px;
            border-radius: 12px;
            flex-direction: column;
            width: calc(50% - 22px);
            @include flex(flex-start);
            background: rgba(var(--textColor1), 0.025);
            box-shadow: rgba(var(--textColor1), 0.05) 0px 0px 0px 1px inset;
            
            &--selected {
                box-shadow: rgba(var(--fgColor1), 0.8) 0px 0px 0px 2px inset, 
                            rgba(var(--fgColor1), 0.1) 0px 0px 0px 2px;
            }
            &--selected &-title {
                color: rgba(var(--fgColor1));
            }
            &:active {
                transform: scale(0.98);
            }
            &:hover {
                background: rgba(var(--textColor1), 0.035);
            }
            &:first-child {
                margin-right: 4px;
            }
        }
        &__box-title {
            @include text-style(0.75, 400, 1.2rem, "DM Mono");
        }
        &__box-text {
            @include text-style(0.35, 400, 1.2rem);
            margin-top: 4px;
        }
    }

    /* margin components */
    .habits {
        &__details {
            margin: 0px 0px 10px 0px;
            padding: 0px 0px 10px 0px;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.06);
        }
        &__stat {
            @include flex(center, space-between);
            margin-bottom: 8px;

            &:last-child {
                margin-bottom: 4px;
            }
        }
        span {
            @include text-style(0.3, 500, 1.4rem);
            
            &:last-child {
                @include text-style(0.5, 400, 1.4rem, "DM Mono");
            }
        }
    }

    .goals-list {
        margin-top: 10px;
    }
    .goal-item {
        @include flex(center);
        margin-bottom: 13px;
        transition: 0.18s cubic-bezier(.4, 0, .2, 1);
        position: relative;

        &:active {
            transform: scale(0.995);
        }
        &:hover &__title {
            opacity: 0.7 !important;
        }
        &__symbol {
            margin-right: 15px;
            font-size: 1.4rem;
            overflow: hidden;
        }
        &__title {
            @include text-style(1, 500, 1.4rem);
            cursor: pointer;
            opacity: 0.55;
            position: relative;
            padding-bottom: 1px;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.18);
        }
        &__title.strike {
            opacity: 0.25 !important;
        }
        i {
            font-size: 1.4rem;
            opacity: 0.4;
            @include abs-top-right(0px, 0px)
        }
    }

    .insight-sentence {
        @include text-style(0.6, 500, 1.45rem);
        margin: 2px 0px 8px 0px;
        
        strong {
            @include text-style(0.75, 400, 1.4rem, "DM Sans");
            margin: 0px 2px 2px 2px;
        }
    }


</style>