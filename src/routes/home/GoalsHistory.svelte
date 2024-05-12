<script lang="ts">
	import { goalsManager, themeState } from "$lib/store";
	import { months, formatDatetoStr } from "$lib/utils-date";
	import { YR_CONTAINER_ID } from "$lib/utils-journal";
	import { onMount } from "svelte";
</script>

{#if $goalsManager}
<div class={`goals-history ${!$themeState.isDarkTheme ? "goals-history--light" : ""}`}>
    <!-- Goals Year Overview -->
    <div class="goals-history__year-view">
        <div class="goals-history__year-view-yr-title-container" id={YR_CONTAINER_ID}>
        </div>
        <div class="goals-history__year-view-row">
            <div class="goals-history__year-view-row-title">
                New Goals
            </div>
            <div class="goals-history__year-view-row-count">
                {$goalsManager.userAccomplishments[$goalsManager.yrIdx].newGoals}
            </div>
        </div>
        <div class="goals-history__year-view-row">
            <div class="goals-history__year-view-row-title">
                Milestones Reached
            </div>
            <div class="goals-history__year-view-row-count">
                {$goalsManager.userAccomplishments[$goalsManager.yrIdx].milestonesReached}
            </div>
        </div>
        <div class="goals-history__year-view-row">
            <div class="goals-history__year-view-row-title">
                Goals Accomplished
            </div>
            <div class="goals-history__year-view-row-count">
                {$goalsManager.userAccomplishments[$goalsManager.yrIdx].goalsAccomplished}
            </div>
        </div>
    </div>
    <!-- Timeline View -->
    <div class="goals-history__timeline">
        <ul 
            class="goals-history__timeline-month-list"
            on:scroll={(e) => $goalsManager?.goalsHistoryTimeScrollHandler(e)}
        >
            {#each $goalsManager.userAccomplishments as yrGroup, yrGroupIdx}
                <li class={`goals-history__timeline-month-list-divider ${yrGroupIdx === 0 ? "hide" : ""}`}>
                    <div class="goals-history__timeline-month-list-divider-dotted-line">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="2" fill="none">
                            <path d="M0.234375 1.29297L900.145 1.29304" stroke-width="0.8" stroke-dasharray="2.3 2.3"/>
                        </svg>
                        <div class="goals-history__timeline-month-list-divider-yr">
                            {$goalsManager.currYr - yrGroupIdx}
                        </div>
                    </div>
                </li>
                {#each months as mo, idx}
                    <li 
                        class="goals-history__timeline-month-container"
                        id={`yr-section--${yrGroupIdx}`}
                    >
                        <div class="goals-history__timeline-month">
                            {mo}
                        </div>
                        <div class="goals-history__timeline-divider"></div>
                        <ul class="goals-history__timeline-list">
                            {#each yrGroup.accomplishments as accomp}
                                {#if accomp.date.getMonth() === idx}
                                    <div 
                                        class={`goals-history__item
                                                    ${accomp.isMilestone ? "goals-history__item--milestone" : ""}
                                               `}
                                    >
                                        <!-- Goal Line  -->
                                        <div class="goals-history__item-left">
                                            <div 
                                                class="goals-history__item-left-emblem"
                                                title={`${accomp.isMilestone ? "Milestone" : "Goal"}`}
                                            >
                                                {#if !accomp.isMilestone}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
                                                        <path d="M4.58936 2.62674C4.58936 1.39662 5.58657 0.399414 6.8167 0.399414C8.04682 0.399414 9.04399 1.39662 9.04399 2.62674C9.04399 3.85687 8.04682 4.85407 6.8167 4.85407C5.58657 4.85407 4.58936 3.85687 4.58936 2.62674Z"/>
                                                        <path d="M2.3621 4.854C2.3621 3.62388 3.35924 2.62674 4.58936 2.62674C5.81949 2.62674 6.8167 3.62395 6.8167 4.85407C6.8167 6.08419 5.81956 7.08133 4.58943 7.08133C3.35931 7.08133 2.3621 6.08412 2.3621 4.854Z"/>
                                                        <path d="M4.58943 7.08133C4.58943 5.85121 5.58657 4.85407 6.8167 4.85407C8.04682 4.85407 9.04399 5.85118 9.04399 7.0813C9.04399 8.31142 8.04674 9.30859 6.81662 9.30859C5.5865 9.30859 4.58943 8.31145 4.58943 7.08133Z"/>
                                                        <path d="M0.134766 2.62674C0.134766 1.39662 1.13198 0.399414 2.3621 0.399414C3.59221 0.399414 4.58936 1.39662 4.58936 2.62674C4.58936 3.85687 3.59222 4.854 2.3621 4.854C1.13198 4.854 0.134766 3.85687 0.134766 2.62674Z"/>
                                                        <path d="M0.134766 7.0813C0.134766 5.85118 1.13198 4.854 2.3621 4.854C3.59222 4.854 4.58943 5.85121 4.58943 7.08133C4.58943 8.31145 3.59221 9.30859 2.3621 9.30859C1.13198 9.30859 0.134766 8.31142 0.134766 7.0813Z"/>
                                                    </svg>
                                                {:else}
                                                    <div class="goals-history__item-left-emblem-dot"></div>
                                                {/if}
                                            </div>
                                            <div class="goal-history__item-dotted-line">
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    width="2" 
                                                    height={`${accomp.isMilestone ? "38" : "31"}`}
                                                    viewBox={`0 0 2 ${accomp.isMilestone ? "38" : "31"}`}
                                                    fill="none"
                                                >
                                                    <path d="M0.886719 0.201172L0.88672 40" stroke-dasharray="1.7 1.7"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <!-- Goal Details  -->
                                        <div class="goals-history__item-details">
                                            <h5 class="goals-history__item-details-title">
                                                {accomp.title}
                                            </h5>
                                            <div class="flx flx--algn-center">
                                                <div class="goals-history__item-details-date">
                                                    {formatDatetoStr(accomp.date, { month: "short", day: "2-digit" })}
                                                </div> 
                                                {#if accomp.isMilestone}
                                                    <div class="goals-history__item-details-goal">
                                                        {accomp.goalRef.title}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </ul>
                    </li>
                {/each}
            {/each}
        </ul>
    </div>
</div>
{/if}

<style global lang="scss">
    $board-top-offset-gap: 48px;

    /* History */
    .goals-history {
        margin-top: 20px;
        padding-left: 25px;
        display: flex;
        height: calc(100% - $board-top-offset-gap);

        &--light  &__year-view {
            &-yr-digit {
                @include text-style(1, 500);
            }
            &-row-title {
                @include text-style(0.8, 500);
            }
            &-row-count {
                @include text-style(0.3, 500);
            }
        }
        &--light &__timeline-month {
            @include text-style(0.78, 600, 1.23rem);
            margin-bottom: 18px;
        }
        &--light &__item-details {
            &-title {
                @include text-style(0.98, 600);
            }
            &-date {
                @include text-style(0.5, 500);
            }
            &-goal {
                @include text-style(0.3, 500);
            }
        }
        &--light &__item {
            &-left-emblem svg {
                fill: rgb(var(--textColor1));
                opacity: 0.18;
            }
            &-left-emblem-dot {
                background-color: rgba(var(--textColor1), 0.3)
            }
        }
        &--light &__timeline-month-list-divider {
            &-yr {
                @include text-style(0.25, 500, 1.25rem);
            }
            &-dotted-line path {
                stroke: rgba(var(--textColor1), 0.2);
            }
        }

        &__year-view {
            margin-top: -5px;
            width: 260px;
            min-width: 260px;

            &-yr-title-container {
                transition: 0.1s ease-in-out;
                margin-bottom: 20px;
                @include flex(center, _);
            }
            &-yr-digit {
                @include text-style(1, 200, 3.2rem);
                font-family: "DM Mono";
                opacity: 0;
            }
            &-row {
                @include flex(center, space-between);
                margin-bottom: 8px;
                width: 190px;
            }
            &-row-title {
                @include text-style(0.55, 400, 1.28rem);
            }
            &-row-count {
                @include text-style(0.2, 400, 1.28rem);
                font-family: "DM Mono";
            }
        }
        &__timeline {
            height: 100%;
            width: calc(100% - 260px);
            
            &-month-list {
                overflow-y: scroll;
                overflow-x: scroll;
                max-height: 100%;
                padding: 0px 0px 200px 0px;
                width: 100%;

                li {
                    width: 100%;
                }
            }
            &-month-list-divider {
                width: 100%;
                margin: 25px 0px 20px 0px;
                -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%);
                mask-image: linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%);

                &-yr {
                    @include text-style(0.24, 300, 1.25rem);
                    margin: 7px 14px 0px 0px;
                    font-family: "DM Mono";
                    text-align: center;
                }
                &-dotted-line {
                    width: 100%;
                }
                &-dotted-line path {
                    stroke: rgba(var(--textColor1), 0.11);
                }
            }
            &-month-container {
                margin-bottom: 20px;
            }
            &-month {
                @include text-style(0.7, 400, 1.23rem);
                margin-bottom: 12px;
            }
            &-divider {
                width: 90%;
                height: 0.5px;
                background-color: rgba(var(--textColor1), 0.05);
                margin-bottom: 15px;
                display: none;
            }
        }
        &__item {
            display: flex;
            height: auto;

            &--milestone .goal-history__item-dotted-line svg {
                top: 10px;
            }
            
            &:not(:last-child) {
                margin-bottom: 15px;
            }
            &:last-child .goal-history__item-dotted-line {
                display: none;
            }
            &-left {
                height: 100%;
                margin-right: 14px;
                position: relative;
            }
            &-left-emblem {
                width: 10px;
                height: 10px;

                svg {
                    fill: rgb(var(--textColor1));
                    opacity: 0.17;
                }
            }
            &-left-emblem-dot {
                margin: 3px 0px 0px 2.5px;
                @include circle(4px);
                background-color: rgba(var(--textColor1), 0.17)
            }
        }
        &__item-details {
            white-space: nowrap;
            margin-left: 5px;
            &-title {
                margin: -4px 0px 4px 0px;
                @include text-style(0.85, 400, 1.2rem);
            }
            &-date {
                font-family: "DM Mono";
                @include text-style(0.44, 200, 1.05rem);
                margin-right: 11px;
            }
            &-goal {
                @include text-style(0.3, 300, 1.2rem);
                margin-right: 6.5px;
            }
        }
    }
    .goal-history__item-dotted-line {
        svg {
            @include abs-top-left(14px, 3.5px);
        }
        path {
            stroke: rgba(var(--textColor1), 0.14)
        }
    }

    @keyframes fade-in-digit {
        0% {
            transform: translateY(-15px);
            visibility: hidden;
            opacity: 0;
        }
        100% {
            transform: translateY(0px);
            visibility: visible;
            opacity: 1;
        }
    }
</style>