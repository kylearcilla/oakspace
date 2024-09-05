<script lang="ts">
    import { onMount } from "svelte";
	import { themeState } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { formatDatetoStr, isSameDay } from "$lib/utils-date"
	import { ProductivityCalendar } from "$lib/productivity-calendar"
	import { GoogleCalendarManager, initGoogleCalSession } from "$lib/google-calendar-manager"
	import { clickOutside } from "$lib/utils-general"
	import { findClosestColorSwatch } from "$lib/utils-colors"
	import { TEST_SESSIONS, TEST_TAGS } from "$lib/mock-data"
    
	import OverviewDayView from "./OverviewDayView.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import Calendar from "../../components/Calendar.svelte"
	import DropdownList from "../../components/DropdownList.svelte"
	import BounceFade from "../../components/BounceFade.svelte"

    const OVERVIEW_SIDE_MARGINS = 8
    const DAY_VIEW_SIDE_MARGINS = 17

    type ViewOption = "sessions" | "goals" | "calendar"

    export let calendar: ProductivityCalendar

    let focusDate  = new Date()
    let calendarHt = 0
    let viewing: ViewOption = "sessions"
    
    /* day overview */
    let sessions: Session[] = TEST_SESSIONS
    let goals: any[] = [
        { title: "Finish East of Eden", due: { date: new Date(2024, 6, 2), type: "month" }, tag: TEST_TAGS[2] },
        { title: "Run 7 Minute Mile", due: { date: new Date(2024, 7), type: "yr" }, tag: TEST_TAGS[0] },
        { title: "Finish SWE Project", due: { date: new Date(2024, 11), type: "month" }, tag: TEST_TAGS[1] }
    ]
    
    /* google calendar */
    let googleCal         = initGoogleCalSession()
    let googleCalDate     = new Date()
    let isGoogleCalLinked = googleCal?.signedIn
    let googleCalDropdown = false
    let googleCalSettings = false
    let googleCalState    = googleCal?.state ?? null

    let googleCalendars: GoogleCalendar[]   = googleCal?.calendars ?? []
    let googleEvents: GoogleCalendarEvent[] = googleCal?.events ?? []

    $: isLightTheme = !$themeState.isDarkTheme
    $: calendar?._store.subscribe((newCalendar: ProductivityCalendar) => {
        calendar = newCalendar
    }) 

    function onViewBtnClicked(view: ViewOption) {
        const isOnCal      = viewing === "calendar" && view === "calendar"
        const toCalLinked  = isGoogleCalLinked && view === "calendar"
        const tokenExpired = $googleCalState?.tokenExpired

        viewing = view

        if (!isGoogleCalLinked && isOnCal) {
            googleCalSettings = !googleCalSettings
        }
        if (isGoogleCalLinked && isOnCal) {
            googleCalDropdown = !googleCalDropdown
        }
        if (toCalLinked && !isSameDay(googleCalDate, focusDate)) {
            getNewEvents(focusDate)
        }
        if (toCalLinked && tokenExpired) {
            focusDate = googleCalDate
        }
    }

    /* google calendar*/
    function onDayUpdate(date: Date) {
        const tokenExpired = $googleCalState?.tokenExpired

        if (["sessions", "goals"].includes(viewing) || !isGoogleCalLinked || !tokenExpired) {
            focusDate = date
        }
        if (viewing === "calendar" && isGoogleCalLinked) {
            getNewEvents(date)
        }
    }
    async function getNewEvents(newDay: Date) {
        const tokenExpired = $googleCalState?.tokenExpired
        if (!tokenExpired) {
            googleCalDate = newDay
        }

        // only get new events if google cal is synced AND in view
        googleEvents = await googleCal!.setEventElements(googleCalDate)
    }
    async function connectGoogleCal() {
        googleCalSettings = false
        googleCal = new GoogleCalendarManager()
        await googleCal.init()

        googleCalendars = googleCal.calendars
        googleEvents = googleCal.renderEvents()
        isGoogleCalLinked = true
    }
    function onGoogleCalendarClicked(id: string) {
        if ($googleCalState?.isLoading) return

        googleCalendars = googleCal!.toggleViewCalendar(id) ?? []
        googleEvents    = googleCal!.events
    }
    async function onCalSettingsHandler(optnText: string) {
        googleCalDropdown = false
        googleCalSettings = false
        const isLoading = $googleCalState?.isLoading

        if (optnText === "Refresh Calendar" && !isLoading) {
            await googleCal!.refreshData()
            googleCalendars = googleCal!.calendars
            googleEvents = googleCal!.events
        }
        else if (optnText === "Refresh Token" && !isLoading) {
            googleCal!.refreshAccessToken()
        }
        else if (optnText === "Disconnect") {
            googleCal!.quit()
            isGoogleCalLinked = false

            googleCal = null
            googleCalendars = []
            googleEvents = []
        }
    }

    onMount(() => {

    })
</script>

