<script lang="ts">

	import { TEST_GOALS } from "$lib/mock-data"
	import ProgressBar from "../../../components/ProgressBar.svelte";
	import ProgressRing from "../../../components/ProgressRing.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { getDueString } from "../../../lib/utils-date"
	import { getSectionProgress, reorderGoals, sectionGoals } from "../../../lib/utils-goals"
	import { getColorTrio, kebabToNormal } from "../../../lib/utils-general"
	import { themeState } from "../../../lib/store";

    export let options: {
        grouping?: "tag" | "status" 
        showMilestones?: boolean
        progressUi?: "bar" | "circle" 
    } | undefined = undefined

    let goals = TEST_GOALS
    let sortedGoals: Goal[][] = []

    $: isLight = !$themeState.isDarkTheme

    const tags: Tag[] = Array.from(new Set(TEST_GOALS.map(goal => goal.tag)))
    const tagsStr     = tags.map((tag) => tag.name)
    const statuses    = ["not-started", "in-progress", "accomplished"]

    let grouping =  "status"
    let showMilestones = false
    let progressUi = "circle"

    let sections = statuses
    let sectionMap: { [key: string]: number } 
    let closedSections: boolean[] = []
    let openGoals: boolean[][] = []

    let isDragging = false

    let ms_ReorderGoalSrc: Goal | null = null
    let dragSrc:    Goal | Milestone | null = null
    let dragTarget: Goal | Milestone | null = null


    $: if (options) {
        initSections()

        grouping = options?.grouping ?? "status"
        showMilestones = options?.showMilestones ?? false
        progressUi = options?.progressUi ?? "circle"
    }

    function initSections() {
        grouping = options.grouping
        if (grouping === "status") {
            sections = statuses
        }
        else {
            sections = tagsStr
        }
        initSecMap()
        sortGoals()
    }

    function initSecMap() {
        sectionMap = {}
        sections.forEach((name, idx) => sectionMap[name] = idx)
    }
    function sortGoals() {
        sortedGoals = sectionGoals({ sections, goals, grouping })
        closedSections = Array.from<boolean>({ length: sections.length }).fill(false)
        sortedGoals.forEach(section => openGoals.push(Array.from<boolean>({ length: section.length }).fill(false))) 
    }

    function toggleSectionOpen(secIdx: number) {
        closedSections[secIdx] = !closedSections[secIdx]
        closedSections = closedSections
    }
    function toggleGoalOpen(secIdx: number, goalIdx: number) {
        openGoals[secIdx][goalIdx] = !openGoals[secIdx][goalIdx]
        openGoals = openGoals
    }

    /* completion */
    function toggleGoalComplete(secIdx: number, gIdx: number) {
        const section = sortedGoals[secIdx]
        const goal = section[gIdx]

        goal.status = goal.status === "accomplished" ? "in-progress" : "accomplished"

        if (grouping === "status") {
            section.splice(gIdx, 1)
            const newIndex = goal.status === "accomplished" ? 2 : 1
            sortedGoals[newIndex].push(goal)
        }
        if (goal.status === "accomplished") {
            goal.milestones?.forEach(milestone => milestone.done = true)
        }

        sortedGoals = sortedGoals
        sections = sections
    }
    function toggleMilestoneComplete(secIdx: number, goalIdx: number, msIdx: number) {
        const goal = sortedGoals[secIdx][goalIdx]
        const milestones = goal.milestones
        milestones[msIdx].done = !milestones[msIdx].done

        sortedGoals = sortedGoals
    }

    function getGoalProgress(goal: Goal) {
        const checkCount = goal.milestones?.filter((m) => m.done).length ?? 0
        const total = goal.milestones?.length ?? 0

        return { checkCount, total }
    }

    /* drag */
    function onDrag(e: DragEvent, goal: any, milestone?: any) {
        e.dataTransfer.effectAllowed = "move"

        if (!isDragging) {
            e.preventDefault()
            return
        }

        ms_ReorderGoalSrc = milestone ? goal : null
        dragSrc = milestone ? milestone : goal
    }
    function onDragOver(e: DragEvent, target: any) {
        e.preventDefault()
        if (typeof target == "string") {
            dragTarget = target
        }
        if (target?.name != dragSrc?.name) {
            dragTarget = target
        }
    }
    function onDragLeave() {
        dragTarget = null
    }
    function onDragEnd() {
        if (dragTarget && ms_ReorderGoalSrc) {
            reorderMilestones(ms_ReorderGoalSrc, dragSrc, dragTarget)
        }
        else if (dragTarget) {
            _reorderGoals(dragSrc, dragTarget)
        }
        isDragging = false
        dragSrc = null
        dragTarget = null
    }

    function reorderMilestones(goal: Goal, src: Milestone, target: Milestone) {
        const milestones = goal.milestones
        const srcOrder = src.idx
        const lastOrder = Math.max(...milestones.map((ms) => ms.idx)) + 1
        const toIdx = target === "end" ? lastOrder : target.idx
        const direction = srcOrder < toIdx ? "up" : "down"
        const targetOrder = toIdx + (direction === "up" ? -1 : 0)

        milestones.forEach((ms) => {
            if (direction === "up" && ms.idx > srcOrder && ms.idx <= targetOrder) {
                ms.idx--
            } 
            else if (direction === "down" && ms.idx >= targetOrder && ms.idx < srcOrder) {
                ms.idx++
            }
        })

        src.idx = targetOrder
        sortedGoals = sortedGoals
    }

    function _reorderGoals(srcGoal: Goal, target: Goal | string) {
        reorderGoals({ srcGoal, target, goals, grouping, sectionMap })
        sortGoals()
    }

