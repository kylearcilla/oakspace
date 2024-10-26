<script lang="ts">
	import { TEST_GOALS } from "$lib/mock-data"
	import ProgressBar from "../../../components/ProgressBar.svelte";
	import ProgressRing from "../../../components/ProgressRing.svelte"
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { getDueString } from "../../../lib/utils-date"
	import { getColorTrio, kebabToNormal, randInt } from "../../../lib/utils-general"

    export let options: {
        grouping?: "tag" | "status"
    } | undefined = undefined

    let goals = TEST_GOALS
    let sortedGoals: Goal[][] = []

    const tags: Tag[] = Array.from(new Set(TEST_GOALS.map(goal => goal.tag)))
    const tagsStr     = tags.map((tag) => tag.name)
    const statuses    = ["not-started", "in-progress", "accomplished"]

    let grouping = options?.grouping ?? "status"

    let section = statuses
    let closedSections: boolean[] = []
    let openGoals: boolean[][] = []

    let isDragging = false
    let dragGoalSrc: Goal | null = null
    let dragGoalTarget: Goal | null = null

    $: if (options?.grouping) {
        grouping = options.grouping

        if (grouping === "status") {
            section = statuses
        }
        else {
            section = tagsStr
        }
        sortGoals()
    }

    function sortGoals() {
        section.forEach((sectionValue) => {
            const filteredGoals = TEST_GOALS.filter(goal => {
                if (grouping === "status") {
                    return goal.status === sectionValue
                } 
                else if (grouping === "tag") {
                    return goal.tag.name === sectionValue
                }
                return false
            })

            filteredGoals.sort((a, b) => a.order.progress - b.order.progress)
            sortedGoals.push(filteredGoals)
        })

        closedSections = Array.from<boolean>({ length: section.length }).fill(false)
        sortedGoals.forEach(section => openGoals.push(Array.from<boolean>({ length: section.length }).fill(false))) 
    }

    function toggleSectionOpen(sectionIdx: number) {
        closedSections[sectionIdx] = !closedSections[sectionIdx]
        closedSections = closedSections
    }
    function toggleGoalOpen(sectionIdx: number, goalIdx: number) {
        openGoals[sectionIdx][goalIdx] = !openGoals[sectionIdx][goalIdx]
        openGoals = openGoals
    }

    /* drag */
    function onGoalDrag(e: DragEvent, goal: any) {
        console.log({ isDragging })
        if (!isDragging) {
            e.preventDefault()
            console.log("A")
            return
        }

        dragGoalSrc = goal
    }
    function onGoalDragOver(e: DragEvent, target: any) {
        e.preventDefault()

        if (typeof target == "string") {
            dragGoalTarget = target
        }
        if (target?.name != dragGoalSrc?.name) {
            dragGoalTarget = target
        }
    }
    function onDragLeave() {
        dragGoalTarget = null
    }
    function onGoalDragEnd() {
        if (dragGoalTarget) {
            // reorder(dragGoalSrc, dragGoalTarget)
        }
        isDragging = false
        dragGoalSrc = null
        dragGoalTarget = null
    }

    function reorderBoard(srcGoal: Goal | string, targetGoal: Goal | string) {
        // const toLast  = typeof targetGoal === "string"
        // const srcStatus = srcGoal.status
        // const targetStatus  = toLast ? targetGoal : targetGoal.status

        // const srcSecIdx = COL_ID_MAP[srcStatus]
        // const toSecIdx  = COL_ID_MAP[targetStatus]
        // const sameSec   = srcSecIdx === toSecIdx

        // const srcOrder  = srcGoal.order.progress
        // const lastOrder = _goals.filter((goal: any) => goal.status === targetStatus).length 

        // const toIdx       = toLast ? lastOrder : targetGoal.order.progress
        // const betweenSec  = srcStatus != targetStatus
        // const direction   = (betweenSec ? srcSecIdx < toSecIdx : srcOrder < toIdx) ? "up" : "down"

        // const targetOrder = Math.max(toIdx + (direction === "up" && sameSec ? -1 : 0), 0)

        // _goals
        //     .filter((goal: Goal) => goal.status === srcStatus)
        //     .forEach((goal: Goal) => {
        //         if (direction === "up" && goal.order.progress > srcOrder) {
        //             goal.order.progress--
        //         } 
        //         else if (!sameSec && direction === "down" && goal.order.progress > srcOrder) {
        //             goal.order.progress--
        //         }
        //         else if (sameSec && direction === "down" && goal.order.progress < srcOrder) {
        //             goal.order.progress++
        //         }
        //     })
        // _goals
        //     .filter((goal: Goal) => goal.status === targetStatus)
        //     .forEach((goal: Goal) => {
        //         if (direction === "up" && goal.order.progress >= targetOrder) {
        //             goal.order.progress++
        //         } 
        //         else if (!sameSec && direction === "down" && goal.order.progress >= targetOrder) {
        //             goal.order.progress++
        //         }
        //         else if (sameSec && direction === "down" && goal.order.progress <= targetOrder) {
        //             goal.order.progress--
        //         }
        //     })

        // srcGoal.order.progress = targetOrder
        // srcGoal.status = targetStatus 

        // sortGoals(_goals)
    }