<div 
    class="overview" 
    class:overview--light={isLightTheme}
    style:--OVERVIEW_SIDE_MARGINS={`${OVERVIEW_SIDE_MARGINS}px`}
    style:--DAY_VIEW_SIDE_MARGINS={`${DAY_VIEW_SIDE_MARGINS}px`}
>
    <!-- Calendar -->
    <div
        class="overview__calendar-container"
        bind:clientHeight={calendarHt}
    >
        <Calendar 
            focusDate={viewing === "calendar" && isGoogleCalLinked ? googleCalDate : focusDate}
            isDisabled={$googleCalState?.isLoading}
            onDayUpdate={onDayUpdate}
            calendar={calendar} 
        />
    </div>
    <!-- Day View Header -->
    <div 
        class="overview__day-view"
        style:height={`calc(100% - ${calendarHt}px)`}
    >
        <div class="overview__day-view-header">
            <span>
                {formatDatetoStr(focusDate, { month: "short", day: "numeric" })}
            </span>
            <div class="overview__day-view-btns">
                <button
                    title="Sessions" 
                    class="overview__day-view-btn"
                    class:overview__day-view-btn--active={viewing === "sessions"}
                    on:click={() => onViewBtnClicked("sessions")}
                >
                    <i class="fa-brands fa-readme"></i>
                </button>
                <button
                    title="Goals" 
                    class="overview__day-view-btn"
                    class:hidden={goals.length === 0}
                    class:overview__day-view-btn--active={viewing === "goals"}
                    on:click={() => onViewBtnClicked("goals")}
                >
                    <i class="fa-solid fa-bullseye"></i>
                </button>
                <button
                    title="Google Calendar"
                    id="google-cal--dropdown-btn"
                    class="overview__day-view-btn"
                    class:overview__day-view-btn--active={viewing === "calendar"}
                    class:overview__day-view-btn--dropdown-active={googleCalDropdown}
                    on:click={() => onViewBtnClicked("calendar")}
                >
                    <img 
                        src="https://cdn.iconscout.com/icon/free/png-256/free-google-calendar-2923652-2416655.png?f=webp" 
                        alt="google-calendar"
                    >
                    <div class="overview__day-view-btn-arrow">
                        <SvgIcon 
                            icon={Icon.Dropdown}
                            options={{
                                scale: 1.1, height: 12, width: 12, 
                                strokeWidth: 1.3, opacity: 0.2
                            }}
                        />
                    </div>
                </button>
            </div>
        </div>

        <!-- Day View -->
        <OverviewDayView
            {viewing}
            {sessions}
            {goals}
            day={focusDate}
            googleCals={googleCalendars}
            googleEvents={googleEvents}
        />

        <!-- User's Google Calendars -->
        <BounceFade 
            isHidden={!isGoogleCalLinked || !googleCalDropdown}
            position={{ top: "25px", right: "5px" }}
            zIndex={200}
        >
            <div 
                class="google-cals"
                id="google-cal--dropdown-menu"
                use:clickOutside on:click_outside={() => {
                    googleCalDropdown = false
                }} 
            >
                <div class="google-cals__header">
                    <span>
                        {googleCal?.email}
                    </span>
                    <button 
                        class="google-cals__settings-btn" 
                        id="google-cal-settings--dropdown-btn"
                        on:click={() => {
                            googleCalSettings = !googleCalSettings
                        }}
                    >
                        <SvgIcon 
                            icon={Icon.Settings} options={{ opacity: 0.9, scale: 0.9 }} 
                        />
                    </button>
                </div>
                <ul class="google-cals__list">
                    {#each googleCalendars as cal}
                        {@const colorSwatch = findClosestColorSwatch(cal.color.bgColor)}
                        {@const isDisabled = $googleCalState?.isLoading || $googleCalState?.tokenExpired}
                        <li>
                            <button 
                                class="google-cals__cal"
                                class:google-cals__cal--unchecked={!cal.isChecked}
                                disabled={isDisabled}
                                on:click={() => {
                                    onGoogleCalendarClicked(cal.id)
                                }}
                            >
                                <div 
                                    class="google-cals__cal-color"
                                    style:--cal-color={colorSwatch.primary}
                                >
                                </div>
                                <div class="google-cals__cal-name">
                                    {cal.title}
                                </div>
                            </button>
                        </li>
                    {/each}                        
                </ul>
            </div>
        </BounceFade>

        <!-- Google Cal Signed In Settings -->
        <DropdownList 
            id={"google-cal-settings"}
            isHidden={!isGoogleCalLinked || !googleCalSettings} 
            options={{
                listItems: [
                    { name: $googleCalState?.tokenExpired ? "Refresh Token" : "Refresh Calendar" },
                    { name: "Disconnect" }
                ],
                position: { top: "28px", right: "5px"},
                styling:  { 
                    width: "140px",
                    fontSize: "1.2rem",
                    zIndex: 500
                },
                onListItemClicked: (context) => {
                    onCalSettingsHandler(context.name)
                },
                onClickOutside: () => {
                    googleCalSettings = false
                }
            }}
        />

        <!-- Google Cal Signed Out Settings -->
        <DropdownList 
            id={"google-cal"}
            isHidden={isGoogleCalLinked || !googleCalSettings} 
            options={{
                listItems: [{ 
                    name: "Sync Google Calendar",
                }],
                position: { top: "28px", right: "5px"},
                styling:  { 
                    width: "160px",
                    fontSize: "1.2rem"
                },
                onListItemClicked: () => {
                    connectGoogleCal()
                },
                onClickOutside: () => {
                    googleCalSettings = false
                }
            }}
        />
    </div>
</div>


<style lang="scss">
    @import "../../scss/day-box.scss";

    $hour-block-height: 45px;

    .overview {
        margin-top: -5px;
        height: 100%;

        &--light &__day-view-header {
            margin-bottom: 5px;

            span {
                @include text-style(0.7, 500);
            }
        }
        &--light &__hour-block {
            span {
                @include text-style(0.55, 500);
            }

            &-hoz-divider path {
                @include txt-color(0.2, "stroke");
                stroke-width: 0.85px;
            }
            &-vert-divider path {
                @include txt-color(0.2, "stroke");
                stroke-width: 1px;
            }
        }
        &--light &__session {
            border-color: transparent;

            &--magnify {
                box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.1);
            }

            &-title {
                @include text-style(0.72, 500);
            }
            &-time-period span {
                @include text-style(0.4, 500);
            }
        }

        &__calendar-container {
            margin: 0px 0px 7px 0px;
            padding: 0px var(--OVERVIEW_SIDE_MARGINS);
            height: 230px;
        }
        &__day-view {
            width: 100%;
            height: 100%;
            position: relative;
        }
        &__day-view-header {
            @include flex(center, space-between);
            position: relative;
            height: 18px;
            padding: 0px var(--DAY_VIEW_SIDE_MARGINS);

            span {
                @include text-style(0.3, 400, 1.14rem, "DM Sans");
            }
        }
        &__day-view-btns {
            @include flex(center);
        }
        &__day-view-btn {
            background-color: rgba(var(--textColor1), 0.03);
            border: 1px solid rgba(var(--textColor1), 0.03);
            padding: 5.5px 9px 5.5px 9px;
            border-radius: 12px;
            margin-right: 3px;
            @include flex(center);
            opacity: 0.6;

            &:hover, &--active {
                opacity: 1;
                background-color: rgba(var(--textColor1), 0.05);
            }
            &--active i {
                opacity: 0.9 !important;
            }
            &--dropdown-active &-arrow {
                transform: rotate(180deg);
            }
            i {
                opacity: 0.4;
                font-size: 1.05rem;
            }
            img {
                filter: saturate(0);
                height: 17px;
                margin-right: 3px;
            }
            &:last-child {
                padding: 1.5px 5px 2.5px 6.5px;
                margin-right: 0px;
            }
        }
        &__day-view-btn-arrow {
            transition: 0.15s cubic-bezier(.4,0,.2,1);
            transform-origin: center;
            transform: rotate(0deg);
        }
        &__event-list-container {
            width: 100%;
            position: relative;
            overflow-y: scroll;
            height: calc(100% - 40px);
            display: flex;

            &::-webkit-scrollbar {
                display: none;
            }
        }
    }
    .google-cals {
        background-color: var(--bg-3);
        border: 1px solid rgba(var(--textColor1), 0.02);
        border-radius: 15px;
        width: 200px;

        span {
            @include text-style(0.3, 400, 1.2rem);
            display: block;
            padding: 8px 16px 0px 14px;
            margin-right: 4px;
        }

        &__header {
            @include flex(center, space-between);
        }
        &__settings-btn {
            @include circle(20px);
            @include center;
            background-color: rgba(var(--textColor1), 0.05);
            margin: 6px 6px 0px 0px;
            opacity: 0.5;

            &:hover {
                opacity: 1;
            }
        }
        &__list {
            margin: 5.5px 0px 0px 0px;
            width: 100%;
            // max-height: 100px;
            overflow-y: scroll;
            padding-bottom: 7px;
            margin-bottom: 6px;

            li {
                width: 100%;
            }
        }
        &__cal {
            @include flex(center);
            padding: 5px 16px 5px 10px;
            border-radius: 8px;
            margin-left: 5px;
            width: calc(100% - 37px);
            cursor: pointer;
            transition: 0s;

            &:active {
                transition: 0.1s cubic-bezier(.4,0,.2,1);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.027);
            }
            &--unchecked:hover &-color {
                background-color: rgba(var(--cal-color), 0.3);
            }
            &--unchecked &-name {
                opacity: 0.4;
            }
            &--unchecked &-color {
                opacity: 0.2;
                background-color: transparent;
            }
        }
        &__cal-color {
            height: 10px;
            width: 10px;
            border-radius: 4px;
            margin-right: 12px;
            background-color: rgba(var(--cal-color));
            border: 1px solid rgba(var(--cal-color));
        }
        &__cal-name {
            @include text-style(0.9, 500, 1.13rem);
        }
        &__cal-eye {
            float: right;
            opacity: 0;
        }
    }
</style>