<script lang="ts">
	import { onMount } from "svelte"
	import { themeState } from "$lib/store"

    import { Icon } from "$lib/enums"
	import { formatDateLong } from "$lib/utils-date"
    import { GoalsViewManager } from "$lib/goals-view-manager"
	import { capitalize, kebabToNormal, normalToKebab } from "$lib/utils-general"
	import { getNextTimeFrame, isGoalPinned, setViewGoal } from "$lib/utils-goals"
    
    import GoalsList from "./GoalsList.svelte"
	import GoalsBoard from "./GoalsBoard.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import AccomplishedIcon from "$components/AccomplishedIcon.svelte"

    export let manager: GoalsViewManager
    export let options: GoalsViewOptions
    export let timeFrame: { year: number, period: string }
    export let context: "page" | "home" = "page"

    $: light = !$themeState.isDarkTheme
    $: nextTimeFrame = _getNextTimeFrame(timeFrame)

    let state: GoalsViewState | null = null
    let uiState: GoalsViewUIState | null = null

    let pinnedGoal: Goal | null = null
    let statusOpen = false
    let statusMenuPos = { top: 0, left: 0 }
    let snippetRef: HTMLElement
    let width = 0
    let snippetHeight = 0
    let rightContainerRef: HTMLElement
    let closing = false

    manager.state.subscribe((data) => {
        state = data
        pinnedGoal = data.pinnedGoal
    })
    manager.uiState.subscribe((data) => {
        uiState = data
    })

    $: if (pinnedGoal && snippetRef) {
        requestAnimationFrame(() => {
            snippetHeight = snippetRef.clientHeight
        })
    }
    function _getNextTimeFrame(time: { year: number, period: string }) {
        const next = getNextTimeFrame(time)
        const period = time.period
        const diffYear = next.year != time.year
        
        return period === "all" ? next.year : diffYear ? next.year : capitalize(next.period)
    }
    function onListItemClicked(goal: Goal | null, newStatus: string) {
        if (!goal) return
        
        const status = normalToKebab(newStatus) as "accomplished" | "in-progress" | "not-started"
        manager.toggleGoalStatus(goal, status)
        manager.closeContextMenu()
        statusOpen = false
        closing = true
    }

    onMount(() => manager.initContainerRef(rightContainerRef))
</script>

<div 
    class="goals-view"
    class:goals-view--page={context === "page"}
    class:goals-view--sm={width < 600}
    class:goals-view--light={light}
    style:--truncate-lines={pinnedGoal?.img ? 2 : 5}
    bind:clientWidth={width}
>
    {#if pinnedGoal && options.view === "list"}
        {@const { status, img, description, name, completedDate } = pinnedGoal}
        {@const done = status === "accomplished"}
        <div class="goals-view__left">
            <div class="goals-view__pinned">
                {#if img}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        role="button"
                        tabindex="0"
                        class="goals-view__pinned-img"
                        on:click={() => {
                            if (pinnedGoal) setViewGoal(pinnedGoal)
                        }}
                    >
                        <img src={img.src} alt={name} />
                    </div>
                {/if}
                <div class="goals-view__pinned-text">
                    <div class="flx">
                        <span>Pinned</span>
                        {#if done && completedDate}
                            <div 
                                style:margin="1px 0px 0px 7px"
                                title={`Completed on ${formatDateLong(completedDate)}`}
                            >
                                <AccomplishedIcon scale={0.6} />
                            </div>
                        {/if}
                    </div>
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <button 
                        class="goals-view__pinned-title hov-underline"
                        class:strike={done}
                        title={name}
                        on:click={() => {
                            if (pinnedGoal) setViewGoal(pinnedGoal)
                        }}
                    >
                        {name}
                    </button>

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
        style:overflow={options.view === "board" ? "scroll" : "unset"}
    >
        {#if options.view === "list"}
            <GoalsList 
                {timeFrame}
                {manager}
                {pinnedGoal}
                options={options.list}
            />
        {:else if options.view === "board"}
            <div style:padding-left="4px">
                <GoalsBoard 
                    {manager}
                    {pinnedGoal}
                    options={options.board}
                />
            </div>
        {/if}

        {#if state && uiState}
            {@const { contextMenuPos, editGoal, contextMenuOpen } = uiState }
            {@const periodPinned = pinnedGoal?.id === editGoal?.id}
            {@const carouselPinned = isGoalPinned(editGoal)}
            {@const period = timeFrame.period}
            {@const pinPeriod = period === "all" ? "Year" : capitalize(period)}

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
                            name: periodPinned ? `Unpin from ${pinPeriod}` : `Pin to ${pinPeriod}`,
                            rightIcon: { 
                                type: "svg",
                                icon: Icon.Pin
                            },
                        },
                        { 
                            divider: true,
                            name: carouselPinned ? "Unpin from Top" : "Pin up Top"
                        },
                        {
                            name: "Change Status",
                            childId: "statuses",
                            onPointerOver: ({ childXPos }) => {
                                if (!closing) {
                                    statusOpen = true
                                }
                                statusMenuPos.left = childXPos
                            },
                            onPointerLeave: () => {
                                statusOpen = false
                            }
                        },
                        { 
                            name: `Push to ${nextTimeFrame}`, 
                            rightIcon: { 
                                type: "fa", 
                                icon: "fa-solid fa-arrow-right",
                                transform: "scale(1.2) translate(-1px, 0px)"
                            },
                            divider: true
                        },
                        { 
                            name: "Remove" 
                        }
                    ],
                    rootRef: rightContainerRef,
                    onListItemClicked: ({ name }) => {
                        manager.onOptionClicked(name)
                    },
                    onClickOutside: () => {
                        manager.closeContextMenu(!statusOpen)
                        statusOpen = false
                    },
                    styling: { 
                        zIndex: 500
                    },
                    position: { 
                        top: `${contextMenuPos.top}px`, 
                        left: `${contextMenuPos.left}px`,
                    }
            }}
        />
    
        <DropdownList 
            id={"goals-menu"}
            childId={"statuses"}
            isHidden={!statusOpen || !contextMenuOpen}
            options={{
                pickedItem: kebabToNormal(editGoal?.status ?? ""),
                listItems: [
                    { name: "Not Started" },
                    { name: "In Progress" },
                    { name: "Accomplished" },
                ],
                styling:  { 
                    zIndex: 501
                },
                position: { 
                    top: `${contextMenuPos.top + 70}px`, 
                    left: `${statusMenuPos.left}px`,
                },
                parentId: "goals-page",
                onDismount: () => {
                    closing = false
                },
                onPointerLeave: () => {
                    statusOpen = false
                },
                onListItemClicked: ({ name }) => {
                    onListItemClicked(editGoal, name)
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
        &--page {
            border-top: var(--divider-border);
            padding-top: 12px;
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
            @include text-style(0.2, var(--fw-400-500), 1.4rem);
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
            @include text-style(1, var(--fw-400-500), 1.65rem);
            @include truncate-lines(var(--truncate-lines));
            cursor: pointer;
            margin: 6px 0px 9px 0px;
        }
        &__pinned-title.strike {
            opacity: 0.4 !important;
        }
        &__pinned-text-snippet {
            @include text-style(0.55, var(--fw-400-500), 1.4rem);
            word-break: break-word;
        }
        &__pinned-text-snippet--fade {
            mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
            -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
        }
    }
</style>