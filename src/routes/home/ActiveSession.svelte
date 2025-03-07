<script lang="ts">
	import { goto } from "$app/navigation"
	import { setSessionLocation } from "$lib/utils-home"
	import { globalContext, sessionManager, themeState } from "$lib/store"
    
    import { Icon } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { secsToHhMmSs } from "$lib/utils-date"
	import { SessionManager } from "$lib/session-manager"
	import { capitalize, formatPlural, getFontFromStyle } from "$lib/utils-general"

	import SvgIcon from "$components/SVGIcon.svelte"
	import SessionProgress from "./SessionProgress.svelte"
	import TasksList from "$components/TasksList.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    $: manager = $sessionManager
    $: session = manager?.session
    $: state = manager?.state
    $: mode = session?.mode

    $: context = $globalContext
    $: ambience = context.ambience?.active
    $: styling = ambience ? context.ambience?.styling ?? "" : ""
    $: light = !$themeState.isDarkTheme
    $: location = context.sessionLocation

    $: totalFocusTime = manager?.totalFocusTime ?? 0
    $: totalBreakTime = manager?.totalBreakTime ?? 0
    $: pauseCount = manager?.pauseCount ?? 0

    $: transition = state?.startsWith("to-")
    $: pom = session?.mode === "pom"
    $: disabled = transition

    $: timeSize = location === "workspace" ? 12 : 8.8

    let focusTimeWidth = 0
    let breakTimeWidth = 0
    
    let width = 0
    let holding = false
    let dropdown = false
    let confirmModalOpen = false
    let newTaskFlag = false
    
    let closing = false
    let fontStylesOpen = false

    let tasksContainer: HTMLElement
    let rightContainerRef: HTMLElement

    function getPrevPage(prevPage: string) {
        if (!prevPage) return "Home"

        const name = prevPage === "/home" ? "Home" : prevPage.split("/")[2]
        return capitalize(name)
    }
    function backToPrevPage() {
        goto(manager!.prevPage)
    }
    function onFontStyleOptnClicked(optn: string) {
        manager!.updateFontStyle(optn as FontStyle)
    }
    function toggleState() {
        if (state === "focus") {
            manager!.stateTransition("break")
        }
        else if (state === "break") {
            manager!.stateTransition("focus")
        }
    }
    function onListItemClicked(optn: string) {
        if (optn === "Cancel Session") {
            cancelSession()
        }
        else if (optn === "Finish Session") {
            finishSession()
        }
        else if (optn === "Move to Default") {
            setSessionLocation("default")
        }
        else if (optn === "Move to Workspace") {
            setSessionLocation("workspace")
            goto("/home/space")
        }
    }

    /* conclusion */
    function cancelSession() {
        backToPrevPage()
        manager!.quit()

        toast("info", { message: "Session cancelled." })
    }
    function finishSession(doCount = true) {
        backToPrevPage()

        if (doCount) {
            manager!.finish()
            goto(location === "default" ? "/home" : "/home/space")
        }
        else {
            manager!.quit()
            toast("info", { message: "Session not counted." })
        }
    }
    
    /* hold button */
    function onHoldDown(pe: PointerEvent) {
        if (pe.button === 2 || disabled) return
        holding = true
    }
    function onHoldUp(pe: PointerEvent) {
        if (pe.button === 2 || disabled) return
        holding = false
    }
    function onHoldEnd() {
        holding = false

        if (mode === "flow") {
            toggleState()
        }
        else if (manager!.elapsedSecs < SessionManager.MIN_SESSION_TIME_MINS * 60) {
            confirmModalOpen = true
        }
        else {
            finishSession()
        }
    }
    function onPointerUp() {
        if (holding) {
            holding = false
        }
    }
    function onMouseLeave() {
        if (holding) {
            holding = false
        }
    }
</script>

