<script lang="ts">
    import { TEST_GOALS } from "$lib/mock-data"
    import { GoalsManager } from "$lib/goals-manager"
    
    import GoalsList from "./GoalsList.svelte"
    import GoalsBoard from "./GoalsBoard.svelte"
	import ProgressBar from "../../../components/ProgressBar.svelte";
	import DropdownList from "../../../components/DropdownList.svelte";
	import { Icon } from "../../../lib/enums";
	import { kebabToNormal, normalToKebab } from "../../../lib/utils-general";
	import { onMount } from "svelte";
	import { themeState } from "../../../lib/store";

    export let goalsView: GoalsView
    export let onProgressChange: (progress: number) => void

    const manager = new GoalsManager({ 
        goals: TEST_GOALS, 
        grouping: goalsView.list.grouping
    })

    $: state = manager.state
    $: pinnedGoal = $state.pinnedGoal
    $: light = !$themeState.isDarkTheme

    let store: GoalsViewState | null = null

    let statusOpen = false
    let statusMenuPos = { top: 0, left: 0 }
    let nextMonth = getNextMonth()
    let snippetRef: HTMLElement
    let width = 0
    let snippetHeight = 0
    let rightContainerRef: HTMLElement
    let closing = false
    
    manager.state.subscribe((data) => {
        const goals = manager.goals
        const done  = goals.filter(goal => goal.status === "accomplished").length
        const total = goals.length

        onProgressChange(done / total)
        store = data
    })

    $: if (pinnedGoal && snippetRef) {
        requestAnimationFrame(() => {
            snippetHeight = snippetRef.clientHeight

            // if (pinnedGoal.imgSrc) {
            //     snippetHeightThreshold = 90
            // }
            // else {
            //     snippetHeightThreshold = 180
            // }
        })
    }

    function getGoalProgress(goal: Goal) {
        const checkCount = goal.milestones?.filter((m) => m.done).length ?? 0
        const total = goal.milestones?.length ?? 0

        return { checkCount, total }
    }

    function getNextMonth() {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()
        const nextDate = new Date(year, month + 1, 1)
        
        return nextDate.toLocaleString("en-US", { month: "short" })
    }

    onMount(() => manager.initContainerRef(rightContainerRef))
</script>

<div 
    class="goals-view"
    class:goals-view--sm={width < 600}
    class:goals-view--light={light}
    style:--truncate-lines={pinnedGoal?.imgSrc ? 2 : 5}
    bind:clientWidth={width}
