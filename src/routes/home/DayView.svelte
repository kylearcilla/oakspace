<script lang="ts">
	import { onDestroy } from "svelte"
    import { themeState, weekRoutine } from "$lib/store"
    
	import { Icon, LogoIcon } from "$lib/enums"
	import { hexToRgb } from "$lib/utils-colors"
	import { isSameDay } from "$lib/utils-date"
	import { getElapsedTime } from "$lib/utils-date"
	import { globalContext, timer } from "$lib/store"
	import { formatDatetoStr } from "$lib/utils-date"
	import { findClosestColorSwatch } from "$lib/utils-colors"
	import { loadSideBarView, saveSideBarView } from "$lib/utils-home"
    
    import { TodosManager } from "$lib/todos-manager"
	import { SideCalendar } from "$lib/side-calendar"
	import { initGoogleCal } from "$lib/api-google-calendar"
	import { authGoogleCalendar } from "$lib/api-google-calendar"
	import { GoogleCalendarManager } from "$lib/google-calendar-manager"
	import { getOAuthRedirectData, removeOAuthRedirectData } from "$lib/utils-home"
    
	import Todos from "./Todos.svelte";
	import DayView from "./DayViewContent.svelte"
	import Logo from "$components/Logo.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import Calendar from "$components/Calendar.svelte"
	import ToggleBtn from "$components/ToggleBtn.svelte"
	import BounceFade from "$components/BounceFade.svelte"

    const OVERVIEW_SIDE_MARGINS = 4
    const DAY_VIEW_SIDE_MARGINS = 14
    const NOW_TIME_THRESHOLD_SECS = 5

    export let headerOptions: {
        img: string
        show: boolean
    }
    export let onHeaderOptions: (optn: string) => void

    let calendar = new SideCalendar()
    let { view, calView } = loadSideBarView()
    let focusDate  = new Date()
    let now = new Date()
    let calendarHt = 0
    let settings = false

    /* tasks */
    let todosManager = new TodosManager()
    let removeCompleteFlag = false
    let hasCompletedTasks = false
    let t_lastSyncTime: Date | null = null
    
    $: tm = todosManager.store
    $: onTodoist = $tm.onTodoist
    $: todoistLinked = $tm.todoistLinked

    /* routines */
    let checkbox = false
    let richColors = false

    $: routine = $weekRoutine
    $: isLight = !$themeState.isDarkTheme
    $: ambience = $globalContext.ambience
    
    /* google calendar */
    let googleCal: GoogleCalendarManager | null = initGoogleCal()
    let g_Day = new Date()
    let g_lastSyncTime: Date | null = null
    
    let googleCalendars: GoogleCalendar[] = []
    let googleEvents: GoogleCalendarEvent[] = []
    let calsMenu  = false

    $: gCalState = googleCal?.state
    
    /* apis */
    $: t_loading = $tm.loading
    $: t_syncLoading = t_loading === "sync"
    
    $: g_loading = $gCalState?.loading
    $: g_syncLoading = g_loading === "sync"
    $: g_tokenExpired = $gCalState?.tokenExpired
    $: gCalSignedIn = $gCalState?.signedIn

    $: onAPI = (view === "tasks" && onTodoist) || (view === "cal" && calView === "g-cal" && gCalSignedIn)
    $: saveSideBarView({ view, calView })
    
    $: if (googleCal) {
        googleCal.state.subscribe((state) => onGoogleCalUpdate(state))
    }
    todosManager.store.subscribe(() => {
        t_lastSyncTime = todosManager?.lastSyncTimeStamp
    })

    const unsubscribe = timer.subscribe(({ date }) => {
        now = date
        // if ($tm?.onTodoist) {
        //     todosManager.autoRefreshHandler(date)
        // }
        // if (gCalSignedIn) {
        //     googleCal!.watchUpcomingEvents()
        //     calView === "g-cal" && googleCal!.autoRefreshHandler(focusDate)
        // }

        if ($tm?.todoistLinked) {
            todosManager.autoRefreshHandler(date)
        }
        if (gCalSignedIn) {
            googleCal!.watchUpcomingEvents()
            googleCal!.autoRefreshHandler(focusDate)
        }
    })

    function onDayUpdate(date: Date) {
        const tokenExpired = g_tokenExpired
        if (!gCalSignedIn || !tokenExpired) {
            focusDate = date
        }
        if (view === "tasks") {
            view = "cal"
        }
        if (calView === "g-cal") {
            getCalEvents(date)
        }
    }
    /* api */
    function handleTodoistLogin() {
        todosManager.loginTodoist()
        settings = false
    }
    async function refreshSync(api: "todoist" | "google-cal") {
        if (api === "todoist") {
            todosManager.refreshTodoist()
        }
        else if (api === "google-cal") {
            googleCal!.refreshDayEvents(focusDate)
        }
    }
    /* google calendar */
    function onGoogleCalUpdate(state: GoogleCalendarState) {
        const { tokenExpired, signedIn } = state
        g_lastSyncTime = googleCal!.lastSyncTimeStamp

        if (signedIn && getOAuthRedirectData("gcal")) {
            calView = "g-cal"
            removeOAuthRedirectData("gcal")
        }
        if (g_tokenExpired && !tokenExpired && signedIn && !g_loading) {
            focusDate = new Date()
            googleCal!.updateDayEvents(new Date())
        }
        if (googleCal!.calendars) {
            googleCalendars = googleCal!.calendars
            googleEvents = googleCal!.setEventStyles()
        }
    }
    async function getCalEvents(newDay: Date) {
        if (g_tokenExpired || g_loading) {
            g_tokenExpired && googleCal!.refreshAccessToken()
            return
        }
        try {
            googleCal!.updateDayEvents(newDay)
        }
        catch (e) {
            googleCal!.onError({ error: e })
        }
    }
    function onGoogleCalendarClicked(id: string) {
        if (g_loading) return

        googleCalendars = googleCal!.toggleViewCalendar(id) ?? []
        googleEvents    = googleCal!.events
    }
    async function onCalSettingsHandler(optnText: "refresh" | "disconnect" | "my calendars") {
        const isLoading = g_loading
        calsMenu = false
        settings = false

        if (optnText === "refresh" && !isLoading) {
            googleCal!.refreshAccessToken()
        }
        else if (optnText === "disconnect") {
            googleCal!.quit()
            gCalSignedIn = false
            googleCal = null
            googleCalendars = []
            googleEvents = []
            calView = "routine"
        }
        else if (optnText === "my calendars" && $gCalState) {
            calsMenu = true
        }
    }

    /* utils */
    function getLastSyncTime(lastSync: Date | null) {
        if (!lastSync) return ""
        
        const str = getElapsedTime({ 
            start: lastSync, end: new Date(), min: true 
        })
        if (str.includes("s")) {
            return parseInt(str) < NOW_TIME_THRESHOLD_SECS ? "Now" : "<1m"
        }
        else {
            return str
        }
    }
    function _hexToRgb(hex: string) {
        return hexToRgb({ hex, format: "str" }) as string
    }

    onDestroy(() => unsubscribe())
