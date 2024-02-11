<script lang="ts">
	import { GoalItemUI, GoalStatus } from "$lib/enums";
	import { themeState } from "$lib/store";
	import { formatDateLong } from "$lib/utils-date";
	import { onMount } from "svelte";
	import GoalsBoard from "../routes/home/GoalsBoard.svelte";

    export let goal: Goal 
    export let appearance: GoalItemUI
    export let status: GoalStatus

    let goalItemModifier = ""
    let bgImgOverlay = 0.4

    const goalStatuses = [
        { color: "#CB6E6E", title: "On-Hold"}, 
        { color: "#D2B569", title: "In-Progress"}, 
        { color: "#8FD067", title: "Accomplished"}
    ]

    $: {
        if (appearance === GoalItemUI.BoardList) {
            goalItemModifier = "board-list"
        }
        else if (appearance === GoalItemUI.RepoCard) {
            goalItemModifier = "repo-card"
        }
        else if (appearance === GoalItemUI.RepoList) {
            goalItemModifier = "repo-list"
        }
        else {
            goalItemModifier = "board-card"
        }
    }
    $: {
        if ($themeState.isDarkTheme) {
            bgImgOverlay = 0.8
        }
        else {
            bgImgOverlay = 0.4
        }
    }
</script>

<div 
    class={`goal-item goal-item--${goalItemModifier} ${goal.imgSrc ? `goal-item--${goalItemModifier}-img` : ""} ${$themeState.isDarkTheme ? "" : "goal-item--light"}`}
    style={`${appearance === GoalItemUI.RepoCard && goal.imgSrc? `background-image: linear-gradient(0deg, rgba(0, 0, 0, ${bgImgOverlay}), rgba(0, 0, 0, ${bgImgOverlay})), url(${goal.imgSrc});` : '' }`}
