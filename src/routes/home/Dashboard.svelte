<script lang="ts">
	import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { formatDateLong, formatDatetoStr } from "$lib/utils-date"
	import { getElemById, getScrollStatus } from "$lib/utils-general";
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

    let currListHtChange: ListType | null = null

    const INIT_MIND_NOTES_HT_PERC = 17
    const MIN_MIND_NOTES_HT_PERC = 1
    const MAX_MIND_NOTES_HT_PERC = 60

    const INIT_HABITS_HT_PERC = 17
    const MIN_HABITS_HT_PERC = 1
    const MAX_HABITS_HT_PERC = 30

    let habitsList = { hasSpaceAbove: false, hasSpaceBelow: true, gradientStyle: "" }
    let goalsList = { hasSpaceAbove: false, hasSpaceBelow: true, gradientStyle: "" }
    let mindNotesList = { hasSpaceAbove: false, hasSpaceBelow: true, gradientStyle: "" }

    let dashboardHt = 0
    let doHideMindNotes = false

    let habitsHeightPerc = INIT_HABITS_HT_PERC
    let _habitsHeightPerc = INIT_HABITS_HT_PERC
    let mindNotesHeightPerc = INIT_MIND_NOTES_HT_PERC
    let _mindNotesHeightPerc = INIT_MIND_NOTES_HT_PERC

    let dragStartYPos = -1
    let dragYOffSet: number | null = null

    $: {
        if ($themeState && getElemById("list--0")) {
            for (let i = 0; i < 3; i++) {
                const listElem = getElemById(`list--${i}`) as HTMLUListElement
                onListScroll(listElem, i)
            }
        }
    }
    $: {
        if (dragYOffSet != null) {
            if (currListHtChange === ListType.Habits) {
                updateHabitsHt()
            }
            if (currListHtChange === ListType.MindNotes) {
                updateMindNotesHt()
            }
        }
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
        if (listVar.hasSpaceAbove && listVar.hasSpaceBelow) {
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
        if (!$themeState.isDarkTheme) return

        const [hasReachedBottom, hasReachedTop] = getScrollStatus(target! as HTMLElement)
        const hasSpaceAbove = !hasReachedTop
        const hasSpaceBelow = !hasReachedBottom

        if (list === ListType.Habits) {
            habitsList = { ...habitsList, hasSpaceAbove, hasSpaceBelow }
            updateGradientStyle(habitsList)
        }
        else if (list === ListType.Goals) {
            goalsList = { ...goalsList, hasSpaceAbove, hasSpaceBelow }
            updateGradientStyle(goalsList)
        }
        else {
            mindNotesList = { ...mindNotesList, hasSpaceAbove, hasSpaceBelow }
            updateGradientStyle(mindNotesList)
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
        for (let i = 0; i < 3; i++) {
            const listElem = getElemById(`list--${i}`) as HTMLUListElement
            onListScroll(listElem, i)
        }
    })
</script>

<div class={`dashboard ${!$themeState.isDarkTheme ? "dashboard--light-theme" : ""}`} bind:clientHeight={dashboardHt}>
    <div class="dashboard__habits" style={`height: ${habitsHeightPerc}%`}>
        <div class="dashboard__habits-header dashboard__subheading-header">
            <h4 class="dashboard__subheading">Today's Habits</h4>
            <span class="dashboard__habits-count">1/4</span>
        </div>
        <ul 
            class="dashboard__habits-list" 
            id="list--0"
            on:scroll={(event) => onListScroll(event.target, ListType.Habits)}
            style={`${$themeState.isDarkTheme ? `-webkit-mask-image: ${habitsList.gradientStyle}; mask-image: ${habitsList.gradientStyle}` : ""}`}
        >
            {#each habits as habit, idx}
                <li 
                    class={`dashboard__habit ${habit.isDone ? "dashboard__habit--done" : ""} ${habit.isLate ? "dashboard__habit--late" : ""}`}
                    title={`${habit.isLate ? "Overdue" : ""}`}
                >
                    <button 
                        class="dashboard__habit-checkbox" 
                        title={`${habit.isLate ? "Overdue" : ""}`}
                        on:click={() => onHabitCheckboxClicked(idx)}
                    >
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <h5 class={`dashboard__habit-title ${habit.isDone ? "strike strike--animated" : ""}`}>{habit.title}</h5>
                    {#if habit.metric}
                        <div class="dashboard__habit-metric">{habit.metric}</div>
                    {/if}
                </li>
            {/each}
        </ul>
        <div 
            class={`dashboard__resizer dashboard__resizer--habits ${dragStartYPos >= 0 && currListHtChange === ListType.Habits ? "dashboard__resizer--dragging" : ""}`} 
            on:mousedown={(e) => onResizerMouseDown(e, ListType.Habits)}
        >
            <div class="dashboard__resizer-handle"></div>
        </div>
    </div>
    <div class="dashboard__goals" style={`height: calc(100% - (${habitsHeightPerc}% + ${mindNotesHeightPerc}% + 35px));`}>
        <div class="dashboard__subheading-header">
            <div class="dashboard__pin-icon">
                <SvgIcon icon={Icon.Pin} options={{ opacity: $themeState.isDarkTheme ? 0.3 : 0.42}} />
            </div>
            <h4 class="dashboard__subheading" title="Pinned Goals">Goals</h4>
        </div>
        <ul 
            class="dashboard__goals-list"
            id="list--1"
            on:scroll={(event) => onListScroll(event.target, ListType.Goals)}
            style={`${$themeState.isDarkTheme ? `-webkit-mask-image: ${goalsList.gradientStyle}; mask-image: ${goalsList.gradientStyle}` : ""}`}
        >
            {#each goals as goal}
                <li class="dashboard__goal">
                    <div class="dashboard__goal-dotted-line">
                        <svg xmlns="http://www.w3.org/2000/svg" width="211" height="2" viewBox="0 0 211 2" fill="none">
                            <path d="M0.274414 1.04004L211 1.04002" stroke-width="0.4" stroke-dasharray="2.85 2.85"/>
                        </svg>
                    </div>
                    <div class="dashboard__goal-title">{goal.title}</div>
                    <div class="flx flx--algn-center flx--space-between">
                        <span class="dashboard__goal-due-date">{getDueDate(goal.due)}</span>
                        <span class="dashboard__goal-progress">{goal.percentageDone}%</span>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
    <div 
        class={`dashboard__resizer dashboard__resizer--mind-notes ${dragStartYPos >= 0 && currListHtChange === ListType.MindNotes ? "dashboard__resizer--dragging" : ""}`} 
        on:mousedown={(e) => onResizerMouseDown(e, ListType.MindNotes)}
    >
        <div class="dashboard__resizer-handle">
        </div>
    </div>
    <div class="dashboard__mind-notes" style={`height: ${mindNotesHeightPerc}%; display: ${doHideMindNotes ? "none": "block"}`}>
        <div class="dashboard__subheading-header">
            <div class="dashboard__pin-icon">
                <SvgIcon icon={Icon.Pin} options={{ opacity: $themeState.isDarkTheme ? 0.3 : 0.42}} />
            </div>
            <h4 class="dashboard__subheading" title="Pinned Mind Notes">Mind Notes</h4>
        </div>
        <ul 
            class="dashboard__mind-notes-list"
            id="list--2"
            on:scroll={(event) => onListScroll(event.target, ListType.MindNotes)}
            style={`${$themeState.isDarkTheme ? `-webkit-mask-image: ${mindNotesList.gradientStyle}; mask-image: ${mindNotesList.gradientStyle}` : ""}`}
        >
            {#each quotes as quote}
                <li class="dashboard__mind-note">
                    <p>"{quote.text}"</p>
                </li>
            {/each}
        </ul>
    </div>
</div>


<style lang="scss">
    $side-padding: 15px;

    .dashboard {
        height: calc(100% - 90px);
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

        &__subheading {
            @include text-style(0.4, 400, 1.2rem, "DM Sans");
        }
        &__subheading-header {
            @include flex(center);
            margin-bottom: 4px;
        }
        &__pin-icon {
            margin: 0px 7px -3px $side-padding;
        }
        /* Habits */
        &__habits {
            padding: 0px 0px 0px $side-padding;
            margin-bottom: 12px;
        }
        &__habits-header {
            margin-bottom: 4px;
            padding-right: $side-padding;
            @include flex(center, space-between);
        }
        &__habits-count {
            @include text-style(0.3, 400, 1rem, "DM Mono");
        }
        &__habits-list {
            overflow-y: scroll;
            padding-top: 10px;
            height: calc(100% - 19.5px);
        }
        &__habit {
            @include flex(center);
            margin-bottom: 8.5px;
            
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
                border: 1px solid rgba(#D5AE4A, 0.1);
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
            @include circle(13px);
            margin-right: 14px;
            transition: 0.1s ease-in-out;
            border: 1px solid rgba(var(--tasksCheckBoxColorDefault), 1);

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
            margin-right: 13px;
            @include text-style(0.8, 200, 1.28rem, "DM Sans");
            @include elipses-overflow;
        }
        &__habit-metric {
            @include text-style(0.2, 200, 1.07rem, "DM Sans");
        }
        /* Goals */
        &__goals {
            min-height: 160px;
        }
        &__goals-list {
            overflow-y: scroll;
            height: calc(100% - (18px));
            padding-top: 7px;
        }
        &__goal {
            padding-bottom: 12px;
            transition: 0.04s ease-in-out;
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
            margin-bottom: 5px;
            margin-left: $side-padding;
            cursor: text;
            width: fit-content;
            @include elipses-overflow;
            max-width: 90%;
        }
        &__goal-due-date {
            @include text-style(0.2, 400, 1.03rem, "DM Mono");
            margin-left: $side-padding;
            cursor: text;
        }
        &__goal-progress {
            @include text-style(0.15, 400, 1rem, "DM Mono");
            margin-right: $side-padding;
            cursor: text;
        }
        &__goal-dotted-line {
            height: 2px;
            margin-bottom: 9px;
            position: relative;
            margin-left: $side-padding;

            svg {
                @include pos-abs-top-left-corner(-1px);
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
                margin: 0px 0px 0px 0px;
                width: calc(100% - $side-padding);
            }
            &--mind-notes {
                width: calc(100% - (2 * $side-padding));
                margin: 0px 0px 5px $side-padding !important;
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
        /* Mind Notes */
        &__mind-notes {
        }
        &__mind-notes--hidden {
            display: none;
        }
        &__mind-notes-list {
            padding: 7px $side-padding 0px $side-padding;
            overflow-y: scroll;
            height: calc(100% - 20px);
        }
        &__mind-note {
            background-color: rgba(white, 0.011);
            @include text-style(0.4, 300, 1.2rem);
            padding: 6px 12px 9.5px 12px;
            margin-bottom: 7px;
            border-radius: 14px;
            border: 0.5px solid rgba(white, 0.024);
        }
    }
</style>