</script>

<div 
    class="day-view" 
    class:day-view--light={isLight}
    style:--OVERVIEW_SIDE_MARGINS={`${OVERVIEW_SIDE_MARGINS}px`}
    style:--DAY_VIEW_SIDE_MARGINS={`${DAY_VIEW_SIDE_MARGINS}px`}
    style:--api-offset-top={onAPI ? "42px" : "0px"}
>
    <div class="day-view__calendar-container" bind:clientHeight={calendarHt}>
        <Calendar 
            {calendar} 
            {focusDate}
            isDisabled={!!g_loading}
            onDayUpdate={onDayUpdate}
        />
    </div>
    <div class="day-view__day" style:height={`calc(100% - ${calendarHt}px)`}>
        <button 
            class="day-view__day-settings-btn" 
            id="day-view--dbtn"
            on:click={() => settings = !settings}
        >
            <SvgIcon icon={Icon.Settings} options={{ opacity: 1, scale: 0.9 }} />
        </button>
        <div class="day-view__day-header">
            <span>
                {#if view === "cal"}
                    {formatDatetoStr(focusDate, { month: "long", day: "numeric" })}
                {:else}
                    Tasks
                {/if}
            </span>
        </div>

    <div class="day-view__main-content">
        {#if view === "cal"}
            <DayView
                {richColors}
                {checkbox}
                view={calView}
                day={focusDate}
                googleCals={googleCalendars}
                googleEvents={googleEvents}
            />
        {:else}
            <Todos
                {removeCompleteFlag}
                manager={todosManager}
                onTaskComplete={(completed) => hasCompletedTasks = completed > 0} 
            />
        {/if}
    </div>

    {#if onAPI}
        {@const api = view === "cal" ? "google-cal" : "todoist"}
        {@const logo = api === "google-cal" ? LogoIcon.GoogleCal : LogoIcon.Todoist}
        {@const scale = api === "google-cal" ? 0.785 : 1.065}
        {@const title = api === "google-cal" ? "Calendar" : "Inbox"}
        {@const isLoading = api === "google-cal" ? g_syncLoading : t_syncLoading}
        {@const lastSync = api === "google-cal" ? g_lastSyncTime : t_lastSyncTime}
        {@const tokenExpired = api === "google-cal" && g_tokenExpired}

        <div class="day-view__api" data-api={api}>
            <div class="flx-algn-center">
                <Logo 
                    logo={logo}
                    options={{
                        containerWidth: "20px", iconWidth: "100%", scale
                    }}
                />
                <span
                    style:--shimmer-text-width="50px"
                    class:shimmer-anim={isLoading}
                >
                    {isLoading ? "Syncing..." : title}
                </span>
            </div>
            <div class="day-view__api-sync">
                {#key now}
                    <span title={tokenExpired ? "Token Expired" : "Last Sync"}>
                        {tokenExpired ? "!" : getLastSyncTime(lastSync)}
                    </span>
                {/key}
                <button 
                    title="Sync"
                    disabled={isLoading}
                    on:click={() => refreshSync(api)}
                >
                    <i 
                        class="fa-solid fa-arrows-rotate"
                        class:sync-loading={isLoading}
                    >
                    </i>
                </button>
            </div>
        </div>
    {/if}

    <!-- google cals -->
    <BounceFade 
        isHidden={!calsMenu}
        position={{ top: "20px", right: "12px" }}
        zIndex={200}
        onClickOutside={() => calsMenu = false}
    >
        {#if $gCalState}
            {@const { loading, tokenExpired } = $gCalState}
            <div class="google-cals" id="day-view--dmenu">
                <div class="google-cals__header">
                    <span>
                        Your Calendars
                    </span>
                </div>
                <ul class="google-cals__list">
                    {#each googleCalendars as cal}
                        {@const colorSwatch = findClosestColorSwatch(cal.color.bgColor)}
                        {@const isDisabled = !!loading || tokenExpired}
                        {@const color = _hexToRgb(colorSwatch.primary)}

                        <li title={cal.title}>
                            <button 
                                disabled={isDisabled}
                                class="google-cals__cal"
                                class:google-cals__cal--unchecked={!cal.isChecked}
                                on:click={() => onGoogleCalendarClicked(cal.id)}
                            >
                                <div class="google-cals__cal-color" style:--cal-color={color}>
                                </div>
                                <div class="google-cals__cal-name">
                                    {cal.title}
                                </div>
                            </button>
                        </li>
                    {/each}                        
                </ul>
            </div>
        {/if}
    </BounceFade>

    <!-- settings -->
    <BounceFade 
        isHidden={!settings}
        zIndex={200}
        position={{ top: "20px", right: "12px" }}
        onClickOutside={() => settings = false}
    >
        <div 
            class="dmenu"
            class:dmenu--light={isLight}
            id="day-view--dmenu"
        >
            <!-- view -->
            <li class="dmenu__section">
                <div style:display="flex" style:margin="5px 0px 10px 7px">
                    <!-- <span class="dmenu__option-heading">View</span> -->
                    <button 
                        class="dmenu__box" 
                        class:dmenu__box--selected={view === "cal"}
                        on:click={() => {
                            view = "cal"
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
                    <div class="dmenu__section-name">
                        Tasks
                    </div>
                    {#if todoistLinked}
                        <div class="dmenu__option">
                            <button 
                                class="dmenu__option-btn"
                                on:click={() => {
                                    todosManager.toggleView()
                                    settings = false
                                }}
                            >
                                <span class="dmenu__option-text">
                                    {onTodoist ? "Switch to Inbox" : "Switch to Todoist"}
                                </span>
                            </button>
                        </div>
                    {/if}
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
                </li>
                <div class="dmenu__section-divider" class:hidden={hideTasks}></div>
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
                                    todosManager.refreshTodoist()
                                    settings = false
                                }}
                            >
                                <span class="dmenu__option-text">
                                    Refresh
                                </span>
                            </button>
                        </div>
                        <div class="dmenu__option">
                            <button 
                                class="dmenu__option-btn"
                                on:click={() => {
                                    todosManager.logoutTodoist()
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
                                on:click={() => handleTodoistLogin()}
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
            {#if view === "cal"}
                <li class="dmenu__section-divider"></li>
                <!-- routine -->
                <li class="dmenu__section">
                    <div class="dmenu__section-name">
                        Routine
                    </div>
                    {#if calView === "g-cal" && routine}
                        <div class="dmenu__option">
                            <button 
                                class="dmenu__option-btn"
                                on:click={() => {
                                    calView = "routine"
                                    settings = false
                                    g_Day = focusDate
                                }}
                            >
                                <span class="dmenu__option-text">
                                    Open
                                </span>
                            </button>
                        </div>
                    {:else if routine}
                        <div class="dmenu__toggle-optn">
                            <span class="dmenu__option-heading">Checkbox</span>
                            <ToggleBtn 
                                active={checkbox}
                                onToggle={() => checkbox = !checkbox}
                            />
                        </div>
                        <div class="dmenu__toggle-optn" class:hidden={calView === "g-cal"}>
                            <span class="dmenu__option-heading">Colors</span>
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
                    {#if calView === "routine" && gCalSignedIn}
                        <div class="dmenu__option">
                            <button 
                                class="dmenu__option-btn"
                                on:click={() => {
                                    calView = "g-cal"
                                    settings = false

                                    if (!isSameDay(focusDate, g_Day)) {
                                        g_Day = focusDate
                                        getCalEvents(focusDate)
                                    }
                                }}
                            >
                                <span class="dmenu__option-text">
                                    Open
                                </span>
                            </button>
                        </div>
                    {:else if gCalSignedIn}
                        {#if g_tokenExpired}
                            <div class="dmenu__option">
                                <button 
                                    on:click={() => onCalSettingsHandler("refresh")}
                                    class="dmenu__option-btn"
                                >
                                    <span class="dmenu__option-text">
                                        Refresh Token
                                    </span>
                                </button>
                            </div>
                        {/if}
                        <div class="dmenu__toggle-optn" class:hidden={calView === "routine"}>
                            <span class="dmenu__option-heading">Colors</span>
                            <ToggleBtn 
                                active={richColors}
                                onToggle={() => richColors = !richColors}
                            />
                        </div>
                        <div class="dmenu__option">
                            <button 
                                on:click={() => onCalSettingsHandler("my calendars")}
                                class="dmenu__option-btn"
                            >
                                <span class="dmenu__option-text">
                                    Calendars
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
                                on:click={() => {
                                    settings = false
                                    authGoogleCalendar()
                                }}
                                class="dmenu__option-btn"
                            >
                                <span class="dmenu__option-text">
                                    Connect
                                </span>
                            </button>
                        </div>
                    {/if}
                </li>
            {/if}

            {#if !isLight && !ambience?.active}
                {@const { img, show } = headerOptions}
                {@const optnText = img ? "Replace" : "Add"}
            
                <!-- header image -->
                <li class="dmenu__section-divider"></li>
                <li class="dmenu__section">
                    <div class="dmenu__section-name">
                        Header Background
                    </div>
                    <div class="dmenu__option">
                        <button 
                            class="dmenu__option-btn"
                            on:click={() => {
                                onHeaderOptions(optnText.toLowerCase())
                                settings = false
                            }}
                        >
                            <span class="dmenu__option-text">
                                {optnText}
                            </span>
                        </button>
                    </div>
                    <div class="dmenu__toggle-optn  dmenu__option--static">
                        <span class="dmenu__option-heading">Show</span>
                        <ToggleBtn 
                            active={show}
                            onToggle={() => onHeaderOptions("show")}
                        />
                    </div>
                </li>
            {/if}
        </div>
    </BounceFade>
    </div>
</div>

<style lang="scss">
    @import "../../scss/day-box.scss";
    @import "../../scss/dropdown.scss";

    $hour-block-height: 45px;

    .day-view {
        margin-top: -5px;
        height: 100%;
        overflow: hidden;

        &--light &__day-header span {
            @include text-style(0.85);
        }
        &--light &__day-settings-btn {
            background-color: rgba(var(--textColor1), 0.1);
            opacity: 0.4;

            &:hover {
                opacity: 0.9;
            }
        }
        &__calendar-container {
            margin: 0px 0px 0px 0px;
            padding: 0px var(--OVERVIEW_SIDE_MARGINS);
            height: 230px;
        }
        &__day {
            width: 100%;
            height: 100%;
            position: relative;
        }
        &__day-header {
            @include flex(center, space-between);
            position: relative;
            padding: 0px var(--DAY_VIEW_SIDE_MARGINS);
            margin: 0px 0px 5px 1px;

            span {
                margin-top: 0px;
                @include text-style(0.35, var(--fw-400-500), 1.25rem, "Geist Mono");
            }
        }
        &__day-settings-btn {
            background-color: rgba(var(--textColor1), 0.05);
            opacity: 0.3;
            @include circle(20px);
            @include abs-top-right(-3px, 10px);
            z-index: 1;

            &:hover {
                opacity: 0.5;
            }
        }
        &__main-content {
            overflow: scroll;
            height: calc(100% - var(--api-offset-top));
        }
        &__api {
            @include flex(center, space-between);
            @include text-style(0.35, var(--fw-400-500), 1.32rem);
            @include abs-bottom-left(7px, 1px);
            width: 100%;
            padding: 0px 0px 13px 7px;
            z-index: 100;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.06);
            height: 50px;

            span {
                margin-left: 6px;
            }
        }
        &__api-sync {
            @include flex(center);
        }
        &__api-sync span {
            margin-right: 12px;
            @include text-style(0.125, var(--fw-400-500), 1.3rem, "system");
        }
        &__api-sync button {
            @include circle(25px);
            @include flex(center);
            font-size: 1.35rem;
            margin-right: 5px;
            color: rgba(var(--textColor1), 0.85);
            opacity: 0.2;
            
            &:hover {
                opacity: 0.9;
            }
        }
    }

    .sync-loading {
        animation: spin 1s linear infinite;
        transform-origin: center;

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg); 
            }
        }
    }

    .dmenu {
        width: 168px;
        &__toggle-optn {
            padding: 6px 7px 7px 7px;
            width: 100%;
            @include flex(center, space-between);
        }
        &__section-name {
            margin-bottom: 2px;
        }
        &__section-divider:last-child {
            display: none;
        }
    }

    .google-cals {
        @include contrast-bg("bg-2");
        border-radius: 15px;
        width: 200px;

        span {
            @include text-style(0.3, var(--fw-400-500), 1.25rem);
            display: block;
            padding: 9px 16px 0px 14px;
            margin-right: 4px;
        }
        &__header {
            @include flex(center, space-between);
        }
        &__list {
            margin: 5.5px 0px 0px 0px;
            width: 100%;
            overflow-y: scroll;
            padding-bottom: 7px;
            margin-bottom: 6px;

            li {
                width: 100%;
            }
        }
        &__cal {
            @include flex(center);
            padding: 6px 16px 6px 10px;
            border-radius: 8px;
            margin-left: 5px;
            width: calc(100% - 37px);
            cursor: pointer;
            transition: 0s;

            &:active {
                transition: 0.1s cubic-bezier(.4,0,.2,1);
                transform: scale(0.998);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.027);
            }
            &--unchecked:hover &-color {
                background-color: rgba(var(--cal-color), 0.5) !important;
            }
            &--unchecked &-name {
                opacity: 0.4;
            }
            &--unchecked &-color {
                opacity: 0.2;
                background-color: transparent;
                box-shadow: none;
            }
        }
        &__cal-color {
            @include square(12px, 4.5px);
            margin-right: 12px;
            background-color: rgba(var(--cal-color));
            border: 1.5px solid rgba(var(--cal-color));

            box-shadow: var(--bg-2) 0px 0px 0px 1.5px, 
                        rgba(var(--cal-color), 0.2) 0px 0px 0px 3px;
        }
        &__cal-name {
            @include text-style(0.9, var(--fw-400-500), 1.35rem);
            @include elipses-overflow;
        }
    }
</style>