>
    {#if !goal.isImgHidden}
        <img class="goal-item__img" src={goal?.imgSrc} alt="goal-img" />
    {/if}
    <div class="goal-item__content">
    <div class="goal-item__details">
        <div class="goal-item__details-header">
            <!-- Title -->
            <h5 class="goal-item__name" title={goal?.title}>
                {goal?.title}
            </h5>
            {#if goal.isPinned && [GoalItemUI.RepoCard, GoalItemUI.RepoList].includes(appearance)}
                <div class="goal-item__pinned">
                    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="9" viewBox="0 0 7 9" fill="none">
                        <path d="M0.648124 1.40271C0.648124 1.12919 0.869107 0.908203 1.14263 0.908203L5.09869 0.908203C5.37221 0.908203 5.59319 1.12919 5.59319 1.40271C5.59319 1.67623 5.37221 1.89722 5.09869 1.89722H4.64281L4.81898 4.1874C5.38612 4.49492 5.83426 5.00952 6.04752 5.65083L6.06297 5.69719C6.11397 5.84864 6.0877 6.01399 5.99498 6.14225C5.90226 6.27051 5.75236 6.34778 5.59319 6.34778H0.648124C0.488955 6.34778 0.340603 6.27206 0.246338 6.14225C0.152072 6.01244 0.127347 5.84709 0.178343 5.69719L0.193796 5.65083C0.407052 5.00952 0.855199 4.49492 1.42234 4.1874L1.5985 1.89722H1.14263C0.869107 1.89722 0.648124 1.67623 0.648124 1.40271ZM2.62615 6.84229H3.61517V8.32581C3.61517 8.59933 3.39418 8.82031 3.12066 8.82031C2.84713 8.82031 2.62615 8.59933 2.62615 8.32581V6.84229Z"/>
                    </svg>
                    <span>Pinned</span>
                </div>
            {/if}
        </div>
        <!-- Description -->
        {#if appearance != GoalItemUI.RepoCard}
            <p class="goal-item__description" title={goal?.description}>
                {goal?.description}
            </p>
        {/if}
        <div class="goal-item__bottom-details">
            <div class="flx flx--algn-center">
                <!-- Status (Repo List Only)-->
                {#if [GoalItemUI.RepoList, GoalItemUI.RepoCard].includes(appearance)}
                    <div class="goal-item__status">
                        <div class="goal-item__status-dot" style={`background-color: ${goalStatuses[status].color}`}></div>
                        <span>{goalStatuses[status].title}</span>
                    </div>
                {/if}
                <!-- Target Date (Lists Only) -->
                {#if goal.dueDate}
                    <span class="goal-item__target-date" title="Target Date">
                        {formatDateLong(goal.dueDate)}
                    </span>
                {/if}
            </div>
            <!-- Milestone Count -->
            {#if goal?.milestones && goal.milestones.length > 0}
                <div class="goal-item__milestones" title="Milestones">
                    {`${goal?.milestonesDone} / ${goal?.milestones.length}`}
                </div>
            {/if}
        </div>
    </div>
    </div>
</div>


<style lang="scss">
    $goal-card-height: 94px;
    $goal-card-width: 145px;

    .goal-item {
        background-color: var(--bentoBoxBgColor);
        box-shadow: var(--bentoBoxShadow);
        border-radius: 15px;
        font-weight: 300;
        position: relative;
        transition: 0s ease-in-out;
        position: relative;
        background-repeat: no-repeat;
        background-size: $goal-card-width;

        &:hover {
            transition: 0.014s ease-in-out;
            filter: brightness(1.16);
        }
        
        &--light  {
            border-color: transparent !important;
            &:hover {
                filter: brightness(1.018) !important;
            }
        }

        // general light mode styling
        &--light &__name { 
            @include text-style(0.91, 600);
        }
        &--light &__description {
            @include text-style(0.58, 500, 1.15rem);
        }
        &--light &__status {
            @include text-style(0.8, 600);
        }
        &--light &__milestones {
            @include text-style(0.5, 500);
        }
        &--light &__target-date {
            @include text-style(0.5, 500, 1.1rem);
        }
        &--light &__pinned {
            span {
                @include text-style(0.3, 500, 1.05rem);
            }
        }

        // repo card img stylings
        &--light#{&}--repo-card-img &__content {
            border: none !important;
            background: none;
        }
        &--light#{&}--repo-card-img &__name {
            color: rgba(255, 255, 255, 0.95);
            font-weight: 500;
        }
        &--light#{&}--repo-card-img &__pinned {
            path {
                fill: rgba(234, 234, 234, 0.5);
            }
            span {
                color: rgba(201, 200, 200, 0.5) !important;
                font-weight: 400;
            }
        }
        &--light#{&}--repo-card-img &__target-date {
            color: rgba(255, 255, 255, 0.65);
            font-weight: 300;
        }
        &--light#{&}--repo-card-img &__milestones {
            color: rgba(164, 164, 164, 0.95);
            font-weight: 300;
        }

        // repo card
        &--light#{&}--repo-card &__pinned {
            span {
                @include text-style(0.3, 500, 1.05rem);
            }
        }
        &--repo-card {
            height: $goal-card-height;
            width: $goal-card-width;
            border-radius: 13px;

            &:hover {
                transition: 0.12s ease-in-out;
                filter: brightness(1.15);
            }
        }
        &--repo-card &__details-header {
            display: block;
        }
        &--repo-card-img &__content {
            background: linear-gradient(180deg, transparent 0%, rgba(9, 9, 9, 0.75) 100%);
            border: 0.5px solid #161616 !important;
        }
        &--repo-card &__content {
            border-radius: 13px;
            border: 0.5px solid rgba(var(--textColor1), 0.018);
        }
        &--repo-card &__pinned {
            margin: 4px 0px 0px 0px;
            svg {
                transform: scale(1);
            }
            span {
                @include text-style(0.2, 300, 1rem);
            }
        }
        &--repo-card &__target-date {
            margin-bottom: 0px;
            font-size: 1.03rem;
        }
        &--repo-card &__milestones {
            font-size: 1rem;
        }
        &--repo-card &__details {
            @include flex(_, space-between);
            flex-direction: column;
            padding: 7.5px 9px 7.5px 10px;
            height: 100%;
        }
        &--repo-card &__status {
            span {
                display: none;
            }
            &-dot {
                margin: 0px;
            }
        }

        // repo list
        &--repo-list &__status {
            span {
                display: none;
            }
            &-dot {
                margin-right: 2px;
            }
        }

        // board list
        &--board-list, &--repo-list {
            width: 100%;
            padding: 0px;
            background: none;
            border-color: transparent;
            padding-right: 20px;
            box-shadow: none;
        }
        &--board-list &__img, &--repo-list &__img, &--repo-card &__img {
            display: none;
        }
        &--board-list &__description, &--repo-list &__description {
            @include multi-line-elipses-overflow(1);
            margin-bottom: 10px;
        }
        &--board-list &__target-date, &--repo-list &__target-date {
            margin: 0px 12px 0px 0px;
        }
        &--board-list &__bottom-details, &--repo-list &__bottom-details {
            @include flex(center, flex-start);
        }

        // board card
        &--board-card {
            padding: 9.5px 9.5px 12px 9.5px;
            border: 0.5px solid #161616;
        }

        &__img {
            width: 100%;
            margin-bottom: 9px;
            border-radius: 10px;
            object-fit: cover;
            height: 110px;
        }
        &__content {
            height: 100%;
            width: 100%;
            border-radius: 15px;
        }
        &__details-header {
            @include flex(center, space-between);
            margin-bottom: 6px;
        }
        &__pinned {
            @include flex(center);
            svg {
                margin-right: 6px;
                transform: scale(1.1);
                fill: rgba(var(--textColor1), 0.2);
            }
            span {
                @include text-style(0.2, 300, 1.1rem);
            }
        }
        &__name, &__description, &__status-dot, &__status, &__milestones {
            cursor: text;
            user-select: text;
            font-size: 1.08rem;
        }
        &__name {
            @include text-style(0.77, 500, 1.24rem);
            width: fit-content;
            max-width: 95%;
            @include multi-line-elipses-overflow(2);
        }
        &__target-date {
            @include text-style(0.24, 200, 1.1rem);
            display: inline-block;
            font-family: "DM Sans";
            cursor: text;
        }
        &__description {
            @include text-style(0.36, _, 1.15rem);
            margin-bottom: 14px;
            width: fit-content;
            white-space: pre-wrap;
            word-break: break-word;
            @include multi-line-elipses-overflow(11);
        }
        &__bottom-details {
            @include flex(center, space-between);
        }
        &__bottom-details-left {
            @include flex(center, _);
        }
        &__status-dot {
            @include circle(2.5px);
            margin-right: 7px;
        }
        &__status {
            @include text-style(0.44, 400);
            margin-right: 6.5px;
            @include flex(center);
        }
        &__milestones {
            @include text-style(0.24);
            font-family: "DM Sans";
        }
    }
</style>