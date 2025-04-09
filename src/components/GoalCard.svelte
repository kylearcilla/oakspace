<script lang="ts">
    import { themeState } from "../lib/store"
    import { getColorTrio } from "$lib/utils-colors"
	import { kebabToNormal } from "$lib/utils-general"
    import { getDueDateDistStr, setViewGoal } from "$lib/utils-goals"
	import SvgIcon from "./SVGIcon.svelte";
	import { Icon } from "$lib/enums";
	import AccomplishedIcon from "./AccomplishedIcon.svelte";
	import { formatDateLong } from "$lib/utils-date";

    export let goal: Goal
    export let pinned: boolean = false
    export let options: {
        type?: "hoz" | "vert"
        img?: boolean
        description?: boolean
        due?: boolean
        dueType?: "date" | "distance"
        progress?: boolean
        tag?: boolean
        
    } | undefined = undefined
    export let highlighted: boolean = false
    
    let { 
        type = "vert",
        img: showImg = true,
        dueType = "date",
        description: showDesc = true,
        due: showDue = true,
        tag: showTag = true
    } = options || {}

    $: isLight = !$themeState.isDarkTheme
    $: showImg = options?.img ?? false
    $: tagColor = tag ? getColorTrio(tag.symbol.color, isLight) : ["", "", ""]
    $: onOptionsChange(options)


    let { name, description, tag, img, status, completedDate } = goal

    function onOptionsChange(options: any) {
        dueType = options.dueType
        showDue = options.due
        showTag = options.tag
    }
    function getDueString(goal: Goal, type: "distance" | "date") {
        const { due, dueType } = goal
        return getDueDateDistStr({ due, dueType, type })
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="goal-card"
    class:goal-card--light={isLight}
    class:goal-card--completed={status === "accomplished"}
    class:goal-card--highlighted={highlighted}
    class:goal-card--hoz={type === "hoz"}
>
    {#if showImg && img}
        <div class="goal-card__img">
            <img src={img.src} alt="Goal item">
        </div>
    {/if}
    <div class="goal-card__details">
        <div>
            <div class="flx-top-sb">
                <button 
                    class="goal-card__title"
                    on:click={() => setViewGoal(goal)}
                >
                    {name}
                </button>
                {#if status === "accomplished" && completedDate && type === "hoz"}
                    <div title={`Completed on ${formatDateLong(completedDate)}`}>
                        <AccomplishedIcon scale={0.65} />
                    </div>
                {/if}
                {#if pinned}
                    <div class="goal-card__pinned">
                        <SvgIcon 
                            icon={Icon.Pin} 
                            options={{ scale: 1, opacity: 0.2, strokeWidth: 0.4 }} 
                        />
                    </div>
                {/if}
            </div>
            {#if showDesc && description}
                <div class="goal-card__description">
                    {description}
                </div>
            {/if}
        </div>
        <div 
            class="goal-card__bottom"
            class:hidden={!tag && !showDue}
        >
            {#if showDue}
                {@const { dueStr } = getDueString(goal, dueType)}

                <div 
                    class="goal-card__due"
                    style:margin-bottom={"0px"}
                >
                    {dueStr}
                </div>
            {/if}
            {#if tag && showTag}
                <div 
                    class="goal-card__tag tag"
                    style:--tag-color-primary={tag?.symbol.color.primary}
                    style:--tag-color-1={tagColor[0]}
                    style:--tag-color-2={tagColor[1]}
                    style:--tag-color-3={tagColor[2]}
                    title={tag.name}
                >
                    <div class="tag__title" style:font-size="1.225rem">
                        {tag?.name}
                    </div>
                </div>
            {:else}
                <div 
                    class="goal-card__due"
                    class:no-bg={true}
                    style:padding="2px"
                >
                    <span>{kebabToNormal(status)}</span>
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
        border-radius: 10px;
        margin: 0px 8px 4px 0px;
        background-color: var(--cardBgColor);
        border: 1px solid rgba(var(--textColor1), 0.015);
        overflow: hidden;
        position: relative;
        user-select: text;
        --complete-opacity: 0.4;

        &--hoz {
            height: 135px;
            background: rgba(var(--textColor1), 0.018);
            margin-right: 8px;
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
            display: flex;
            border: 1.5px solid rgba(var(--textColor1), 0.01);
            opacity: 1 !important;
            --complete-opacity: 0.3;
        }
        &--hoz &__img {
            width: 140px;
            height: 100%;
            object-fit: cover;
            margin: 0px;
            padding: 8px 9px 8px 8px;

            img {
                border-radius: 4px;
            }
        }
        &--hoz &__title {
            @include text-style(1, var(--fw-400-500), 1.35rem, "Geist Mono");
            @include truncate-lines(2);
        }
        &--hoz &__details {
            min-width: 160px;
            max-width: 200px;
            padding: 10px 11px 10px 12px;
            height: 100%;
        }
        &--hoz &__bottom {
            margin-top: 0px;
        }
        &--light {
            border: var(--card-light-border);
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
        &--light#{&}--hoz {
            background: rgba(var(--textColor1), 0.04);
            box-shadow: none;
        }
        &--completed {
            opacity: 0.4;
        }
        &--completed &__title {
            text-decoration: line-through;
            opacity: var(--complete-opacity);
        }
        &--highlighted {
            @include focus;
        }
        &__details {
            padding: 8px 11px 9px 11px;
            @include flex-col(space-between);
        }
        &__img {
            height: 110px;
            width: calc(100% - 10px);
            margin: 5px 5px 3px 5px;
            
            img {
                object-fit: cover;
                border-radius: 7px;
                border-bottom-left-radius: 3px;
                border-bottom-right-radius: 3px;
                width: 100%;
                height: 100%;
            }
        }
        &__due {
            @include text-style(0.5, var(--fw-400-500), 1.15rem, "Geist Mono");
            white-space: nowrap;
            background-color: rgba(var(--textColor1), 0.02);
            padding: 4px 9px;
            border-radius: 6px;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.4rem);
            @include truncate-lines(8);
            width: fit-content;
            margin-right: 7px;

            &:hover {
                text-decoration: underline;
            }
        }
        &__description {
            @include text-style(0.35, 400, 1.325rem);
            @include truncate-lines(3);
            margin: 6px 0px 8px 0px;
            cursor: text;
        }
        &__bottom {
            @include flex(center, space-between);
            margin-top: 10px;
        }
        &__tag {
            border-radius: 6px;
            padding: 4px 9px 5px 9px;
        }
    }
</style>