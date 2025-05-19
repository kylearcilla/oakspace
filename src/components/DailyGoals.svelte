<script lang="ts">
    import { themeState } from "$lib/store"
	import { GOALS } from "$lib/mock-data-goals"
	import { setViewGoal } from "$lib/utils-goals"
	import EmptyList from "./EmptyList.svelte";

    export let goals: Goal[] = []
    export let date = new Date()

    $: light = !$themeState.isDarkTheme


    function onGoalChecked(goal: Goal) {

    }
</script>

<div class="dg" class:dg--light={light}>
    {#each goals.sort((a, b) => a.name.localeCompare(b.name)) as goal}
        <div 
            class="dg__goal"
            class:dg__goal--checked={goal.status === "accomplished"}
        >
            <button class="dg__goal-checkbox" 
                on:click={() => onGoalChecked(goal)}
            >
                <i class="fa-solid fa-check"></i>
            </button>
            <button 
                class="dg__goal-name" 
                title={goal.name}
                on:click={() => setViewGoal(goal)}
            >
                {goal.name}
            </button>
        </div>
    {:else}
        <EmptyList emptyText="0 Goals" />
    {/each}
</div>

<style lang="scss">
    .dg {
        padding: 6px 10px 0px 0px;
        position: relative;
        min-height: 32px;

        &__goal {
            @include flex(flex-start);
            margin-bottom: 14px;

            &--checked &-checkbox {
                background-color: var(--elemColor1) !important;
            }
            &--checked &-checkbox i {
                display: block;
            }
        }
        &__goal-checkbox {
            @include square(14px);
            @include center;
            color: var(--elemTextColor);
            background-color: rgba(var(--textColor1), 0.065);
            transition: 0.1s ease-in-out;
            margin: 2px 12px 0px 0px;

            i {
                display: none;
                font-size: 0.9rem;
            }
            &:hover {
                background: rgba(var(--textColor1), 0.125);
            }
        }
        &__goal-name {
            @include text-style(0.95, var(--fw-400-500), 1.25rem);
            max-width: 200px;
            @include elipses-overflow;

            &:hover {
                text-decoration: underline;
            }
        }
    }
</style>