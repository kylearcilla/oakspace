<script lang="ts">
    import { onMount } from 'svelte'
	import { themeState } from "$lib/store"
	import EmptyList from './EmptyList.svelte'
    import { formatTimeToHHMM } from "$lib/utils-date"
    
    export let sessions: Session[] = []

    $: light = !$themeState.isDarkTheme

    let sessionHeights: string[] = []
    let minWidth = 0

    function getDuration(start: Date, end: Date): string {
        const durationMins = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
        const hours = Math.floor(durationMins / 60)
        const mins = durationMins % 60
        
        if (hours === 0) return `${mins}m`
        return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
    }
    function getSessionData(session: Session) {
        const { startTime, result } = session
        const endTime = result!.endTime!

        const duration = getDuration(startTime, endTime)
        const start = formatTimeToHHMM(startTime)
        const end = formatTimeToHHMM(endTime)

        return { duration, start, end }
    }

    onMount(() => {
        sessionHeights = sessions.map((_, i) => {
            const elem = document.getElementById(`ds-${i}`)!

            return `${elem.clientHeight + 20}px`
        })
    })
</script>

<div class="ds" class:ds--light={light}>
    {#each sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()) as session, i}
        {@const { duration, start } = getSessionData(session)}
        {@const isLast = i === sessions.length - 1}
        
        <div class="ds__session">
            <div 
                class="ds__time"
                bind:clientWidth={minWidth}
                style:min-width={`${minWidth}px`}
            >
                {start}
            </div>
            <div class="ds__content">
                <div id={`ds-${i}`}>
                    <div 
                        title={session.name}
                        class="ds__title"
                    >
                        {session.name}
                    </div>
                    <span>{duration}</span>
                </div>
                <div 
                    class="ds__timeline" 
                    style:height={sessionHeights[i]}
                >
                    <div class="ds__timeline-dot"></div>
                    {#if !isLast}
                        <div class="ds__timeline-line">
                            <svg style:height={sessionHeights[i]}>
                                <line x1="50%" y1="0" x2="50%" y2="100%"></line>
                            </svg>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <EmptyList 
            emptyText="No Sessions"
        />
    {/each}
</div>

<style lang="scss">
    .ds {
        padding: 6px 0px 12px 0px;
        --dot-opacity: 0.2;

        &--light {
            --dot-opacity: 0.3;
        }
        &--light &__time {
            @include text-style(0.4);
        }
        &--light &__content span {
            @include text-style(0.4);
        }
        
        &__session {
            @include flex(flex-start);

            &:not(:last-child) {
                margin-bottom: 25px;
            }
        }
        &__time {
            @include text-style(0.2, var(--fw-400-500), 1.15rem);
            margin-right: 15px;
            white-space: nowrap;
        }
        &__timeline {
            @include abs-top-left;
            margin-top: 5px;
            display: flex;
            align-items: center;
            flex-direction: column;
        }
        &__timeline-dot {
            @include circle(5px);
            background-color: rgba(var(--textColor1), var(--dot-opacity));
        }
        &__timeline-line {
            svg {
                width: 2px;
            }
            line {
                stroke: rgba(var(--textColor1), var(--dot-opacity));
                stroke-width: 1;
                stroke-dasharray: 2, 3;
            }
        }
        &__content {
            padding: 0px 5px 0px 16px;
            position: relative;
            min-width: 0px;
            span {
                @include text-style(0.3, var(--fw-400-500), 1.15rem);
            }
        }
        &__title {
            @include text-style(0.9, var(--fw-400-500), 1.25rem);
            @include truncate-lines(3);
            margin-bottom: 8px;
            max-width: 110px;
        }
    }
</style>