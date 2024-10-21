<script lang="ts">
	import { onMount } from "svelte";
	import SvgIcon from "../../../components/SVGIcon.svelte";
	import { Icon } from "../../../lib/enums";
	import { getElemById, getHozDistanceBetweenTwoElems } from "../../../lib/utils-general"
	import ActivityCalendar from "../../../components/ActivityCalendar.svelte"
	import WeeklyHabits from "./WeeklyHabits.svelte";

    type MonthDetailsView = "cal" | "goals" | "habits"

    let currView: MonthDetailsView = "cal"

    let btnHighlighter = {
        width: 0, left: 0
    }
    function onViewBtnClicked(view: MonthDetailsView) {
        currView = view
        const btnElem = getElemById(`month-view--${view}`)!
        const width = btnElem.clientWidth
        const left = getHozDistanceBetweenTwoElems({ 
            left:  { 
                elem: btnElem.parentElement!,
                edge: "left"
            },
            right: { 
                elem: btnElem,
                edge: "left"
            },
        })

        btnHighlighter.width = width + 0
        btnHighlighter.left  = Math.max(left - 2, 0)
    }

    onMount(() => {
        onViewBtnClicked(currView)
    })
</script>


<div class="month-view">
    <div class="month-view__heading">
        September
    </div>
    <div class="month-view__insights">
        <div class="insight-sentence">
            You have completed <strong>60%</strong> of your habits this month with <strong>2</strong> of your <strong>8</strong> monthly goals achived.
        </div>
    </div>
    <div class="month-view__details">
        <div class="month-view__details-header">
            <div class="month-view__btns">
                <button 
                    id="month-view--cal"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "cal"}
                    on:click={() => onViewBtnClicked("cal")}
                >
                    <span>Overview</span>
                </button>
                <button 
                    id="month-view--habits"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "habits"}
                    class:month-view__header-btn--indicator={true}
                    title="You have some incomplete habits!"
                    on:click={() => onViewBtnClicked("habits")}
                >
                    <span>Habits</span>
                    <div class="month-view__header-btn-subtxt">
                        60%
                    </div>
                </button>
                <button 
                    id="month-view--goals"
                    class="month-view__header-btn"
                    class:month-view__header-btn--chosen={currView === "goals"}
                    class:month-view__header-btn--indicator={true}
                    title="You have some goals due today!"
                    on:click={() => onViewBtnClicked("goals")}
                >
                    <span>Goals</span>
                    <div class="month-view__header-btn-subtxt">
                        12%
                    </div>
                </button>
            </div>
            <div class="flx">
                <button class="month-view__arrow">
                    <SvgIcon 
                        icon={Icon.ChevronLeft}
                        options={{
                            scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
                </button>
                <button class="month-view__arrow">
                    <SvgIcon 
                        icon={Icon.ChevronRight}
                        options={{
                            scale: 1.5, height: 12, width: 12, strokeWidth: 1.4
                        }}
                    />
                </button>
                <button class="month-view__settings-btn">
                    <SvgIcon icon={Icon.Settings} options={{ scale: 1.1 }}/>
                </button>
            </div>
            <div 
                class="month-view__details-header-highlight smooth-bounce"
                style:left={`${btnHighlighter.left}px`}
                style:width={`${btnHighlighter.width}px`}
            >
            </div>
        </div>
        <div class="divider"></div>
        <div class="month-view__details-view">
            {#if currView === "cal"}
                <ActivityCalendar />
            {:else}
                <WeeklyHabits/>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .month-view {
        .divider {
            background-color: rgba(var(--textColor1), 0.035);
            height: 1px;
            width: 100%;
            margin: 4px 0px 14px 0px;
        }

        /* view options */
        &__details {
            padding: 0px 0px 4px 0px;
            margin: 24px 0px 0px 0px;
        }
        &__details-view {
            overflow-x: scroll;
        }
        &__details-header {
            @include flex(center, space-between);
            position: relative;
        }
        &__btns {
            display: flex;
            margin-bottom: 2px;
            position: relative;
        }
        &__heading {
            @include text-style(1, 500, 2rem);
            margin: -2.5px 0px 12px 0px;
        }
        &__header-btn {
            @include text-style(1, 500, 1.385rem);
            margin-right: 20px;
            display: flex;
            position: relative;

            &--indicator {
                margin-left: 18px;
            }
            &--indicator::before {
                display: block !important;
            }
            &:active {
                transform: scale(0.99);
            }
            &:hover * {
                opacity: 0.55;
            }
            &::before {
                content: " ";
                display: none;
                background-color: #FDD97D;
                @include abs-top-left(7px, -13px);
                @include circle(4px);
            }
            &--chosen * {
                opacity: 0.8 !important; 
            }
            span {
                opacity: 0.3;
            }
        }
        &__header-btn-subtxt {
            @include text-style(0.5, 400, 1.35rem, "DM Mono");
            background-color: rgba(var(--textColor1), 0);
            margin: 1px -8px 0px 5px;
            padding: 0px 9px 4px 6px;
            border-radius: 6px;
            opacity: 0.3;
        }
        &__details-header-highlight {
            position: absolute;
            bottom: -4px;
            height: 1px;
            background-color: rgba(var(--textColor1), 0.65);
        }
        &__arrow {
            opacity: 0.2;
            margin-left: 30px;
            padding: 1px 8px 1px 7px;
            height: 20px;
            border-radius: 5px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
                opacity: 0.45;
            }
        }
        &__settings-btn {
            @include center;
            @include circle(25px);
            opacity: 0.2;
            margin-left: 14px;
            
            &:hover {
                background-color: rgba(var(--textColor1), 0.1);
                opacity: 0.35;
            }
        }
    }

    .insight-sentence {
        @include text-style(0.255, 400, 1.45rem);
        
        strong {
            @include text-style(0.65, 400, 1.4rem, "DM Mono");
            margin: 0px 2px 2px 2px;
        }
    }
</style>