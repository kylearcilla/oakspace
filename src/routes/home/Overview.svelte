<script lang="ts">
    import { themeState, weekRoutine } from "$lib/store"

	import { Icon } from "$lib/enums"
	import { formatDatetoStr } from "$lib/utils-date"
	import { clickOutside } from "$lib/utils-general"
	import { didTodoistAPIRedirect } from "$lib/api-todoist"
    import { TasksViewManager } from "$lib/tasks-view-manager"
	import { findClosestColorSwatch } from "$lib/utils-colors"
	import { SideCalendar } from "$lib/side-calendar"
	import { GoogleCalendarManager, initGoogleCalSession } from "$lib/google-calendar-manager"
    
	import Todos from "./Todos.svelte";
	import OverviewDayView from "./OverviewDayView.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import Calendar from "../../components/Calendar.svelte"
	import ToggleBtn from "../../components/ToggleBtn.svelte"
	import BounceFade from "../../components/BounceFade.svelte"

    const OVERVIEW_SIDE_MARGINS = 6
    const DAY_VIEW_SIDE_MARGINS = 17

    type GoogleCalOptn = "refresh" | "disconnect" | "my calendars"

    export let calendar = new SideCalendar()

    let focusDate  = new Date()
    let calendarHt = 0

    /* day overview */
    let view: "calendar" | "tasks" = didTodoistAPIRedirect() ? "tasks" : "calendar"
    let dayOptn: "routine" | "calendar" | null = "routine"

    /* routines */
    let checkbox = false
    let richColors = false
    $: routine = $weekRoutine
    $: isLight = !$themeState.isDarkTheme

    /* google calendar */
    let googleCal         = initGoogleCalSession()
    let googleCalDate     = new Date()
    let isGoogleCalLinked = googleCal?.signedIn
    let settings = false
    let calendarsMenu  = false
    let googleCalState = googleCal?.state ?? null

    let googleCalendars: GoogleCalendar[]   = googleCal?.calendars ?? []
    let googleEvents: GoogleCalendarEvent[] = googleCal?.events ?? []

    /* tasks */
    let tasksManager = new TasksViewManager()
    let removeCompleteFlag = false
    let hasCompletedTasks = false

    $: tm = tasksManager.store
    $: onTodoist = $tm.onTodoist
    $: todoistLinked = $tm.todoistLinked

    weekRoutine.subscribe((state) => {
        if (!state && isGoogleCalLinked)  {
            dayOptn = "calendar"
        }
        else if (state) {
            dayOptn = "routine"
        }
        else {
            dayOptn = null
        }
    })

    /* google calendar*/
    function onDayUpdate(date: Date) {
        const tokenExpired = $googleCalState?.tokenExpired

        if (!isGoogleCalLinked || !tokenExpired) {
            focusDate = date
        }
        if (view === "tasks") {
            view = "calendar"
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
        settings = false
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
    async function onCalSettingsHandler(optnText: GoogleCalOptn) {
        const isLoading = $googleCalState?.isLoading
        const isExpired = $googleCalState?.tokenExpired
        calendarsMenu = false
        settings = false

        if (optnText === "refresh" && !isExpired && !isLoading) {
            await googleCal!.refreshData()
            googleCalendars = googleCal!.calendars
            googleEvents = googleCal!.events
        }
        else if (optnText === "refresh" && !isLoading) {
            googleCal!.refreshAccessToken()
        }
        else if (optnText === "disconnect") {
            googleCal!.quit()
            isGoogleCalLinked = false

            googleCal = null
            googleCalendars = []
            googleEvents = []

            dayOptn = $weekRoutine ? "routine" : null
        }
        else if (optnText === "my calendars" && $googleCalState) {
            calendarsMenu = true
        }
    }
</script>

<div 
    class="overview" 
    class:overview--light={isLight}
    style:--OVERVIEW_SIDE_MARGINS={`${OVERVIEW_SIDE_MARGINS}px`}
    style:--DAY_VIEW_SIDE_MARGINS={`${DAY_VIEW_SIDE_MARGINS}px`}
>
    <!-- Calendar -->
    <div
        class="overview__calendar-container"
        bind:clientHeight={calendarHt}
    >
        <Calendar 
            focusDate={isGoogleCalLinked ? googleCalDate : focusDate}
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
        <div class="overview__day-view-btns">
            <button 
                class="overview__day-view-settings-btn" 
                id="overview--dbtn"
                on:click={() => settings = !settings}
            >
                <SvgIcon icon={Icon.Settings} options={{ opacity: 1, scale: 0.9 }} />
            </button>
        </div>
        <div class="overview__day-view-header">
            <span>
                {#if view === "calendar"}
                    {formatDatetoStr(focusDate, { month: "long", day: "numeric" })}
                {:else}
                    Tasks
                {/if}
            </span>
    </div>

        <!-- Content -->
        {#if view === "calendar"}
            <OverviewDayView
                {dayOptn}
                {richColors}
                {checkbox}
                day={focusDate}
                googleCals={googleCalendars}
                googleEvents={googleEvents}
            />
        {:else}
            <Todos
                {removeCompleteFlag}
                manager={tasksManager}
                onTaskComplete={(completed) => hasCompletedTasks = completed > 0} 
            />        
        {/if}

        <!-- User's Google Calendars -->
        <BounceFade 
            isHidden={!calendarsMenu}
            position={{ top: "20px", right: "12px" }}
            zIndex={200}
        >
            <div 
                class="google-cals"
                id="overview--dmenu"
                use:clickOutside on:click_outside={() => {
                    calendarsMenu = false
                }} 
            >
                <div class="google-cals__header">
                    <span>
                        {googleCal?.email}
                    </span>
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

        <!-- Day View Settings -->
        <BounceFade 
            isHidden={!settings}
            zIndex={200}
            position={{ 
                top: "20px", right: "12px"
            }}
        >
            <div 
                class="dmenu dmenu"
                id="overview--dmenu"
                use:clickOutside on:click_outside={() => {
                    settings = false
                }} 
            >
                <!-- view -->
                <li class="dmenu__section">
                    <div style:display="flex" style:margin="5px 0px 10px 7px">
                        <!-- <span class="dmenu__option-heading">View</span> -->
                        <button 
                            class="dmenu__box" 
                            class:dmenu__box--selected={view === "calendar"}
                            on:click={() => {
                                view = "calendar"
                                settings = false
                            }}
                        >
                            <div class="dmenu__box-icon">
                                <i class="fa-regular fa-calendar-days"></i>
                            </div>
                            <span>Calendar</span>
                        </button>
                        <button 
                            class="dmenu__box" 
                            class:dmenu__box--selected={view === "tasks"}
                            on:click={() => {
                                view = "tasks"
                                settings = false
                            }}
                        >
                            <div class="dmenu__box-icon">
                                <i class="fa-solid fa-list-check"></i>
                            </div>
                            <span>Tasks</span>
                        </button>
                    </div>
                </li>
                
                <!-- tasks -->
                {#if view === "tasks"}
                    {@const hideTasks = !hasCompletedTasks && !todoistLinked}
                    <li class="dmenu__section-divider"></li>
                    <!-- completed -->
                    <li 
                        class="dmenu__section" 
                        class:hidden={!hasCompletedTasks && !todoistLinked}
                    >
                        {#if hasCompletedTasks}
                            <div class="dmenu__option">
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        removeCompleteFlag = !removeCompleteFlag
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        Remove Completed
                                    </span>
                                </button>
                            </div>
                        {/if}
                        {#if todoistLinked}
                            <div class="dmenu__option">
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        tasksManager.toggleView()
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        {onTodoist ? "Switch to Inbox" : "Switch to Todoist"}
                                    </span>
                                </button>
                            </div>
                        {/if}
                    </li>
                    <div class="dmenu__section-divider" class:hidden={hideTasks}>
                    </div>
                    <!-- todoist -->
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            Todoist
                        </div>

                        {#if todoistLinked}
                            <div class="dmenu__option">
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        tasksManager.logoutTodoist()
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        Log Out
                                    </span>
                                </button>
                            </div>
                        {:else}
                            <div class="dmenu__option">
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        tasksManager.loginTodoist()
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        Link Account
                                    </span>
                                </button>
                            </div>
                        {/if}
                    </li>
                {/if}

                <!-- calendar -->
                {#if view === "calendar"}
                    <li class="dmenu__section-divider"></li>
                    {#if routine && isGoogleCalLinked}
                        <!-- Content -->
                        <li class="dmenu__section">
                            <div class="dmenu__section-name">
                                Content
                            </div>
                            <div 
                                class="dmenu__option"
                                class:dmenu__option--selected={dayOptn === "routine"}
                            >
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        dayOptn = "routine"
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        Routine
                                    </span>
                                    <div class="dmenu__option-right-icon-container">
                                        <div 
                                            class="dmenu__option-icon"
                                            class:dmenu__option-icon--check={true}
                                        >
                                            <i class="fa-solid fa-check"></i> 
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <div 
                                class="dmenu__option"
                                class:dmenu__option--selected={dayOptn === "calendar"}
                            >
                                <button 
                                    class="dmenu__option-btn"
                                    on:click={() => {
                                        dayOptn = "calendar"
                                        settings = false
                                    }}
                                >
                                    <span class="dmenu__option-text">
                                        Calendar
                                    </span>
                                    <div class="dmenu__option-right-icon-container">
                                        <div 
                                            class="dmenu__option-icon"
                                            class:dmenu__option-icon--check={true}
                                        >
                                            <i class="fa-solid fa-check"></i> 
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </li>
                        <li class="dmenu__section-divider"></li>
                    {/if}

                    <!-- routine -->
                    <li class="dmenu__section">
                        <div 
                            title="Current set routine"
                            class="dmenu__section-name"
                        >
                            {routine?.name ?? "Routine"}
                        </div>
                        {#if routine}
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-text">
                                    Checkbox
                                </span>
                                <ToggleBtn 
                                    active={checkbox}
                                    onToggle={() => checkbox = !checkbox}
                                />
                            </div>
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-text">
                                    Rich Colors
                                </span>
                                <ToggleBtn 
                                    active={richColors}
                                    onToggle={() => richColors = !richColors}
                                />
                            </div>
                        {:else}
                            <div class="dmenu__toggle-optn">
                                <span class="dmenu__option-text">
                                    No Set Routine
                                </span>
                            </div>
                        {/if}
                    </li>
                    <li class="dmenu__section-divider"></li>
    
                    <!-- google calendar -->
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            Google Calendar
                        </div>
                        {#if isGoogleCalLinked}
                            <div class="dmenu__option">
                                <button 
                                    on:click={() => onCalSettingsHandler("my calendars")}
                                    class="dmenu__option-btn"
                                >
                                    <span class="dmenu__option-text">
                                        My Calendars
                                    </span>
                                </button>
                            </div>
                            <div class="dmenu__option">
                                <button 
                                    on:click={() => onCalSettingsHandler("refresh")}
                                    class="dmenu__option-btn"
                                >
                                    <span class="dmenu__option-text">
                                        {$googleCalState?.tokenExpired ? "Refresh Token" : "Refresh"}
                                    </span>
                                </button>
                            </div>
                            <div class="dmenu__option">
                                <button 
                                    on:click={() => onCalSettingsHandler("disconnect")}
                                    class="dmenu__option-btn"
                                >
                                    <span class="dmenu__option-text">
                                        Disconnect
                                    </span>
                                </button>
                            </div>
                        {:else}
                            <div class="dmenu__option">
                                <button 
                                    on:click={() => connectGoogleCal()}
                                    class="dmenu__option-btn"
                                >
                                    <span class="dmenu__option-text">
                                        Connect
                                    </span>
                                </button>
                            </div>
                        {/if}
                    </li>
                    <li class="dmenu__section-divider"></li>
                {/if}
                
            </div>
        </BounceFade>
    </div>
</div>


<style lang="scss">
    @import "../../scss/day-box.scss";
    @import "../../scss/dropdown.scss";

    $hour-block-height: 45px;

    .overview {
        margin-top: -5px;
        height: 100%;

        &--light &__day-view-header span {
            @include text-style(0.7, 600);
        }
        &--light &__day-view-settings-btn {
            background-color: rgba(var(--textColor1), 0.1);
            opacity: 0.4;

            &:hover {
                opacity: 0.9;
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
        &--light &__day-view-btns button {
            font-weight: 500;
        }

        &__calendar-container {
            margin: 0px 0px 0px 0px;
            padding: 0px var(--OVERVIEW_SIDE_MARGINS);
            height: 223px;
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
            margin: 0px 0px 6px 1px;

            span {
                @include text-style(0.35, 400, 1.2rem, "DM Mono");
            }
        }
        &__day-view-settings-btn {
            background-color: rgba(var(--textColor1), 0.05);
            opacity: 0.3;
            @include circle(20px);
            @include abs-top-right(-3px, 10px);
            z-index: 1;

            &:hover {
                opacity: 0.5;
            }
        }
        &__day-view-btn {
            border-radius: 12px;
            margin-right: 9px;
            opacity: 0.15;
            @include text-style(1, 400, 1.2rem, "DM Mono");

            &:hover {
                opacity: 0.4;
            }
            &--active {
                opacity: 0.8 !important;
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
            &:last-child {
                margin-right: 0px;
            }
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

    .dmenu {
        width: 168px;
        span {
            @include text-style(0.78, 500, 1.2rem);
        }
        &__box {
            height: 62px;
            margin-right: 7px;
            border-radius: 8px;
            text-align: center;
            width: 50%;
            background-color: rgba(var(--textColor1), 0.02);

            &:hover {
                box-shadow: rgba(#FFFFFF, 0.05) 0px 0px 0px 2px inset, 
                            rgba(#FFFFFF, 0.02) 0px 0px 0px 2.5px;
                background-color: rgba(var(--textColor1), 0.03);
            }
            &--selected {
                box-shadow: rgba(#0C8CE9, 0.35) 0px 0px 0px 2px inset, 
                            rgba(#0C8CE9, 0.1) 0px 0px 0px 2.5px !important;
                background-color: rgba(var(--textColor1), 0.02) !important;
            }
            &--selected i,
            &--selected span {
                opacity: 1 !important;
                color: #0C8CE9 !important;
            }
            i {
                font-size: 1.5rem;
                margin-bottom: 6px;
                opacity: 0.2;
            }
            span {
                @include text-style(_, 400, 1.1rem, "DM Mono");
                opacity: 0.65;
            }
        }
        &__toggle-optn {
            padding: 6px 7px 7px 7px;
            width: 100%;
            @include flex(center, space-between);

            span {
                opacity: 0.65;
            }
        }
        &__section-name {
            margin-bottom: 2px;
        }
        &__section-divider:last-child {
            display: none;
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