</script>

<div class="goals">
    {#each section as section, sectionIdx}
        {@const closed = closedSections[sectionIdx]}
        {@const goals = sortedGoals[sectionIdx]}
        {@const secTotal = randInt(1, 10)}
        {@const secProgress = randInt(0, secTotal)}

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
                        class="goals__arrow goals__arrow--section smooth-bounce"
                        class:goals__arrow--closed={closed}
                        style:margin-left={"18px"}
                        on:click={() => toggleSectionOpen(sectionIdx)}
                    >
                        <SvgIcon 
                            icon={Icon.Dropdown}
                            options={{
                                scale: 1.2, height: 12, width: 12, strokeWidth: 1.4
                            }}
                        />
                    </button>
                </div>
                <div class="goals__section-progress flx" class:hidden={grouping === "status"}>
                    <ProgressBar progress={secProgress / secTotal}/>
                    <!-- <div class="fraction" style:margin-right={"10px"}>
                        {secProgress}<span class="fraction__slash">/</span>{secTotal}
                    </div> -->
                    <!-- <div class="fraction" style:margin-right={"11px"}>
                        {Math.floor(secProgress / secTotal * 100)}%
                    </div> -->
                    <!-- <div class="goals__progress-ring">
                        <ProgressRing 
                            progress={secProgress / secTotal} 
                            options={{ style: "rich-colored" }}    
                        />
                    </div> -->
                </div>
            </div>
            <div class="goals__section-divider divider"></div>
            {#if !closed}
                {#each goals as goal, goalIdx}
                    {@const tagColor = goal.tag ? getColorTrio(goal.tag.symbol.color, false) : ["", "", ""]}
                    {@const total = randInt(1, 10)}
                    {@const progress = randInt(0, total)}
                    {@const checked = total > 4}
                    {@const open = openGoals[sectionIdx][goalIdx]}
        
                    <div class="goals__goal" class:goals__goal--checked={checked}>
                        <div class="one-col">
                            <button class="goals__goal-checkbox">
                                <i></i>
                                {#if checked}
                                    <i class="fa-solid fa-check"></i>
                                {/if}
                            </button>
                        </div>
                        <div class="goals__goal-name two-col">
                            {goal.name}
                        </div>
                        <div class="goals__goal-description three-col">
                            {goal.description}
                        </div>
                        <div class="goals__goal-tag four-col">
                            {#if goal.tag}
                                <div 
                                    class="tag"
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
                            <div class="goals__goal-progress">
                                <div class="fraction">
                                    {progress}<span class="fraction__slash">/</span>{total}
                                </div>
                                <!-- <div class="fraction">
                                    {Math.floor(progress / total * 100)}%
                                </div> -->
                                <div class="goals__progress-ring">
                                    <ProgressRing 
                                        progress={progress / total} 
                                        options={{ style: "rich-colored" }}    
                                    />
                                </div>
                            </div>
                        </div>
                        <div 
                            class="goals__goal-divider divider"
                            class:hidden={goalIdx === goals.length - 1}
                        >
                        </div>

                        <button 
                            on:click={() => toggleGoalOpen(sectionIdx, goalIdx)}
                            class="goals__arrow smooth-bounce"
                            class:goals__arrow--closed={!open}
                            class:hidden={!goal.milestones || goal.milestones?.length === 0}
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

                    {#if goal.milestones?.length > 0 && open}
                        <div class="goals__goal-milestones">
                            {#each goal.milestones as milestone, mIdx}
                                <div class="goals__goal-milestone">
                                    <button class="goals__goal-checkbox" class:goals__goal-checkbox--checked={milestone.done}>
                                        {#if milestone.done}
                                            <i class="fa-solid fa-check"></i>
                                        {/if}
                                    </button>
                                    <div 
                                        class="goals__goal-name goals__goal-milestone-name"
                                        class:strike={milestone.done}
                                    >
                                        {milestone.name}
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
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
    .goals {
        margin-top: 4px;
        margin-left: -12px;
        min-height: 350px;
        
        &__section {
            margin: 12px 0px 10px 1px;
            position: relative;
            @include text-style(0.4, 500, 1.12rem);
            
            &:hover .goals__arrow--section {
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
            @include text-style(0.2, 400, _, "DM Mono");
            margin: 0px 0px 6px 12px;
        }
        &__section-divider {
            @include text-style(0.4, 500, 1.12rem);
            margin: 0px 0px 6px 12px;
            width: calc(100% + 30px) !important;
        }
        &__arrow {
            @include abs-top-left(-1px, -30px);
            transform: rotate(0deg);
            opacity: 0;
            padding: 4px;

            &:hover {
                opacity: 0.9 !important;
            }

            &--closed {
                transform: rotate(-90deg);
            }
        }
        &__section-progress {
            margin: -6px 13px 0px 0px;
        }
        &__goal {
            @include flex(flex-start);
            width: calc(100%);
            padding: 8px 13px 8.5px 17px;
            border-radius: 7px;
            margin-bottom: 1px;
            cursor: pointer;
            position: relative;

            &:hover {
                background-color: rgba(var(--textColor1), 0.0255);
            }
            &:hover .goals__arrow {
                opacity: 0.2;
            }
            &:hover .divider {
                display: none;
            }
        }
        &__goal .goals__arrow {
            @include abs-top-left(8px, -20px);
        }
        &__goal--checked &__goal-checkbox {
            background-color: #6bb0f4 !important;
            color: white;
        }
        &__goal-checkbox {
            background: rgba(var(--textColor1), 0.075);
            width: 15px;
            height: 15px;
            border-radius: 0px;
            transition: 0.1s ease-in-out;
            margin: 2px 15px 0px 0px;
            @include center;
            
            &--checked {
                background-color: #6bb0f4 !important;
                color: white;
            }
            &:hover {
                background: rgba(var(--textColor1), 0.125);
            }
        }
        &__goal-name {
            @include text-style(1, 500, 1.3rem);
        }
        &__goal-description {
            @include text-style(0.475, 500, 1.3rem);
        }
        &__goal-due {
            @include text-style(0.4, 400, 1.3rem, "DM Sans");
        }
        &__goal-progress {
            @include flex(center, space-between);
            display: flex;
        }
        &__goal-divider {
            @include abs-bottom-left(-1px, 38px);
        }
        &__goal .tag {
            border-radius: 5px;
            padding: 3px 9px 4px 9px;
        }
        &__goal .fraction {
            font-family: "DM Mono";
            font-size: 1.2rem;
            opacity: 0.85;
            margin-top: -2px;
            
            &__slash {
                font-size: 1rem !important;
                margin: -1px 2.5px 0px 2.5px;
            }
        }
        &__goal-milestones {
            margin: 0px 0px 8px 42px;
            position: relative;
            max-height: 215px;
            overflow-y: scroll;
        }
        &__goal-milestones-divider {
            @include abs-top-left(0px, -30px);
            width: calc(100% + 20px) !important;
        }
        &__goal-milestone {
            display: flex;
            margin-bottom: 0px;
            position: relative;
            padding: 11px 0px;

            &--checked {

            }
            .divider {
                margin-left: 0px;
                @include abs-bottom-left(0px, 30px);
            }
            .grip {
                @include abs-top-left(2px, -25px);
            }
        }
        &__goal-milestone-name {
            @include text-style(0.75, 500, 1.3rem);
        }
        &__goal-milestone-name.strike {
            opacity: 0.2;
        }
    }

    .strike {
        text-decoration: line-through;
        &::after {
            display: none;
        }
    }
    .grip {
        @include abs-top-left(0px, -18px);
        cursor: grab;
        height: 34px;
        @include center;
        
        &__icon {
            transition: 0.1s ease-in-out;
            @include not-visible;
            padding: 5px 3px;
        }
        &:hover &__icon {
            background: rgba(var(--textColor1), 0.15);
            border-radius: 3px;
            @include visible(0.6);
        }
        &:active {
            cursor: grabbing;
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
        margin-right: 40px;
    }
    .four-col {
        width: 95px;
    }
    .five-col {
        width: 130px;
    }
    .six-col {
        width: 50px;
    }
</style>