{#if manager && session}
    {@const { isPlaying, minUi, fontStyle, showTasks, visualizer } = manager}
    {@const prevPage = getPrevPage(manager.prevPage)}
    {@const name = $themeState.current.name}
    {@const defaultTheme = !light && name === "dark"}
    {@const { scaleFactor, fam } = getFontFromStyle(fontStyle || "default")}
    <div 
        bind:clientWidth={width}
        bind:this={rightContainerRef}
        class="session"
        class:session--no-tasks={showTasks}
        class:session--min-ui={minUi}
        class:session--light={light}
        class:session--workspace={location === "workspace"}
        style:--focus-time-color={defaultTheme ? "var(--textColor1)" : "var(--ringColor)"}
    >
        <button 
            class="session__back-btn"
            on:click={() => backToPrevPage()}
            class:hidden={location === "workspace"}
        >
            <SvgIcon 
                icon={Icon.ChevronLeft}
                options={{ scale: 0.97, strokeWidth: 2 }}
            />
            <span>
                Back to {prevPage === "Base" ? "Home" : prevPage}
            </span>
        </button>

        <div class="session__content">
            <div 
                bind:clientWidth={focusTimeWidth}
                class="session__focus-time" 
                title="Total focus time."
                style:font-family={fam}
                style:font-size={`${scaleFactor * timeSize}rem`}
                style:min-width={`${focusTimeWidth}px`}
            >
                {secsToHhMmSs(totalFocusTime)}
            </div>

            <div class="session__details">
                {#if minUi}
                    <div class="session__detail">
                        {state === "focus" ? "Focused" : "On Break"}
                    </div>
                {:else}
                    <div 
                        bind:clientWidth={breakTimeWidth}
                        class="session__detail" 
                        title="Total inactive time."
                        style:min-width={`${breakTimeWidth}px`}
                    >
                        {secsToHhMmSs(totalBreakTime)}
                    </div>
                    <div class="divider"></div>
                    <div class="session__detail">
                        {state === "focus" ? "Focused" : "On Break"}
                    </div>
                    <div class="divider"></div>
                    <div class="session__detail">
                        {#if session.mode === "pom"}
                            {@const { focusCount, breakCount } = manager}
                            {focusCount + 1}<span style:margin="0px 5px" style:font-size="1.7rem">×</span>{breakCount}
                        {:else if pauseCount > 100}
                            100+ Pauses
                        {:else}
                            {formatPlural("Pause", pauseCount)}
                        {/if}
                    </div>
                {/if}
            </div>

            {#if visualizer}
                <div class="session__visualizer">
                    <SessionProgress {width}/>
                </div>
            {/if}

            <div class="session__controls">
                <button
                    class="session__control-btn" 
                    class:ambient-blur={styling != "clear"}
                    class:ambient-clear={styling === "clear"}
                    disabled={disabled || state === "break"}
                    style:width="50px"
                    on:click={() => manager.togglePlay()}
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                    class="session__control-btn hold-btn" 
                    class:hold-btn--holding={holding}
                    class:ambient-blur={styling != "clear"}
                    class:ambient-clear={styling === "clear"}
                    disabled={disabled}
                    on:pointerup={onPointerUp} 
                    on:mouseleave={onMouseLeave}
                    on:pointerdown={onHoldDown}
                    on:pointerup={onHoldUp}
                    on:animationend={onHoldEnd}
                >
                    <div class="hold-btn__cover">
                        {pom ? "Done" : state === "focus" ? "Break" : "Focus"}
                    </div>
                    {pom ? "Done" : state === "focus" ? "Break" : "Focus"}
                </button>
                <div style:position="relative">
                    <button
                        id="session--dbtn"
                        class:ambient-blur={styling != "clear"}
                        class:ambient-clear={styling === "clear"}
                        on:click={() => dropdown = !dropdown}
                    >
                        <SvgIcon 
                            icon={Icon.Settings} 
                            options={{ opacity: 0.5, scale: 1.28 }} 
                        />
                    </button>
                    <DropdownList 
                        id={"session"}
                        isHidden={!dropdown} 
                        options={{
                            listItems:
                            [
                                { 
                                    name: "Show Tasks",
                                    active: !showTasks,
                                    onToggle: () => manager.toggleTasks()
                                }, 
                                { 
                                    name: "Minimize UI",
                                    active: !minUi,
                                    onToggle: () => manager.toggleMinUi()
                                },
                                { 
                                    name: "Visualizer",
                                    active: visualizer,
                                    divider: true,
                                    onToggle: () => manager.toggleVisualizer()
                                },
                                {
                                    name: location === "workspace" ? "Move to Default" : "Move to Workspace",
                                },
                                { 
                                    name: "Change Font Style",
                                    divider: true,
                                    rightIcon: { 
                                        type: "svg",
                                        icon: Icon.ChevronRight
                                    },
                                    onPointerOver: () => {
                                        fontStylesOpen = closing ? false : true
                                    },
                                    onPointerLeave: () => {
                                        fontStylesOpen = false
                                    }
                                },
                                ...(mode === "flow" ? [{ name: "Finish Session" }] : []),
                                { 
                                    name: "Cancel Session" 
                                }
                            ],
                            position: { 
                                top: "36px", 
                                left: "-56px"
                            },
                            parentContext: {
                                container: rightContainerRef,
                                childId: "font-styles"
                            },
                            onListItemClicked: ({ name }) => {
                                onListItemClicked(name)
                            },
                            onClickOutside: () => {
                                dropdown = false
                            }
                        }}
                    />

                    <DropdownList 
                        id={"font-styles"}
                        isHidden={!fontStylesOpen || !dropdown}
                        options={{
                            pickedItem: manager.fontStyle,
                            listItems: [
                                { name: "Default" },
                                { name: "Stylish" },
                                { name: "Fancy" },
                                { name: "Cute" },
                            ],
                            onListItemClicked: ({ name }) => {
                                closing = true
                                fontStylesOpen = false
                                onFontStyleOptnClicked(name.toLowerCase())
                            },
                            position: { 
                                top: "140px", 
                                left: "105px",
                            },
                            parent: {
                                id: "goals-menu",
                                optnIdx: 2,
                                optnName: "Change Status"
                            },
                            onDismount: () => {
                                closing = false
                            },
                            onPointerLeave: () => {
                                fontStylesOpen = false
                            }
                        }}
                    />
                </div>
            </div>
            <div class="session__tasks">
                <div class="session__tasks-container" bind:this={tasksContainer}>
                    {#if tasksContainer}
                        <TasksList
                            {newTaskFlag}
                            allowInitTasksCall={false}
                            tasks={session.todos}
                            onTaskChange={(_tasks) => {
                                manager.updateTasks(_tasks)
                            }}
                            options={{
                                id: "session-todos",
                                hotkeyFocus: "default",
                                context: "modal",
                                settings: {
                                    checkSubtasks: false,
                                    allowDuplicate: false,
                                    removeOnComplete: false,
                                    max: 20,
                                    addBtn: {
                                        doShow: true,
                                    },
                                    maxDepth: 4
                                },
                                ui: { 
                                    sidePadding: "15px",
                                    fontSize: "1.45rem",
                                    borderRadius: "5px",
                                    hasTaskDivider: true
                                },
                                rootRef: tasksContainer
                            }}
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

{#if confirmModalOpen} 
    <ConfirmationModal 
        text={`Sessions must be at least ${SessionManager.MIN_SESSION_TIME_MINS} minutes long to count. <br><br>Are you sure you want to finish?`}
        onCancel={() => confirmModalOpen = false}
        onOk={() => finishSession(false)}
    /> 
{/if}

<style lang="scss">
    .session {
        padding: 10px 0px 0px 0px;
        height: 100%;
        width: 100%;
        position: relative;

        --contorl-btn-oapcity: 0.03;
        
        &--light &__controls button {
            --contorl-btn-oapcity: 0.07;
        }
        &--light &__details {
            @include text-style(0.7);
        }
        &--light &__details .divider {
            background-color: rgba(var(--textColor1), 0.15);
        }
        &--no-tasks &__content {
            margin-top: 16vh;
        }
        &--no-tasks &__focus-time {
            font-size: 10rem;
        }
        &--no-tasks &__details {
            font-size: 1.65rem;
        }
        &--no-tasks &__tasks { 
            height: 0px;
            width: 0px;
            @include not-visible;
        }

        &__back-btn {
            @include text-style(1, var(--fw-500-600), 1.35rem);
            @include flex(center);
            @include abs-top-left(25px, 16px);
            opacity: 0.12;
            margin-right: 8px;

            &:hover {
                opacity: 0.45;
            }
            span {
                margin-left: 10px;
            }
        }
        &__content {
            margin-top: 80px;
            @include center;
            flex-direction: column;
        }
        &__focus-time {
            color: rgba(var(--focus-time-color));
            font-weight: var(--fw-500-600);
            text-align: center;
        }
        &__details {
            @include flex(center, space-between);
            @include text-style(0.25, var(--fw-400-500), 1.65rem);
            margin: 14px 0px 20px 0px;
            white-space: nowrap;
            display: flex;
        }
        &__details .divider {
            height: 12px;
            width: 1.5px;
            background-color: rgba(var(--textColor1), 0.055);
            margin: 0px 16px;
        }
        &__visualizer {
            margin: 15px 0px 20px 0px;
            width: 100%;
            @include center;
        }
        &__controls {
            margin-top: 13px;
            @include flex(center);

            button {
                background: rgba(var(--textColor1), var(--contorl-btn-oapcity)) !important;
                @include center;
            }
            button:hover {
                background: rgba(var(--textColor1), calc(var(--contorl-btn-oapcity) * 2)) !important;
            }
            #session--dbtn {
                @include circle(32px);
            }
        }
        &__control-btn {
            @include text-style(0.45, var(--fw-400-500), 1.45rem, "Geist Mono");
            padding: 5px 20px 7px 20px;
            border-radius: 20px;
            margin-right: 7px;

            &:disabled {
                opacity: 0.55;
                cursor: not-allowed !important;
            }
        }
        &__tasks {
            width: clamp(520px, 65%, 600px);
            margin-top: 20px;
        }
        &__tasks-container {
            height: 500px;
            max-height: 800px;
        }
    }

    .hold-btn {
        background: rgba(var(--textColor1), 0.02);
        position: relative;
        overflow: hidden;

        &--holding &__cover {
            display: flex;
            animation: hold-confirm 1500ms forwards;
        }
        &__cover {
            width: 100%;
            height: 100%;
            text-align: center;
            @include center;
            @include abs-center;

            -webkit-mask-image: linear-gradient(to right, rgb(var(--focus-time-color)) 0%, rgb(var(--focus-time-color)) 50%, transparent 50%, transparent 100%);
                    mask-image: linear-gradient(to right, rgb(var(--focus-time-color)) 0%, rgb(var(--focus-time-color)) 50%, transparent 50%, transparent 100%);

            -webkit-mask-size: 200% 100%;
                    mask-size: 200% 100%;

            -webkit-mask-position: right;
                    mask-position: right;

            background-color: rgba(var(--focus-time-color), 1) !important;
            color: var(--bg-1);

            display: none;
        }
    }

    @keyframes hold-confirm {
        100% {
            -webkit-mask-position: left;
                    mask-position: left;
        }
    }
</style>