</script>

<div 
    class="goals"
    class:goals--light={isLight}
>
    {#each sections as section, secIdx (secIdx)}
        {@const closed   = closedSections[secIdx]}
        {@const goals    = sortedGoals[secIdx]}
        {@const { done: secDone, total: secTotal } = getSectionProgress({ sortedGoals, secIdx })}

        <div class="goals__section">
            <div class="goals__section-header">
                <div class="flx">
                    <div class="goals__section-name">
                        {kebabToNormal(section)}
                    </div>
                    <div class="goals__section-count">
                        {goals.length}
                    </div>
                    <button 
                        class="toggle-arrow toggle-arrow--section"
                        class:toggle-arrow--closed={closed}
                        class:hidden={goals.length === 0}
                        style:margin-left={"18px"}
                        on:click={() => toggleSectionOpen(secIdx)}
                    >
                        <SvgIcon 
                            icon={Icon.Dropdown}
                            options={{
                                scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                            }}
                        />
                    </button>
                </div>
                {#if goals.length > 0}
                    <div class="goals__section-progress" class:hidden={grouping === "status"}>
                        <ProgressBar progress={secDone / secTotal}/>
                    </div>
                {/if}
            </div>
            <div class="goals__section-divider divider"></div>
            {#if !closed}
                {#each goals as goal, goalIdx (`${goal.name}--${goalIdx}`)}
                    {@const tagColor = goal.tag ? getColorTrio(goal.tag.symbol.color, isLight) : ["", "", ""]}
                    {@const { checkCount, total } = getGoalProgress(goal)}
                    {@const open = openGoals[secIdx][goalIdx]}
                    {@const milestones = goal.milestones}
                    {@const checked = goal.status === "accomplished"}
        
                    <div 
                        draggable="true"
                        class="goals__goal dg-over-el"
                        class:goals__goal--checked={checked}
                        class:dg-over-el--over={goal.name === dragTarget?.name}
                        on:dragstart={(e) => onDrag(e, goal)}
                        on:dragover={(e) => onDragOver(e, goal)}
                        on:dragleave={onDragLeave}
                        on:dragend={onDragEnd}
                    >
                        <div class="one-col">
                            <button 
                                on:click={() => toggleGoalComplete(secIdx, goalIdx)}
                                class="goals__goal-checkbox"
                            >
                                <i class="fa-solid fa-check"></i>
                            </button>
                        </div>
                        <div 
                            class="goals__goal-name two-col"
                            class:strike={checked}
                        >
                            {goal.name}
                        </div>
                        {#if showMilestones && milestones?.length > 0}
                            <div class="goals__milestones goals__milestones--in-row three-col">
                                {#each milestones.sort((a, b) => a.idx - b.idx) as ms, mIdx}
                                    <div 
                                        draggable="true"
                                        class="goals__milestone dg-over-el" 
                                        class:goals__milestone--checked={ms.done}
                                        class:dg-over-el--over={ms.name === dragTarget?.name}
                                        on:dragstart={(e) => onDrag(e, goal, ms)}
                                        on:dragover={(e) => onDragOver(e, ms)}
                                        on:dragleave={onDragLeave}
                                        on:dragend={onDragEnd}
                                    >
                                        <button 
                                            class="goals__goal-checkbox" 
                                            class:goals__goal-checkbox--checked={ms.done}
                                            on:click={() => toggleMilestoneComplete(secIdx, goalIdx, mIdx)}
                                        >
                                            {#if ms.done}
                                                <i class="fa-solid fa-check"></i>
                                            {/if}
                                        </button>
                                        <div 
                                            class="goals__goal-name goals__milestone-name"
                                            class:strike={ms.done}
                                        >
                                            {ms.name}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="goals__goal-description three-col">
                                {goal.description}
                            </div>
                        {/if}
                        <div class="goals__goal-tag four-col">
                            {#if goal.tag}
                                <div 
                                    class="tag"
                                    class:tag--light={isLight}
                                    style:--tag-color-primary={goal.tag.symbol.color.primary}
                                    style:--tag-color-1={tagColor[0]}
                                    style:--tag-color-2={tagColor[1]}
                                    style:--tag-color-3={tagColor[2]}
                                >
                                    <!-- <span class="tag__symbol">
                                        {goal.tag.symbol.emoji}
                                    </span> -->
                                    <div class="tag__title">
                                        {goal.tag.name}
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <div class="five-col">
                            <div class="goals__goal-due">
                                {getDueString(goal.due, goal.dueType) || "--"}
                            </div>
                        </div>
                        <div class="six-col">
                            <div class="goals__goal-progress" class:hidden={total === 0}>
                                {#if progressUi === "bar"}
                                    <ProgressBar progress={checkCount / total} />
                                {:else}
                                    {#if total === 0}
                                        <div class="fraction">{total}</div>
                                    {:else}
                                        <div class="fraction">
                                            {checkCount}<span class="fraction__slash">/</span>{total}
                                        </div>
                                    {/if}
                                    <div class="goals__progress-ring">
                                        <ProgressRing 
                                            progress={checkCount / total} 
                                            options={{ 
                                                style: "rich-colored",
                                                size: 15,
                                                strokeWidth: 3
                                            }}
                                        />
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if goalIdx != goals.length - 1 || milestones?.length >= 0 && open}
                            <div class="goals__goal-divider divider"></div>
                        {/if}

                        <button 
                            on:click={() => toggleGoalOpen(secIdx, goalIdx)}
                            class="toggle-arrow"
                            class:toggle-arrow--closed={!open}
                            class:hidden={!goal.milestones || goal.milestones?.length === 0 || showMilestones}
                            style:margin-left={"18px"}
                        >
                            <SvgIcon 
                                icon={Icon.Dropdown}
                                options={{
                                    scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                                }}
                            />
                        </button>

                        <div 
                            class="grip"
                            on:pointerdown={() => isDragging = true}
                            on:pointerup={() => isDragging = false}
                        >
                            <div class="grip__icon">
                                <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                            </div>
                        </div>
                    </div>

                    {#if milestones?.length > 0 && open && !showMilestones}
                        <div class="goals__milestones">
                            {#each milestones.sort((a, b) => a.idx - b.idx) as ms, mIdx}
                                <div 
                                    draggable="true"
                                    class="goals__milestone dg-over-el" 
                                    class:goals__milestone--checked={ms.done}
                                    class:dg-over-el--over={ms.name === dragTarget?.name}
                                    on:dragstart={(e) => onDrag(e, goal, ms)}
                                    on:dragover={(e) => onDragOver(e, ms)}
                                    on:dragleave={onDragLeave}
                                    on:dragend={onDragEnd}
                                >
                                    <button 
                                        class="goals__goal-checkbox" 
                                        class:goals__goal-checkbox--checked={ms.done}
                                        on:click={() => toggleMilestoneComplete(secIdx, goalIdx, mIdx)}
                                    >
                                        {#if ms.done}
                                            <i class="fa-solid fa-check"></i>
                                        {/if}
                                    </button>
                                    <div 
                                        class="goals__goal-name goals__milestone-name"
                                        class:strike={ms.done}
                                    >
                                        {ms.name}
                                    </div>
                                    <div class="divider" class:hidden={goal.milestones.length === mIdx + 1}></div>
                                    <div 
                                        class="grip"
                                        on:pointerdown={() => isDragging = true}
                                        on:pointerup={() => isDragging = false}
                                    >
                                        <div class="grip__icon">
                                            <SvgIcon icon={Icon.DragDots} options={{ scale: 1.15 }} />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            <div 
                                class="goals__ghost-item goals__ghost-item--ms dg-over-el"
                                class:dg-over-el--over={"end" === dragTarget}
                                on:dragover={(e) => onDragOver(e, "end")}
                                on:dragleave={onDragLeave}
                                on:dragend={onDragEnd}
                            >
                            </div>
                        </div>
                    {/if}
                {/each}
                <div 
                    class="goals__ghost-item dg-over-el"
                    class:dg-over-el--over={dragTarget === section}
                    on:dragover={(e) => onDragOver(e, section)}
                    on:dragleave={onDragLeave}
                    on:dragend={onDragEnd}
                >
                </div>
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
    .goals {
        margin: 0px 0px 0px -12px;
        min-height: 350px;
        padding-bottom: 30px;

        &--light &__section {
            @include text-style(0.55, 600);
        }
        &--light &__section-count {
            @include text-style(0.35, 500);
        }
        &--light &__goal:hover {
            background-color: rgba(var(--textColor1), 0.03);
        }
        &--light &__goal-name {
            @include text-style(1, 600);
        }
        &--light &__goal-description {
            @include text-style(0.6);
        }
        &--light &__goal-due {
            @include text-style(0.55, 600);
        }
        &--light &__milestone-name {
            @include text-style(0.75, 600);
        }
        &--light .fraction {
            font-weight: 600 !important;
            opacity: 0.85;
        }
        &--light .divider {
            @include  l-div;
        }
        
        &__section {
            margin: 0px 0px 12px 1px;
            position: relative;
            @include text-style(0.4, 500, 1.3rem);
            
            &:hover .toggle-arrow--section {
                opacity: 0.2;
            }
        }
        &__section-header {
            @include flex(center, space-between);
        }
        &__section-name {
            margin: 0px 0px 6px 12px;
        }
        &__section-count {
            @include text-style(0.2, 500, _, "DM Sans");
            margin: 0px 0px 6px 12px;
        }
        &__section-divider {
            @include text-style(0.4, 500, 1.3rem);
            margin: 0px 0px 6px 12px;
            width: calc(100% + 30px) !important;
        }
        &__section-progress {
            margin: -6px 7px 0px 0px;
            @include flex(Center);
        }
        &__goal {
            @include flex(flex-start);
            width: calc(100%);
            padding: 8px 9px 8.5px 13px;
            border-radius: 7px;
            margin: 0px 0px 1px 1px;
            cursor: pointer;
            position: relative;

            &:hover {
                background-color: rgba(var(--textColor1), 0.0225);
            }
            &:hover .toggle-arrow {
                opacity: 0.2;
            }
            &:hover .divider {
                display: none;
            }
        }
        &__goal .toggle-arrow {
            @include abs-top-left(8px, -22px);
        }
        &__goal--checked {
            // opacity: 0.5;
        }
        &__goal--checked + .goals__milestones {
            // opacity: 0.9;
        }
        &__goal--checked &__goal-checkbox {
            background-color: var(--elemColor1) !important;

            i {
                display: block;
            }
        }
        &__goal-checkbox {
            background-color: var(--lightColor3);
            height: 17.5px;
            width: 17.5px;
            min-width: 17.5px;
            color: var(--elemTextColor);
            border-radius: 0px;
            transition: 0.1s ease-in-out;
            margin: 2px 15px 0px 0px;
            @include center;

            &--checked {
                background-color: var(--elemColor1) !important;
            }
            i {
                display: none;
            }
            &:hover {
                background: rgba(var(--textColor1), 0.125);
            }
        }
        &__goal-name {
            @include text-style(1, 500, 1.4rem);
        }
        &__goal-description {
            @include text-style(0.475, 500, 1.38rem);
        }
        &__goal-due {
            @include text-style(0.4, 500, 1.35rem);
        }
        &__goal-progress {
            @include flex(center, flex-end);
            display: flex;
            margin-top: 1px;
        }
        &__goal-divider {
            @include abs-bottom-left(-1px, 48px);
        }
        &__goal .tag {
            border-radius: 5px;
            padding: 3px 9px 4px 9px;
        }
        &__goal .tag__title {
            font-size: 1.25rem !important;
        }
        &__goal .fraction {
            font-weight: 500;
            margin: -2px 12px 0px 0px;
            
            &__slash {
                margin: -1px 2.5px 0px 2.5px;
            }
        }
        &__milestones {
            padding: 4px 0px 0px 48px;
            position: relative;
            max-height: 300px;
            overflow-y: scroll;

            &--in-row {
                padding: 0px;
                max-height: 180px;
                margin: 0px 8px 0px 0px !important;
            }
            &--in-row .goals__milestone {
                padding: 0px 0px 0px 0px;
                margin-bottom: 14px;
            }
            &--in-row .goals__milestone:last-child {
                margin-bottom: 0px;
                padding-bottom: 3px;
            }
        }
        &__milestones-divider {
            @include abs-top-left(0px, -30px);
            width: calc(100% + 20px) !important;
        }
        &__milestone {
            display: flex;
            margin-bottom: 0px;
            position: relative;
            padding: 11px 0px;

            &--checked {
                // opacity: 0.55;
            }
            &--checked i {
                display: block;
            }
            .divider {
                margin-left: 0px;
                @include abs-bottom-left(0px, 30px);
            }
            .grip {
                @include abs-top-left(2px, -25px);
            }
        }
        &__milestone::before {
            left: 0px;
            width: 100%;
        }
        &__milestones &__ghost-item::before {
            left: 0px;
            width: 100%;
        }
        &__milestone-name {
            @include text-style(0.75, 500, 1.4rem);
        }
        &__ghost-item {
            height: 40px;
            width: 100%;
            @include abs-bottom-left(-45px, 0px);
            z-index: 100;

            &--ms {
                height: 15px;
                // margin-top: -45px;
                bottom: 0px;
                position: relative;
            }
        }
    }

    .toggle-arrow {
        @include abs-top-left(-1px, -30px);
    }
    .strike {
        text-decoration: line-through;
        opacity: 0.2;

        &::after {
            display: none;
        }
    }
    .divider {
        width: calc(100% - 40px);
        height: 0.5px;
        background-color:rgba(var(--textColor1), 0.05);
    }

    .one-col {
        width: 30px;
    }
    .two-col {
        // width: 180px;
        min-width: 160px;
        width: 22%;
    }
    .three-col {
        flex: 1;
        text-align: left;
        margin: 0px 40px 0px 20px;
    }
    .four-col {
        width: 105px;
    }
    .five-col {
        width: 135px;
    }
    .six-col {
        width: 80px;
    }
</style>