<script lang="ts">
    import { themeState } from "../lib/store"
    import { ACTIVITY_DATA } from "$lib/mock-data"
    import { isSameDay } from "$lib/utils-date"
    import { Calendar } from "$lib/calendar.ts"
	import { formatDateLong, minsToHHMM } from "../lib/utils-date"
	import { formatPlural, getColorTrio, initFloatElemPos } from "../lib/utils-general"

	import DropdownList from "./DropdownList.svelte"
	import DayEntry from "../routes/home/base/DayEntry.svelte"
	import ImgStampModal from "../routes/home/base/HighlightImgModal.svelte"
	import { imageUpload } from "../lib/utils-home";

    $: isLight = !$themeState.isDarkTheme

    let gridWidth = 0
    let gridHeight = 0
    let gridElem: HTMLElement

    let imgModal = false
    let entryModal = false

    const options: any = {}
    const timeView  = options?.time ?? true
    const goalsView = options?.goals ?? "list"
    const cal = new Calendar()
    let month = cal.currMonth

    let editDay = null
    let hasContextMenu = false
    let contextPos: OffsetPoint = {
        left: -1000, top: -1000
    }

    function getGoalsDisplayData(goals: { type: string, name?: string, tag: any }[]) {
        return {
            firstGoal: goals[0] ?? undefined,
            count: goals.length
        }
    }
    function findDayActivity(day: Date) {
        const idx = ACTIVITY_DATA.findIndex((d) => isSameDay(d.date, day))
        const activity = idx >= 0 ? ACTIVITY_DATA[idx] : undefined

        return { activity, idx }
    }
    function onContextMenu(_e: Event, day: any) {
        const e = _e as PointerEvent
        const rect = gridElem.getBoundingClientRect()
        hasContextMenu = true

        e.preventDefault()

        const cursorPos = {
            left: e.clientX - rect.left - 25,
            top: e.clientY - rect.top + 15
        }
        const { left, top } = initFloatElemPos({
            dims: { 
                height: 65,
                width: 160
            }, 
            containerDims: { 
                height: gridHeight - 5, 
                width: gridWidth - 5
            },
            cursorPos
        })
        contextPos = { left, top }
        editDay = day
    }
    function onSettingsOptnClicked(optn: string) {
        const day = ACTIVITY_DATA[editDay.idx]

        if (optn === "Remove Text Entry") {
            day.thoughtEntry = undefined

            editDay = null
            month = month
        }
        else if (optn === "Add Text Entry") {
            editDay.thoughtEntry = ""
            entryModal = true
        }
        else if (optn === "Remove Highlight Image") {
            day.highlightImg = undefined

            editDay = null
            month = month
        }
        else if (optn === "Add Highlight Image") {
            imageUpload.init({
                onSubmit: (src: string | null) => {
                    if (src) {
                        day["highlightImg"] = {
                            src,
                            caption: ""
                        }
                    }

                    editDay = null
                }
            })
        }

        hasContextMenu = false
    }
    function onDayEntryUpdate(updatedData: DayEntryUpdatePayload) {
        const day = ACTIVITY_DATA[editDay.idx]

        if (updatedData.img) {
            day.highlightImg.src     = updatedData.img.src ?? day.highlightImg.src
            day.highlightImg.caption = updatedData.img.caption ?? day.highlightImg.caption
        }
        else {
            day.highlightImg = undefined
        }

        day.thoughtEntry = updatedData.thoughtEntry ?? undefined
        month = month

        entryModal = false
        editDay = null
    }
</script>

<div 
    class="acal"
    class:acal--light={isLight}
    style:--GRID_WIDTH={`${gridWidth}px`}
    style:--GRID_HEIGHT={`${gridHeight}px`}
