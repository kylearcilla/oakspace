<script lang="ts">
	import { Icon } from "$lib/enums"
	import { globalContext, themeState } from "$lib/store"
	import { formatDateLong, formatDatetoStr } from "$lib/utils-date"
	import { getElemById, getVertScrollStatus } from "$lib/utils-general"
	import { onMount } from "svelte";
	import SvgIcon from "../../components/SVGIcon.svelte"

    enum DueDateType {
        Full, Month, Year
    }
    enum ListType {
        Habits, Goals, MindNotes
    }
    type GradientListElem = { 
        hasSpaceAbove: boolean, hasSpaceBelow: boolean, gradientStyle: string 
    }
    const GRADIENT_STYLES = {
        spaceAboveBelow: "linear-gradient(180deg, transparent 0%, black 10%, black 80%, transparent 100%)",
        spaceAbove: "linear-gradient(180deg, transparent 0%, black 10%)",
        spaceBelow: "linear-gradient(180deg, black 64%, transparent 100%)"
    }

    export let options: DashboardOptions

    let currListHtChange: ListType | null = null

    const GOALS_LEFT_MARGIN = 17
    const GOALS_RIGHT_MARGIN = 13

    const INIT_MIND_NOTES_HT_PERC = 0
    const MIN_MIND_NOTES_HT_PERC = 1
    const MAX_MIND_NOTES_HT_PERC = 60

    const INIT_HABITS_HT_PERC = 25
    const MIN_HABITS_HT_PERC = 1
    const MAX_HABITS_HT_PERC = 30

    let habitsList = { hasSpaceAbove: false, hasSpaceBelow: true, gradientStyle: "" }
    let goalsList = { hasSpaceAbove: false, hasSpaceBelow: true, gradientStyle: "" }

    let dashboardWt = 0
    let dashboardHt = 0
    let isViewingHabits = true
    let doHideMindNotes = true

    let habitsHeightPerc = INIT_HABITS_HT_PERC
    let _habitsHeightPerc = INIT_HABITS_HT_PERC
    let mindNotesHeightPerc = INIT_MIND_NOTES_HT_PERC
    let _mindNotesHeightPerc = INIT_MIND_NOTES_HT_PERC

    let dragStartYPos = -1
    let dragYOffSet: number | null = null
    let isLeftBarFloating = false

    $: if (dragYOffSet != null) {
        if (currListHtChange === ListType.Habits) {
            updateHabitsHt()
        }
        if (currListHtChange === ListType.MindNotes) {
            updateMindNotesHt()
        }
    }
    $: if ($themeState && getElemById("list--0")) {
        requestAnimationFrame(() => updateListGradients())
    }
    $: if ($globalContext.isLeftBarFloating != isLeftBarFloating) {
        isLeftBarFloating = $globalContext.isLeftBarFloating 

        requestAnimationFrame(() => updateListGradients())
    }

    const habits = [
        { title: "🌤️ Wake Up Early", metric: "6:34 AM", isDone: false, isLate: false },
        { title: "📖 Read something", metric: "25 pages", isDone: false, isLate: false },
        { title: "🇫🇷 French", metric: null, isDone: true, isLate: false },
        { title: "📱 ≤ 4h Screen Time", metric: null, isDone: true, isLate: false },
        { title: "💪 Workout", metric: null, isDone: false, isLate: true },
        { title: "💪 Workout", metric: null, isDone: false, isLate: true },
        { title: "💪 Workout", metric: null, isDone: false, isLate: true },
    ]

    const goals = [
        { title: "Finish East of Eden", due: { date: new Date(2024, 6, 2), type: DueDateType.Full }, percentageDone: 52 },
        { title: "Finish Tiny House", due: { date: new Date(2024, 7), type: DueDateType.Month }, percentageDone: 91 },
        { title: "Finish SWE Project", due: { date: new Date(2024, 11), type: DueDateType.Year }, percentageDone: 11 },
        { title: "Complete LOTR Trilogy", due: { date: new Date(2024, 4), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
        { title: "Reach A2 in French", due: { date: new Date(2024, 9), type: DueDateType.Month }, percentageDone: 33 },
    ]

    const quotes = [ 
        { text: "Be as you wish to seem" },
        { text: "The success you've been looking for is hidden in the work you've been avoiding." },
    ]

    function updateMindNotesHt(doSave = false) {
        const percChange = (dragYOffSet! / dashboardHt) * 100
        let newPerc = _mindNotesHeightPerc + percChange
        let isValidPerc = newPerc >= MIN_MIND_NOTES_HT_PERC && newPerc < MAX_MIND_NOTES_HT_PERC

        if (!isValidPerc) {
            doHideMindNotes = newPerc < MIN_MIND_NOTES_HT_PERC
            newPerc = newPerc < MIN_MIND_NOTES_HT_PERC ? MIN_MIND_NOTES_HT_PERC : MAX_MIND_NOTES_HT_PERC
        }
        else {
            doHideMindNotes = false
        }

        if (doSave) _mindNotesHeightPerc = newPerc
        
        mindNotesHeightPerc = newPerc
    }
    function updateHabitsHt(doSave = false) {
        const percChange = (dragYOffSet! / dashboardHt) * 100 * -1
        let newPerc = _habitsHeightPerc + percChange
        let isValidPerc = newPerc >= MIN_HABITS_HT_PERC && newPerc < MAX_HABITS_HT_PERC

        if (!isValidPerc) {
            newPerc = newPerc < MIN_HABITS_HT_PERC ? MIN_HABITS_HT_PERC : MAX_HABITS_HT_PERC
        }

        if (doSave) _habitsHeightPerc = newPerc
        habitsHeightPerc = newPerc
    }
    function updateGradientStyle(listVar: GradientListElem) {
        if (!listVar.hasSpaceAbove && !listVar.hasSpaceBelow) {
            listVar.gradientStyle = ""
        }
        else if (listVar.hasSpaceAbove && listVar.hasSpaceBelow) {
            listVar.gradientStyle = GRADIENT_STYLES.spaceAboveBelow
        }
        else if (listVar.hasSpaceAbove) {
            listVar.gradientStyle = GRADIENT_STYLES.spaceAbove

        }
        else if (listVar.hasSpaceBelow) {
            listVar.gradientStyle = GRADIENT_STYLES.spaceBelow
        }
    }
    function onResizerMouseDown(event: Event, list: ListType) {
        const pe = event as PointerEvent
        event.preventDefault()
        currListHtChange = list
        dragStartYPos = pe.clientY
        initResize()
    }
    function initResize() {
        window.addEventListener("mousemove", onResizerMouseMove);
        window.addEventListener("mouseup", stopResize);
    }
    function onResizerMouseMove(event: Event) {
        const pe = event as MouseEvent
        const newDragYOffSet = pe.clientY

        dragYOffSet = dragStartYPos - newDragYOffSet

        for (let i = 0; i < 2; i++) {
            const listElem = getElemById(`list--${i}`) as HTMLUListElement
            onListScroll(listElem, i)
        }
    }
    function stopResize() {
        if (currListHtChange === ListType.Habits) {
            updateHabitsHt(true)
        }
        else {
            updateMindNotesHt(true)
        }
        dragStartYPos = -1
        dragYOffSet = null
        currListHtChange = null

        window.removeEventListener('mousemove', onResizerMouseMove, false);
        window.removeEventListener('mouseup', stopResize, false);
    }

    function onListScroll(target: EventTarget | HTMLElement | null, list: ListType) {
        if (!$themeState.isDarkTheme || !target) return

        const { hasReachedBottom, hasReachedTop } = getVertScrollStatus(target! as HTMLElement)
        const hasSpaceAbove = !hasReachedTop
        const hasSpaceBelow = !hasReachedBottom

        if (list === ListType.Habits) {
            habitsList = { ...habitsList, hasSpaceAbove, hasSpaceBelow }
            updateGradientStyle(habitsList)
        }
        else {
            goalsList = { ...goalsList, hasSpaceAbove, hasSpaceBelow }
            updateGradientStyle(goalsList)
        }
    }
    function updateListGradients() {
        for (let i = 0; i < 2; i++) {
            const listElem = getElemById(`list--${i}`) as HTMLUListElement
            onListScroll(listElem, i)
        }
    }
    function getDueDate(due: { date: Date, type: DueDateType }) {
        if (due.type === DueDateType.Full) {
            return formatDateLong(due.date)
        }
        else if (due.type === DueDateType.Month) {
            return formatDatetoStr(due.date, { month: "short", year: "numeric" })
        }
        else {
            return formatDatetoStr(due.date, { year: "numeric" })
        }
    }

    function onHabitCheckboxClicked(idx: number) {
        habits[idx].isDone = !habits[idx].isDone
    }

    onMount(() => {
        updateListGradients()
    })
</script>

<div 
    class="dashboard"
    class:dashboard--min={options.type === "min"}
    class:dashboard--light-theme={!$themeState.isDarkTheme}
    style:--goals-left-margin={`${GOALS_LEFT_MARGIN}px`}
    style:--goals-right-margin={`${GOALS_RIGHT_MARGIN}px`}
    bind:clientHeight={dashboardHt}
    bind:clientWidth={dashboardWt}
>
    {#if options.type != "default"}
        <div class="dashboard__view-tabs">
            <div class="dashboard__view-tabs-btns">
                <button
                    class="dashboard__view-tab"
                    class:dashboard__view-tab--selected={isViewingHabits}
                    on:click={() => isViewingHabits = true}
                >
                    Habits
                </button>
                <button
                    class="dashboard__view-tab"
                    class:dashboard__view-tab--selected={!isViewingHabits}
                    on:click={() => isViewingHabits = false}
                >
                    Goals
                </button>
            </div>
            <div class="dashboard__habits-count">
                33%
            </div>
        </div>
    {/if}
    {#if options.type === "default" || isViewingHabits}
        <div 
            class="dashboard__habits" 
            style:height={`${options.type === "min" ? "100%" :  `${habitsHeightPerc}%`}`}
        >
            <div class="dashboard__habits-header dashboard__subheading-header">
                <h4 class="dashboard__subheading">
                    Your Habits
                </h4>
                <span class="dashboard__habits-count">
                    1/4
                </span>
            </div>
            <ul 
                id="list--0"
                class="dashboard__habits-list" 
                style:webkit-mask-image={habitsList.gradientStyle}
                style:mask-image={habitsList.gradientStyle}
                on:scroll={(event) => onListScroll(event.target, ListType.Habits)}
            >
                {#each habits as habit, idx}
                    <li 
                        class="dashboard__habit"
                        class:dashboard__habit--done={habit.isDone}
                        class:dashboard__habit--late={habit.isLate}
                        title={`${habit.isLate ? "Overdue" : ""}`}
                    >
                        <button 
                            class="dashboard__habit-checkbox" 
                            title={`${habit.isLate ? "Overdue" : ""}`}
                            on:click={() => onHabitCheckboxClicked(idx)}
                        >
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <h5 
                            class="dashboard__habit-title"
                            class:strike={habit.isDone}
                            class:strike--animated={habit.isDone}
                        >
                            {habit.title}
                        </h5>
                        {#if habit.metric}
                            <div class="dashboard__habit-metric">
                                {habit.metric}
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
            <div 
                class="dashboard__resizer dashboard__resizer--habits" 
                class:dashboard__resizer--dragging={dragStartYPos >= 0 && currListHtChange === ListType.Habits}
                on:mousedown={(e) => onResizerMouseDown(e, ListType.Habits)}
            >
                <div class="dashboard__resizer-handle"></div>
            </div>
        </div>
    {/if}
    {#if options.type === "default" || !isViewingHabits}
        {@const resizeHeight = `calc(100% - (${habitsHeightPerc}% + ${mindNotesHeightPerc}% + 35px))`}
        <div 
            class="dashboard__goals" 
            style:height={`${options.type === "min" ? "100%" : `${resizeHeight}`}`}
        >
            <div class="dashboard__subheading-header">
                <div class="dashboard__pin-icon">
                    <SvgIcon 
                        icon={Icon.Pin} 
                        options={{ opacity: $themeState.isDarkTheme ? 0.3 : 0.42, scale: 0.8 }} 
                    />
                </div>
                <h4 class="dashboard__subheading" title="Pinned Goals">
                    Goals
                </h4>
            </div>
            <ul 
                id="list--1"
                class="dashboard__goals-list"
                style={`${$themeState.isDarkTheme ? `-webkit-mask-image: ${goalsList.gradientStyle}; mask-image: ${goalsList.gradientStyle}` : ""}`}
                on:scroll={(event) => onListScroll(event.target, ListType.Goals)}
            >
                {#each goals as goal}
                    {@const width = `calc(${dashboardWt}px - (${GOALS_LEFT_MARGIN}px + ${GOALS_RIGHT_MARGIN}px))`}
                    <li class="dashboard__goal">
                        <div class="dashboard__goal-dotted-line">
                            <svg xmlns="http://www.w3.org/2000/svg" width={width} height="2" viewBox={`0 0 ${width} 2`} fill="none">
                                <path d="M0.274414 1.04004L211 1.04002" stroke-width="0.4" stroke-dasharray="2.85 2.85" />
                            </svg>
                        </div>
                        <div class="dashboard__goal-title">
                            {goal.title}
                        </div>
                        <div class="flx flx--algn-center flx--space-between">
                            <span class="dashboard__goal-due-date">{getDueDate(goal.due)}</span>
                            <span class="dashboard__goal-progress">{goal.percentageDone}%</span>
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>


<style lang="scss">
    $side-padding: 8px;

    .dashboard {
        height: 100%;
        width: 100%;
        position: relative;
        padding: 5px 0px 0px 0px;

        &--light-theme {
            height: calc(100% - 50px);
            padding-top: 0px;
        }
        &--light-theme &__subheading {
            @include text-style(0.85, 500);
        }
        &--light-theme &__habits-count {
            @include text-style(0.4, 500);
        }
        &--light-theme &__habit {
            &-title {
                @include text-style(0.75, 400);
            }
            &-metric {
                @include text-style(0.4, 400);
            }
        }
        &--light-theme &__habit-checkbox {
            @include circle(13.5px);
            border: 1.5px solid rgba(var(--tasksCheckBoxColorDefault), 1);
        }
        &--light-theme &__habit--late &__habit-checkbox {
            background-color: rgba(#D5AE4A, 0.14);
            border: 1.5px solid rgba(#D5AE4A, 0.4);
        }
        &--light-theme &__goal {
            &-title {
                @include text-style(0.78, 500);
            }
            &-due-date {
                @include text-style(0.33, 500);
            }
            &-progress {
                @include text-style(0.4, 500);
            }
            &-dotted-line path {
                stroke: rgba(black, 0.2);
            }
        }
        &--light-theme &__habits {
            margin-bottom: 15px;
        }
        &--light-theme &__goals {
        }
        &--light-theme &__resizer {
            margin-bottom: 12px;
        }
        &--light-theme &__resizer-handle {
            background-color: rgba(var(--textColor1), 0.14);
            margin: 5px 0px 0px 0px;
        }
        &--light-theme &__mind-note {
            @include text-style(0.55, 500);
            background-color: var(--rightBarMindNoteBgColor);
        }
        &--min &__resizer {
            display: none;
        }
        &--min &__subheading-header {
            display: none;
        }
        &--min &__habit {
            &-checkbox {
                @include circle(10.5px);
                margin-right: 12px;
            }
            &-title {
                @include text-style(0.78, 300, 1.2rem);
            }
        }
        &--min &__habits-count {
            margin-right: 13px;
            @include text-style(0.2, 400, 0.97rem, "DM Mono");
            opacity: 0;
        }
        &--min &__goals-list {
            padding-top: 10px;
            max-height: 280px;
        }
        &--min &__goal {
            padding-bottom: 9px;
            &-title {
                font-size: 0.98rem;
                margin-bottom: 5px;
            }
            &-due-date {
                font-size: 0.96rem;
            }
            &-progress {
                font-size: 0.96rem;
            }
            &-dotted-line {
                margin-bottom: 6px;
            }
        }
        &__view-tabs {
            @include flex(center, space-between);
            margin: 0px 0px 4px 16px;
        }
        &__view-tabs-btns {
            @include flex(center);
        }
        &__view-tab {
            @include text-style(0.18, 500, 1.06rem);
            margin-right: 10px;
            
            &:hover {
                @include text-style(0.5);
            }

            &--selected {
                @include text-style(0.5);
            }
        }
        &__subheading {
            @include text-style(0.3, 400, 1.1rem, "DM Sans");
        }
        &__subheading-header {
            @include flex(center);
            margin: 0px 0px 4px $side-padding;
        }
        &__pin-icon {
            margin: -2px 7px -3px 0px;
        }
        /* Habits */
        &__habits {
            margin-bottom: 20px;
            width: calc(100% - 16px);
        }
        &__habits-header {
            margin: 0px 0px 3px var(--goals-left-margin);
            @include flex(center, space-between);
        }
        &__habits-count {
            @include text-style(0.2, 400, 0.9em, "DM Mono");
        }
        &__habits-list {
            overflow-y: scroll;
            padding-top: 10px;
            height: calc(100% - 19.5px);
            margin: 0px 0px 5px var(--goals-left-margin);
        }
        &__habit {
            @include flex(center);
            margin: 0px 0px 8.5px 0px;
            
            // checked
            &--done &-checkbox {
                background-color: var(--tasksCheckBoxColorComplete);
                border-color: transparent;

                i {
                    font-size: 0.8rem;
                    display: block;
                    color: var(--tasksCheckColor);
                }
                &:hover {
                    background-color: var(--tasksCheckBoxColorComplete);
                }
            }
            &--done .strike::after {
                background: rgba(var(--tasksCheckBoxColorDefault), 1);
            }
            &--done &-title {
                @include text-style(0.15);
            }
            &--done &-metric {
                @include text-style(0.1);
            }

            // late
            &--late &-checkbox {
                background-color: rgba(#D5AE4A, 0.055);
                border: 1.5px solid rgba(#D5AE4A, 0.1);
            }
            &--late#{&}--done &-checkbox {
                background-color: var(--tasksCheckBoxColorComplete);
                border-color: transparent;

                &:hover {
                    background-color: var(--tasksCheckBoxColorComplete);
                }
            }
        }
        &__habit-checkbox {
            @include center;
            @include circle(12px);
            margin-right: 14px;
            transition: 0.1s ease-in-out;
            border: 1.5px solid rgba(var(--tasksCheckBoxColorDefault), 1);

            &:hover {
                background-color: rgba(var(--tasksCheckBoxColorDefault), 0.3);
            }
            &:active {
                transform: scale(0.9);
            }

            i {
                display: none;
            }
        }
        &__habit-title {
            transition: 0.1s ease-in-out;
            max-width: 120px;
            margin-right: var(--goals-right-margin);
            @include text-style(0.8, 300, 1.2rem, "DM Sans");
            @include elipses-overflow;
        }
        &__habit-metric {
            display: none;
            @include text-style(0.2, 200, 1.07rem, "DM Sans");
        }
        /* Goals */
        &__goals {
            min-height: 160px;
        }

        &__goals &__subheading-header {
            margin: 0px 0px 2px var(--goals-left-margin);
        }
        &__goals-list {
            overflow-y: scroll;
            height: calc(100% - (18px));
            padding-top: 12px;
        }
        &__goal {
            padding-bottom: 12px;
            cursor: pointer;

            &:hover {
                background-color: var(--sidePanelLightAccentColor);
            }
            &:active {
                transform: scale(0.994);
            }
        }
        &__goal-title {
            @include text-style(0.6, 400, 1.15rem, "DM Sans");
            @include elipses-overflow;
            margin: 0px 0px 5px var(--goals-left-margin);
            cursor: text;
            width: fit-content;
            max-width: 90%;
        }
        &__goal-due-date {
            @include text-style(0.2, 400, 1.03rem, "DM Mono");
            margin-left: var(--goals-left-margin);
            cursor: text;
        }
        &__goal-progress {
            @include text-style(0.15, 400, 1rem, "DM Mono");
            margin-right: 16px;
            cursor: text;
        }
        &__goal-dotted-line {
            height: 2px;
            position: relative;
            margin-left: var(--goals-left-margin);
            margin-bottom: 9px;

            svg {
                @include abs-top-left(-1px);
            }
            path {
                stroke: rgba(white, 0.089);
            }
        }
        /* Handle for adjusting goals / mind notes sections width ratio */
        &__resizer {
            height: 1px;
            cursor: ns-resize;
            padding: 5px 0px;
            // background-color: red;
            
            &--habits {
                margin: 0px 0px 0px var(--goals-left-margin);
                width: calc(100% - var(--goals-left-margin));
            }
            &:hover &-handle, &--dragging &-handle {
                transition: 0.2s ease-in-out 0.08s;
                @include visible;
            }
        }
        &__resizer-handle {
            height: 1px;
            width: 100%;
            transition: 0.1s ease-in-out;
            @include not-visible;
            background-color: rgba(var(--textColor1), 0.06);
        }
    }
</style>