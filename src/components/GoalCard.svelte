<script lang="ts">
	import { getDueString, getTimeDistanceStr } from "$lib/utils-date"
	import { themeState } from "../lib/store";
	import { getColorTrio } from "../lib/utils-general";

    export let goal: Goal
    export let onClick: (goal: Goal) => void
    export let options: {
        img: boolean
        description?: boolean
        due?: boolean
        completed?: boolean
        
    } | undefined = undefined
    
    $: isDarkTheme = $themeState.isDarkTheme

    const view = {
        img: options?.img ?? false,
        description: options?.description ?? true,
        due: options?.due ?? true,
        completed: options?.completed ?? false,
    }

    const { due, dueType, name, description, tag, imgSrc } = goal

    const dueStr = getDueString(due, dueType)
    const dueDateDistStr = due ? getTimeDistanceStr(due) : ""
    const tagColor = tag ? getColorTrio(tag.symbol.color, isDarkTheme) : ["", "", ""]
    const isLate = dueDateDistStr.includes("ago")

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="goal-card"
    class:goal-card--late={isLate}
    class:goal-card--completed={view.completed}
    on:click|self={() => onClick(goal)}
>
    {#if imgSrc && view.img}
        <div class="goal-card__img">
            <img src={imgSrc} alt="Goal item">
        </div>
    {/if}
    <div class="goal-card__details">
        <div class="goal-card__due" class:hidden={!view.due}>
            {dueStr}
        </div>
        <div class="goal-card__title">
            {name}
        </div>
        <div class="goal-card__description" class:hidden={!view.description}>
            {description}
        </div>
        <div 
            class="goal-card__bottom"
            class:hidden={!tag && !due}
        >
            {#if tag}
                <div 
                    class="goal-card__tag tag"
                    style:--tag-color-primary={tag?.symbol.color.primary}
                    style:--tag-color-1={tagColor[0]}
                    style:--tag-color-2={tagColor[1]}
                    style:--tag-color-3={tagColor[2]}
                    title={tag.name}
                >
                    <span class="tag__symbol">
                        {tag?.symbol.emoji}
                    </span>
                    <div class="tag__title">
                        {tag?.name}
                    </div>
                </div>
            {/if}
            <div class="goal-card__due-date-dist">
                {view.completed ? "Done" : dueDateDistStr}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .goal-card {
        // font-family: "DM Mono";
        transition: 0.01s ease-in-out;
        cursor: pointer;
        border-radius: 14px;
        margin-bottom: 7px;
        background-color: var(--hoverColor);
        border: 1px solid rgba(var(--textColor1), 0.015);
        overflow: hidden;

        // padding: 10px 10px 10px 0px;
        // border-top: dashed 1px rgba(var(--textColor1), 0.055);

        &:hover {
            background-color: rgba(var(--textColor1), 0.025);
        }

        &--completed {
            opacity: 0.4;
        }
        &--late &__due-date-dist {
            color: rgba(#ec846d, 0.5);
        }
        &__details {
            padding: 11px 10px 11px 11px;
        }
        &__img {
            height: 80px;
            width: calc(100% + 22px);
            
            img {
                object-fit: cover;
                // border-radius: 8px;
                width: 100%;
                height: 100%;
            }
        }
        &__due {
            @include text-style(0.2, 400, 1.2rem, "DM Sans");
            margin-bottom: 6px;
        }
        &__title {
            @include text-style(0.75, 500, 1.285rem);
            cursor: text;
            width: fit-content
        }
        &__description {
            @include text-style(0.285, 500, 1.3rem);
            @include multi-line-elipses-overflow(2);
            margin-top: 6px;
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
            @include text-style(0.2, 400, 1.25rem, "DM Sans");
            white-space: nowrap;
        }
    }
</style>