>
    <div class="acal__days">
        <div class="acal__dow">Sun</div>
        <div class="acal__dow">Mon</div>
        <div class="acal__dow">Tue</div>
        <div class="acal__dow">Wed</div>
        <div class="acal__dow">Thu</div>
        <div class="acal__dow">Fri</div>
        <div class="acal__dow">Sat</div>
    </div>
    <div 
        class="acal__grid"
        bind:this={gridElem}
        bind:clientWidth={gridWidth}
        bind:clientHeight={gridHeight}
    >
        {#each month.days as day, idx}
            {@const d   = day.date.getDate()}
            {@const dow = day.date.getDay()}
            {@const sameMonth = day.isInCurrMonth}
            {@const { activity, idx: aIdx}  = findDayActivity(day.date)}
            {@const focused        = activity?.focusMins}
            {@const habitProg      = activity?.habits ?? 0}
            {@const highlightImg        = activity?.highlightImg}
            {@const thoughtEntry   = activity?.thoughtEntry}
            {@const { count } = getGoalsDisplayData(activity?.goals ?? [])}
            {@const _editDay = { ...day, idx: aIdx, highlightImg, thoughtEntry }}

            <div 
                class="acal__day"
                class:acal__day--edit={isSameDay(day.date, editDay?.date)}
                class:acal__day--first-col={dow === 0}
                class:acal__day--last-col={dow === 6}
                class:acal__day--bottom-row={idx >= 35}
                class:acal__day--not-curr-month={!sameMonth}
                class:acal__day--today={isSameDay(day.date, new Date())}
                on:contextmenu={(e) => onContextMenu(e, _editDay)}
            >
                <div>
                    <div class="acal__day-num">
                        {d}
                    </div>
                    <!-- thought icon -->
                     {#if activity?.thoughtEntry != undefined}
                        <button 
                            on:click={() => {
                                entryModal = true
                                editDay = _editDay
                            }}
                            class="acal__thought-icon"
                        >
                            <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.87905 4.91406C3.80281 6.96489 2.26469 9.01572 1.23927 13.1174L0.726562 15.6809L1.75198 14.1428" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M1.23952 4.91122C0.726814 6.24426 1.13698 10.0383 1.64969 11.5764C1.64969 11.5764 3.59798 9.52559 5.85389 8.50017C7.69964 7.67984 9.75047 7.88492 10.4683 6.44934C11.0835 5.21884 10.2632 4.70614 8.93013 5.42393C10.1606 4.70614 13.0318 3.3731 12.0064 1.83498C10.981 0.399394 8.41743 1.73243 7.39201 2.65531C7.39201 2.24514 7.39201 1.21973 6.3666 1.32227C5.34118 1.42481 4.31577 2.86039 4.00814 4.19343C4.00814 4.19343 4.00814 3.47564 3.29035 3.3731C2.57256 3.27056 1.64969 3.88581 1.23952 4.91122Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M5.54495 11.8838C6.57036 12.294 7.39069 11.8838 7.9034 10.8584C8.21102 11.4737 8.41611 12.0889 9.95423 12.0889C11.4924 12.0889 11.6974 11.4736 12.0051 10.7559C12.4152 11.8838 13.133 12.294 14.3635 11.7813M4.51953 15.2677C5.33986 15.6779 6.57036 15.2677 7.08307 14.1397C7.39069 14.8575 7.9034 15.4728 8.92882 15.4728C9.95423 15.4728 10.4669 15.0626 10.9796 14.1397C11.4924 15.0626 12.5178 15.6779 13.5432 15.1651" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>                                                                                                                            
                        </button>
                    {/if}

                    <!-- habit progress -->
                    <!-- <div class="acal__day-ring" title="Habit progress.">
                        {#if sameMonth}
                            <ProgressRing 
                                progress={habitProg} 
                                options={{
                                    size: 10, strokeWidth: 2, style: "simple"
                                }}
                            />
                        {/if}
                    </div> -->
                    {#if activity?.goals}
                        {@const goals = activity.goals}
                        {@const show  = (highlightImg ? 1 : 2) + (timeView ? 0 : 1)}
                        {@const cutoff = goals.length - show}

                        <div style:margin-top="0px">
                            {#if goals && goalsView === "summary"}
                                <div 
                                    class="acal__activity"
                                    title={`Achived ${formatPlural("task", count)}`}
                                >
                                    <i>📌</i>
                                    <span>{count}</span>
                                </div>
                            {/if}
                            {#if goals && goalsView === "list"}
                                {#each goals.slice(0, show) as goal}
                                    {@const symbol = goal.tag.symbol}
                                    {@const colors = getColorTrio(symbol.color, isLight)}
                                    <div 
                                        class="acal__activity acal__goal"
                                        style:--tag-color-primary={symbol.color.primary}
                                        style:--tag-color-1={colors[0]}
                                        style:--tag-color-2={colors[1]}
                                        style:--tag-color-3={colors[2]}
                                        title={`Achived ${formatPlural("task", count)}`}
                                    >
                                        <i>{symbol.emoji}</i>
                                        <span>{goal.name}</span>
                                        <i>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                        {#if cutoff > 0}
                            <div class="acal__goal-cutoff">
                                {cutoff} more
                            </div>
                        {/if}
                    {/if}
                </div>

                <!-- icon -->
                {#if highlightImg}
                    <button 
                        class="acal__img-icon"
                        on:click={() => {
                            imgModal = true
                            editDay = _editDay
                        }}
                    >
                        <img src={highlightImg.src} alt="Day Icon">
                    </button>
                {/if}

                <!-- focus -->
                {#if focused}
                    <div 
                        class="acal__day-focus-time acal__activity"
                        title="focus time"
                    >
                        <i class="fa-solid fa-stopwatch"></i>
                        <!-- <i>📌</i> -->
                        <span>
                            {minsToHHMM(activity.focusMins)}
                        </span>
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    <DropdownList
        id={"activity-cal"}
        isHidden={!hasContextMenu}
        options={{
            listItems: [
                {
                    sectionName: formatDateLong(editDay?.date),
                    options: [
                        { name: editDay?.thoughtEntry != undefined ? "Remove Text Entry" : "Add Text Entry" }, 
                        { name: editDay?.highlightImg ? "Remove Highlight Image" : "Add Highlight Image" }
                    ]
                }
            ],
            onListItemClicked: (context) => {
                onSettingsOptnClicked(context.name)
            },
            onClickOutside: () => {
                hasContextMenu = false
                editDay = null
            },
            position: { 
                top: `${contextPos.top}px`, 
                left: `${contextPos.left}px`
            }
        }}
    />
</div>

{#if imgModal && editDay} 
    <ImgStampModal 
        img={editDay.highlightImg}
        onClickOutside={() => {
            imgModal = false
            editDay = null
        }}
    />
{/if}
{#if entryModal} 
    <DayEntry 
        data={{
            img: editDay.highlightImg,
            date: editDay.date,
            thoughtEntry: editDay.thoughtEntry
        }}
        onUpdate={onDayEntryUpdate}
    />
{/if}

<style lang="scss">
    .acal {
        margin-top: 0px;
        width: 100%;
        height: 650px;
        max-width: 1200px;
        position: relative;

        --border: 0.5px solid rgba(var(--textColor1), 0.05);
        --dark-cell-col: rgba(var(--textColor1), 0.01);
        --obscure-cell-opac: 0.1;
        --txt-weight: 500;
        
        &--light {
            --border: 1px solid rgba(var(--textColor1), 0.08);
            --dark-cell-col: rgba(var(--textColor1), 0.04);
            --obscure-cell-opac: 0.3;
            --txt-weight: 600;
        }
        &--light &__days {
            @include text-style(1, 600);
        }
        &--light &__day-num {
            @include text-style(0.94, 500);
        }
        &--light &__day-ring {
            @include text-style(0.94, 500);
        }
        &--light &__activity {
            background-color: rgba(var(--textColor1), 0.05);

            span {
                font-weight: 600;
            }
        }
        &--light &__goal-cutoff {
            @include text-style(0.7);
        }
        &--light &__day-focus-time i {
            opacity: 0.25;
        }

        &__dow {
            text-align: center;
        }
        &__days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            font-weight: bold;
            height: 30px;
            @include text-style(0.65, 500, 1.25rem);
        }
        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
            height: calc(100% - 30px);
            width: 100%;
        }
        &__day {
            padding: 5px 5px 3px 5px;
            background: rgba(var(--textColor1), 0.0025);
            transition: 0.1s background-color ease-in-out;
            border-top: var(--border);
            border-left: var(--border);
            height: calc(var(--GRID_HEIGHT) / 6);
            width: calc(var(--GRID_WIDTH) / 7);
            @include flex-col;
            position: relative;
            overflow: hidden;
            cursor: pointer;

            &--first-col {
                background-color: var(--dark-cell-col);
            }
            &--last-col {
                border-right: var(--border);
                background-color: var(--dark-cell-col);
            }
            &--bottom-row {
                border-bottom: var(--border);
            }
            &--not-curr-month &-num {
                opacity: var(--obscure-cell-opac);
            }
            &--today &-num {
                background-color: #FF5151;
                color: white;
                @include circle(20px);
            }
        }
        &__day--edit {
            background: rgba(var(--textColor1), 0.035) !important;
        }
        &__day:hover {
            background: rgba(var(--textColor1), 0.015);
        }
        &__day--edit &__img-icon,
        &__day:hover &__img-icon {
            opacity: 1;
        }

        &__day-ring {
            @include abs-top-right(8px, 7px);

            i {
                color: rgba(var(--textColor1), 0.1); 
                font-size: 0.9rem;
            }
        }
        &__day-num {
            @include text-style(1, 500, 1.25rem, "Manrope");
            @include circle(16px);
            @include center;
            margin: 2px 0px 6px 2px;
        }
        &__activity {
            width: calc(100% - 3px);
            padding: 3.5px 2px 4px 5px;
            border-radius: 7px;
            background-color: rgba(var(--textColor1), 0.05);
            white-space: nowrap;
            margin: 0px 0px 2px 2px;
            margin-top: 2px;
            @include flex(center);
            cursor: pointer;

            i {
                font-style: normal;
                font-size: 1.1rem;
                margin-right: 7px;
            }
            span {
                @include text-style(0.96, 500, 1.15rem, "DM Sans");
                @include elipses-overflow;
            }
        }
        /* goal activity */
        &__goal {
            overflow: hidden;
            position: relative;
            padding: 2.5px 6px 3.5px 13px;
            background-color: rgba(var(--tag-color-2), 1) !important;

            span {
                @include text-style(_, _, 1.25rem, "DM Sans");
                font-weight: var(--txt-weight) !important;
                color: rgba(var(--tag-color-1), 1);
            }
            &::before {
                content: " ";
                @include abs-top-left(4.5px, 5px);
                height: 55%;
                width: 3px;
                border-radius: 10px;
                background: rgba(var(--tag-color-1), 1);
            }
        }
        &__goal-cutoff {
            @include text-style(0.2, 500, 1.25rem);
            margin: 1px 3px 0px 4px;
            float: right;
        }

        /* thought entry */
        &__thought-icon {
            @include abs-top-right(7px, 7px);
            opacity: 0.1;
            
            &:hover {
                opacity: 0.5;
            }
            path {
                stroke: rgba(var(--textColor1), 1);
            }
        }

        /* img icon */
        &__img-icon {
            @include abs-bottom-left(4px, 6px);
            // opacity: 0.65;
            transition: 0.14s ease-in-out;
            opacity: 1;
            
            img {
                // border: white 2px solid;
                @include square(34px, 6px);
                // @include square(36px, 5px);
                object-fit: cover
            }
        }

        /* focus activity */
        &__day-focus-time {
            @include text-style(1, 500, 1.1rem, "DM Mono");
            width: min-content;
            padding-right: 10px;
            display: none;

            i {
                opacity: 0.14;
            }
        }
        &__day-activity {
            margin-top: 7px;
        }
    }
</style>