>
    {#if pinnedGoal}
        {@const { checkCount, total } = getGoalProgress(pinnedGoal)}
        {@const { status, imgSrc, milestones, description, name } = pinnedGoal}
        {@const done = status === "accomplished"}
        <div class="goals-view__left">
            <div class="goals-view__pinned">
                {#if imgSrc}
                    <div class="goals-view__pinned-img">
                        <img src={imgSrc} alt={name} />
                    </div>
                {/if}
                <div class="goals-view__pinned-text">
                    <span>
                        {done ? "Done!" : "Pinned"}
                    </span>
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a 
                        class="goals-view__pinned-title"
                        class:strike={done}
                        title={name}
                    >
                        {name}
                    </a>
                    {#if milestones}
                        <div class="goals-view__pinned-progress">
                            <ProgressBar 
                                progress={checkCount / total}
                            />
                        </div>
                    {/if}
                    <div 
                        class="goals-view__pinned-text-snippet"
                        class:goals-view__pinned-text-snippet--fade={snippetHeight > 100}
                        bind:this={snippetRef}
                    >
                        {description}
                    </div>
                </div>
            </div>
        </div>
    {/if}
    <div 
        bind:this={rightContainerRef}
        class="goals-view__right"
        style:overflow={goalsView.view === "board" ? "scroll" : "unset"}
    >
        {#if goalsView.view === "list"}
            <GoalsList 
                {manager}
                {pinnedGoal}
                options={goalsView.list}
            />
        {:else}
            <div style:padding-left="4px">
                <GoalsBoard 
                    {manager}
                    {pinnedGoal}
                    options={goalsView.board}
                />
            </div>
        {/if}

        {#if store}
            {@const { contextMenuPos, editGoal, contextMenuOpen } = store }
            <DropdownList
                id={"goals-menu"}
                isHidden={!contextMenuOpen}
                options={{
                    listItems: [
                        { 
                            name: "View Details",
                            divider: true
                        },
                        { 
                            name: pinnedGoal?.id === editGoal?.id ? "Unpin Goal" : "Pin Goal",
                            rightIcon: { 
                                type: "svg",
                                icon: Icon.Pin
                            },
                        },
                        { 
                            name: "Change Status",
                            rightIcon: { 
                                type: "svg",
                                icon: Icon.ChevronRight
                            },
                            onPointerOver: ({ childLeft }) => {
                                statusMenuPos.top = contextMenuPos.top
                                statusMenuPos.left = childLeft

                                if (!closing) {
                                    statusOpen = true
                                }
                            },
                            onPointerLeave: () => {
                                statusOpen = false
                            }
                        },
                        { 
                            name: `Push to ${nextMonth}`, 
                            rightIcon: { 
                                type: "fa", 
                                icon: "fa-solid fa-arrow-right",
                                transform: "scale(1.2) translate(-1px, 0px)"
                            },
                            divider: true
                        },
                        { 
                            name: "Remove" 
                        },
                    ],
                    parentContext: {
                        container: rightContainerRef,
                        childId: "statuses"
                    },
                    onListItemClicked: ({ name }) => {
                        manager.onOptionClicked(name)
                    },
                    onClickOutside: () => {
                        manager.closeContextMenu(!statusOpen)
                        statusOpen = false
                    },
                    styling: { 
                        width: "140px",
                        zIndex: 500,
                    },
                    position: { 
                        top: `${contextMenuPos.top}px`, 
                        left: `${contextMenuPos.left}px`,
                    }
            }}
        />
    
        <DropdownList 
            id={"statuses"}
            isHidden={!statusOpen || !contextMenuOpen}
            options={{
                pickedItem: kebabToNormal(editGoal?.status ?? ""),
                listItems: [
                    { name: "Not Started" },
                    { name: "In Progress" },
                    { name: "Accomplished" },
                ],
                onListItemClicked: ({ name: status }) => {
                    manager.setGoalStatus(editGoal, normalToKebab(status))
                    manager.closeContextMenu()
                    statusOpen = false
                    closing = true
                },
                styling:  { 
                    width: "125px",
                    zIndex: 501,
                },
                position: { 
                    top: `${statusMenuPos.top + 50}px`, 
                    left: `${statusMenuPos.left}px`,
                },
                parent: {
                    id: "goals-menu",
                    optnIdx: 0,
                    optnName: "Change Status"
                },
                onDismount: () => {
                    closing = false
                },
                onPointerLeave: () => {
                    statusOpen = false
                }
            }}
        />
    {/if}

    </div>
</div>


<style lang="scss">
    .goals-view {
        @include flex(flex-start, space-between);
        gap: 25px;

        &--light &__pinned span {
            @include text-style(0.3);
        }
        &--sm {
            display: block;
        }
        &--sm &__left {
            width: 100%;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.045);
        }
        &--sm &__pinned-container {
            width: calc(100% - 15px);
            margin: 10px 0px 12px 15px;
            padding-bottom: 9px;
            border-bottom: 0.5px solid rgba(var(--textColor1), 0.045);
        }
        &--sm &__pinned {
            display: flex;
        }
        &--sm &__pinned-progress {
            @include abs-top-right(-12px, 0px);
        }
        &--sm &__pinned-img {
            min-width: 110px;
            width: 110px;
            height: 110px;
            margin-right: 20px;
        }
        &--sm &__pinned-text-snippet {
            @include truncate-lines(2);
            mask-image: unset;
            -webkit-mask-image: unset;  
        }

        &__left {
            width: 160px;
            min-width: 160px;
        }
        &__right {
            flex: 1;
            position: relative;
        }

        /* pinned */
        &__pinned-progress {
            margin: 13px 0px 11px 0px;
        }
        &__pinned span {
            display: block;
            @include text-style(0.2, var(--fw-400-500), 1.3rem, "Geist Mono");
        }
        &__pinned-img {
            width: 100%;
            object-fit: cover;
            margin: 2px 0px 7px 0px;

            img {
                transition: 0.18s transform cubic-bezier(.4, 0, .2, 1);
                @include square(100%, 6px);
                aspect-ratio: 1/1;
                object-fit: cover;
                cursor: pointer;
            }
            img:hover {
                transform: scale(1.01) rotate(2deg);
            }
            img:active {
                transform: scale(0.99) rotate(2deg) !important;
            }
        }
        &__pinned-title {
            @include text-style(1, var(--fw-400-500), 1.6rem, "Geist Mono");
            @include truncate-lines(var(--truncate-lines));
            cursor: pointer;
            margin: 6px 0px 9px 0px;
        }
        &__pinned-title.strike {
            opacity: 0.4 !important;
        }
        &__pinned-text-snippet {
            @include text-style(0.55, var(--fw-400-500), 1.5rem);
            word-break: break-word;
        }
        &__pinned-text-snippet--fade {
            mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
            -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
        }
    }
</style>