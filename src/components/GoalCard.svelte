<script lang="ts">
	import { formatDateLong, formatDatetoStr, getTimeDistanceStr } from "$lib/utils-date"
	import { themeState } from "../lib/store";
	import { getColorTrio } from "../lib/utils-general";

    export let goal: Goal
    export let onClick: (goal: Goal) => void

    $: isDarkTheme = $themeState.isDarkTheme

    const { due, dueType, name, description, tag } = goal

    const dueStr = getDueString()
    const dueDateDistStr = due ? getTimeDistanceStr(due) : ""
    const tagColor = tag ? getColorTrio(tag.symbol.color, isDarkTheme) : ["", "", ""]
    const isLate = dueDateDistStr.includes("ago")

    function getDueString() {
        if (!due) {
            return dueType === "someday" ? "Some Day 🤞" : "No Due Date"
        }
        else if (dueType === "quarter") {
            const month = due.getMonth() + 1
            const quarter = Math.ceil(month / 3)
            return `Quarter ${quarter}`
        } 
        else if (dueType === "year") {
            return `${due.getFullYear()}`
        } 
        else if (dueType === "month") {
            return formatDatetoStr(due, { month: "long"})
        } 
        else {
            return formatDateLong(due)
        } 
    }


</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="goal-card"
    class:goal-card--late={isLate}
    on:click|self={() => onClick(goal)}
>
    <div class="goal-card__due">
        {dueStr}
    </div>
    <div class="goal-card__title">
        {name}
    </div>
    <div class="goal-card__description">
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
            {dueDateDistStr}
        </div>
    </div>
</div>

<style lang="scss">
    .goal-card {
        // font-family: "DM Mono";
        transition: 0.01s ease-in-out;
        cursor: pointer;
        
        border-radius: 12px;
        padding: 11px 10px 11px 11px;
        margin-bottom: 7px;
        background-color: rgba(var(--textColor1), 0.0155);
        border: 1px solid rgba(var(--textColor1), 0.015);

        // padding: 10px 10px 10px 0px;
        // border-top: dashed 1px rgba(var(--textColor1), 0.055);

        &:hover {
            background-color: rgba(var(--textColor1), 0.025);
        }

        &--late &__due-date-dist {
            color: rgba(#ec846d, 0.5);
        }
        &__due {
            @include text-style(0.2, 400, 1.3rem, "DM Sans");
            margin-bottom: 6px;
        }
        &__title {
            @include text-style(0.75, 500, 1.255rem);
            cursor: text;
        }
        &__description {
            @include text-style(0.285, 500, 1.3rem);
            @include multi-line-elipses-overflow(2);
            margin-top: 6px;
            cursor: text;
        }
        &__bottom {
            margin-top: 18px;
            @include flex(center, space-between)
        }
        &__tag {
            border-radius: 6px;
            padding: 2px 9px 3.5px 9px;
            font-family: "DM MOno"
        }
        .tag {
            &__symbol {
                font-size: 0.95rem;
            }
            &__title {
                font-size: 1.2rem;
            }
        }
        &__due-date-dist {
            @include text-style(0.2, 400, 1.25rem, "DM Sans");
        }
    }
</style>