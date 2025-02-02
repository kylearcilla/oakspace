<script lang="ts">
    import { themeState } from "../lib/store"
    import { getColorTrio } from "$lib/utils-colors"
    import { getDueDateDistStr } from "$lib/utils-goals"
    
	import ProgressBar from "./ProgressBar.svelte";

    export let goal: Goal
    export let onClick: ((goal: Goal) => void) | undefined = undefined
    export let options: {
        img?: boolean
        description?: boolean
        due?: boolean
        dueType?: "date" | "distance"
        completed?: boolean
        progress?: boolean
        tag?: boolean
        
    } | undefined = undefined
    export let highlighted: boolean = false
    
    $: isLight = !$themeState.isDarkTheme
    $: tagColor = tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]
    $: onOptionsChange(options)

    let view = {
        img: options?.img ?? false,
        description: options?.description ?? true,
        due: options?.due ?? true,
        dueType: options?.dueType ?? "date",
        completed: options?.completed ?? false,
        progress: options?.progress ?? true,
        tag: options?.tag ?? true,
    }

    const { due, name, description, tag, imgSrc, milestones } = goal
    const { img, completed, tag: hasTag } = view

    let isLate = false
    let dueStr = ""
    
    function onOptionsChange(options) {
        view = { ...view, ...options }
        _getDueDateDistStr(goal, view.dueType)
    }
    function _getDueDateDistStr(goal: Goal, type: "date" | "distance") {
        const res = getDueDateDistStr(goal, type)
        isLate = res.isLate
        dueStr = res.dueStr
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="goal-card"
    class:goal-card--light={isLight}
    class:goal-card--completed={completed}
    class:goal-card--highlighted={highlighted}
    role="button"
    tabindex="0"
    on:click|self={() => onClick(goal)}
>
    {#if imgSrc && img}
        <div class="goal-card__img">
            <img src={imgSrc} alt="Goal item">
        </div>
    {/if}
    <div class="goal-card__details">
        <div class="goal-card__title">
            {name}
        </div>
        {#if view.description && description}
            <div class="goal-card__description">
                {description}
            </div>
        {/if}
        {#if milestones?.length > 0 && view.progress}
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
                    <div class="tag__title">
                        {tag?.name}
                    </div>
                </div>
            {/if}
            {#if view.due}
                <div 
                    class="goal-card__due"
                    class:goal-card__due--late={isLate}
                    style:margin-bottom={"0px"}
                >
                    {view.completed ? "Done" : dueStr}
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @mixin focus {
        background-color: rgba(var(--textColor1), 0.035);
        box-shadow: rgba(#0C8CE9, 0.35) 0px 0px 0px 2px inset, 
                    rgba(#0C8CE9, 0.1) 0px 0px 0px 2.5px;
    }
    .goal-card {
        cursor: pointer;
        border-radius: 16px;
        margin-bottom: 4px;
        background-color: var(--cardBgColor);
        border: 1px solid rgba(var(--textColor1), 0.015);
        overflow: hidden;
        transition: 0.18s transform cubic-bezier(.4, 0, .2, 1), 
                    0.045s background-color ease-in-out;
        position: relative;
        user-select: text;

        &:hover {
            background-color: var(--cardFgColor);
        }
        &:active {
            transform: scale(0.995);
        }
        &::before {
            content: " ";
            width: calc(100% - 5px);
            height: 0.5px;
            background-color: rgba(var(--textColor1), 0.062);
            @include abs-top-left(0px, 5px);
            display: none;
        }
        &:focus-visible {
            @include focus;
        }

        &--light {
            border: 1.5px solid rgba(var(--textColor1), 0.0185);
        }
        &--light &__due {
            @include text-style(0.2);
        }
        &--light &__description {
            @include text-style(0.55);
        }
        &--light &__due {
            @include text-style(0.5);
        }
        &--completed {
            opacity: 0.4;
        }
        &--highlighted {
            @include focus;
        }
        &__details {
            padding: 11px 12px 11px 13px;
        }
        &__img {
            height: 110px;
            width: calc(100% - 8px);
            margin: 4px 4px 0px 4px;
            
            img {
                object-fit: cover;
                border-radius: 12px;
                border-bottom-left-radius: 1px;
                border-bottom-right-radius: 1px;
                width: 100%;
                height: 100%;
            }
        }
        &__due {
            @include text-style(0.35, var(--fw-400-500), 1.25rem);
            white-space: nowrap;
        }
        &__due--late {
            color: rgba(#e06b60a6, 0.85) !important;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.4rem);
            cursor: text;
            width: fit-content;
            margin-right: 7px;
        }
        &__progress {
            @include flex(center);
            margin-top: 10px;
        }
        &__description {
            @include text-style(0.285, 400, 1.25rem);
            @include truncate-lines(3);
            margin: 6px 0px 12px 0px;
            cursor: text;
        }
        &__bottom {
            margin-top: 10px;
            @include flex(center, space-between)
        }
        &__tag {
            border-radius: 6px;
            padding: 3px 9px 4.5px 9px;
        }
        .tag {
            margin-right: 15px;
        }
    }
</style>