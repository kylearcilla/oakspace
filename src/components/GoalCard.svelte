<script lang="ts">
	import { getDueString, getTimeDistanceStr } from "$lib/utils-date"
	import { themeState } from "../lib/store";
	import { COLOR_SWATCHES } from "../lib/utils-colors";
	import { getColorTrio } from "../lib/utils-general";
	import ProgressBar from "./ProgressBar.svelte";
	import ProgressRing from "./ProgressRing.svelte";

    export let goal: Goal
    export let onClick: (goal: Goal) => void
    export let options: {
        img?: boolean
        description?: boolean
        due?: boolean
        progress?: "simple" | "default"
        type?: "simple" | "default"
        completed?: boolean
        tag?: boolean
        
    } | undefined = undefined
    
    $: isLight = !$themeState.isDarkTheme
    const view = {
        img: options?.img ?? false,
        description: options?.description ?? true,
        due: options?.due ?? true,
        progress: options?.progress ?? "default",
        type: options?.type ?? "default",
        completed: options?.completed ?? false,
        tag: options?.tag ?? true,
    }

    const { due, dueType, name, description, tag, imgSrc, milestones } = goal
    const { progress, img, type, completed, tag: hasTag } = view

    $: tagColor = tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]

    const dueStr = getDueString(due, dueType)
    const dueDateDistStr = due ? getTimeDistanceStr(due) : ""
    const isLate = dueDateDistStr.includes("ago")

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="goal-card"
    class:goal-card--light={isLight}
    class:goal-card--late={isLate}
    class:goal-card--completed={completed}
    class:goal-card--simple={type === "simple"}
    on:click|self={() => onClick(goal)}
>
    {#if imgSrc && img}
        <div class="goal-card__img">
            <img src={imgSrc} alt="Goal item">
        </div>
    {/if}
    <div class="goal-card__details">
        <div class="goal-card__due" class:hidden={!view.due}>
            {dueStr}
        </div>
        <div class="flx flx--space-between">
            <div class="goal-card__title">
                {name}
            </div>
            {#if milestones?.length > 0 && progress === "simple"}
                {@const checked = milestones.reduce((c, ms) => ms.done ? c + 1 : c, 0)}
                <div class="goal-card__progress-ring">
                    <ProgressRing 
                        progress={checked / milestones.length} 
                        options={{ style: "rich-colored" }}    
                    />
                </div>
            {/if}
        </div>
        <!-- {#if type === "simple"}
            <div class="goal-card__due-date-dist">
                {view.completed ? "Done" : dueDateDistStr}
            </div>
        {/if} -->
        <div class="goal-card__description" class:hidden={!view.description}>
            {description}
        </div>

        {#if milestones?.length > 0 && progress === "default"}
            {@const checked = milestones.reduce((c, ms) => ms.done ? c + 1 : c, 0)}
            <div class="goal-card__progress">
                <ProgressBar progress={checked / milestones.length}/>
            </div>
        {/if}

        <div 
            class="goal-card__bottom"
            class:hidden={!tag && !due}
        >
            {#if tag && hasTag}
                <div 
                    class="goal-card__tag tag"
                    style:--tag-color-primary={tag?.symbol.color.primary}
                    style:--tag-color-1={tagColor[0]}
                    style:--tag-color-2={tagColor[1]}
                    style:--tag-color-3={tagColor[2]}
                    title={tag.name}
                >
                    <!-- <span class="tag__symbol">
                        {tag?.symbol.emoji}
                    </span> -->
                    <div class="tag__title">
                        {tag?.name}
                    </div>
                </div>
            {/if}
            {#if type === "default"}
                <div class="goal-card__due-date-dist">
                    {view.completed ? "Done" : dueDateDistStr}
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .goal-card {
        cursor: pointer;
        border-radius: 14px;
        margin-bottom: 7px;
        background-color: var(--cardBgColor);
        // border: 1px solid rgba(var(--textColor1), 0.015);
        overflow: hidden;
        transition: 0.18s cubic-bezier(.4, 0, .2, 1);
        position: relative;

        &:hover {
            background-color: var(--cardFgColor);
        }
        &:active {
            transform: scale(0.99);
        }
        &::before {
            content: " ";
            width: calc(100% - 5px);
            height: 0.5px;
            background-color: rgba(var(--textColor1), 0.062);
            @include abs-top-left(0px, 5px);
            display: none;
        }

        &--light {
            border: 1.5px solid rgba(var(--textColor1), 0.05);
            box-shadow: 0px 5px 6px 1px rgba(0, 0, 0, 0.02);
        }
        &--light &__due {
            @include text-style(0.2, 500);
        }
        &--light &__title {
            @include text-style(0.85, 600);
        }
        &--light &__description {
            @include text-style(0.5, 500);
        }
        &--light &__due-date-dist {
            @include text-style(0.5, 600);
        }
        &--simple:first-child {
            border: none;
            margin-top: -6px;
        }
        &--simple {
            background: none;
            border: none;
            border-radius: 0px;
            margin-bottom: 0px;
            overflow: visible;

            &::before {
                display: block;
            }
        }
        &--simple &__details {
            padding: 11px 5px 0px 8px;
        }
        &--simple &__description {
            margin-bottom: 13px;
            @include truncate-lines(2);
        }
        &--simple &__due-date-dist {
            margin: 4px 0px 8px 0px;
        }
        &--simple &__tag, 
        &--simple &__progress-ring {
            display: none;
        }
        &--completed {
            opacity: 0.4;
        }
        &--late &__due-date-dist {
            // color: rgba(#ec846d, 0.5);
        }
        &__details {
            padding: 11px 12px 11px 13px;
        }
        &__img {
            height: 80px;
            width: calc(100% - 8px);
            margin: 4px 4px 0px 4px;
            
            img {
                object-fit: cover;
                border-radius: 9px;
                border-bottom-left-radius: 1px;
                border-bottom-right-radius: 1px;
                width: 100%;
                height: 100%;
            }
        }
        &__due {
            @include text-style(0.2, 400, 1.3rem, "DM Sans");
            margin-bottom: 6px;
        }
        &__title {
            @include text-style(1, 500, 1.4rem);
            cursor: text;
            width: fit-content;
            margin-right: 7px;
        }
        &__progress {
            @include flex(center);
            margin-top: 8px;

            .fraction {
                margin-right: 9px;
            }
        }
        &__progress-ring {
            transform: scale(0.9);
        }
        &__description {
            @include text-style(0.285, 500, 1.35rem);
            @include truncate-lines(3);
            margin: 6px 0px 12px 0px;
            cursor: text;
        }
        &__bottom {
            margin-top: 16px;
            @include flex(center, space-between)
        }
        &__tag {
            border-radius: 6px;
            padding: 2px 9px 3.5px 9px;
            font-family: "DM MOno"
        }
        .tag {
            margin-right: 15px;
            &__symbol {
                font-size: 0.95rem;
            }
            &__title {
                font-size: 1.2rem;
            }
        }
        &__due-date-dist {
            @include text-style(0.2, 400, 1.25rem);
            white-space: nowrap;
        }
    }
</style>