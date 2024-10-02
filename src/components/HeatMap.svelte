<script lang="ts">
    import { onMount } from "svelte"
    import { getElemById, getHozDistanceBetweenTwoElems, randomArrayElem } from "$lib/utils-general"
    import { addToDate, formatDateToSimpleIso, getMonthStr, getPrevMonth, isDateEarlier, isSameDay, months } from "$lib/utils-date"


    const data: {
        idx: number, activity: number, text?: string
    }[] = [
        { idx: 2, activity: 0 },  
        { idx: 17, activity: 0 }, 
        { idx: 21, activity: 0.4 }, 
        { idx: 45, activity: 0.9  }, 
        { idx: 11, activity: 0.3 },
        { idx: 44, activity: 1.0 },
        { idx: 181, activity: 0 },
        { idx: 56, activity: 0.5 },
        { idx: 243, activity: 0.2 },
        // { idx: 243, activity: 0.2, text: "💪" },
        // { idx: 243, activity: 0.2, text: "📖" },
        // { idx: 243, activity: 0.2, text: "🏃‍♂️" },
        // { idx: 243, activity: 0.2, text: "👨‍💻" },
        { idx: 273, activity: 0 },
        { idx: 304, activity: 0 },
        { idx: 334, activity: 0 }
    ]
    const lastTwelveMonths: Date[] = getMonths()
    const firstDay = nextClosestSaturday()

    let container: HTMLElement
    let firstMonthLeftOffset = -1

    function getOpacity(val: number) {
        if (val >= 0.8) return 0.85
        if (val >= 0.4) return 0.2
        if (val >= 0.1) return 0.1
        return 0
    }
    function getMonths() {
        const months = []
        let currMonth = new Date()
        for (let i = 0; i < 11; i++) {
            currMonth = getPrevMonth(new Date(currMonth))
            months.push(currMonth)
        }
        return months
    }
    function getRenderData(idx: number) {
        const currDay  = addToDate({ date: firstDay, time: `${idx === 0 ? idx : -idx}d` })
        
        const isAhead = isDateEarlier(new Date(), currDay)
        const dayData = randomArrayElem(data)
        const opacity  = getOpacity(dayData.activity)
        
        if (isAhead) {
            return { 
                show: false, opacity: 0, day: currDay
            }
        }
        return {
            opacity,
            show: true,
            text: dayData.text,
            day: currDay
        }
    }
    function nextClosestSaturday() {
        const date = new Date()
        const dayOfWeek = date.getDay()
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
        const nextSaturday = new Date(date)
        nextSaturday.setDate(date.getDate() + daysUntilSaturday)

        return nextSaturday;
    }
    function initMonthNames() {
        const monthNames = document.getElementsByClassName("heat-map__month") as unknown as HTMLElement[]
        
        for (let i = 0; i < lastTwelveMonths.length; i++) {
            const firstDay = lastTwelveMonths[i]
            const monthNameRef = monthNames[i]
            const matchingCell = getElemById(`cell--${formatDateToSimpleIso(firstDay)}`)
            const distFromLeft = getHozDistanceBetweenTwoElems({
                left: {
                    elem: container,
                    edge: "left"
                },
                right: {
                    elem: matchingCell!,
                    edge: "left"
                },
            })
            monthNameRef.style.left = `${distFromLeft}px`
            if (i === 0) {
                firstMonthLeftOffset = distFromLeft
            }
        }
    }

    onMount(() => {
        initMonthNames();
    })
</script>

<div bind:this={container} class="heat-map">
    <div class="heat-map__months">
        {#if firstMonthLeftOffset > 30}
            <div class="heat-map__month">
                {getMonthStr(new Date)}
            </div>
        {/if}
        {#each lastTwelveMonths as date}
            <div class="heat-map__month">
                {getMonthStr(date)}
            </div>
        {/each}
    </div>
    <div class="flx">
        {#each Array(52) as _, colIdx}
            <div class="heat-map__week-col">
                {#each Array(7) as _, cellIdx}
                    {@const dayIdx = (colIdx * 7) + cellIdx}
                    {@const { show, opacity, day, text } = getRenderData(dayIdx)}
                    <div
                        id={`cell--${formatDateToSimpleIso(day)}`}
                        class="heat-map__cell"
                        class:heat-map__cell--ahead={!show}
                        class:heat-map__cell--today={isSameDay(new Date, day)}
                        style:--color={`rgba(var(--fgColor1), ${opacity})`}
                    >
                        {#if text}
                            {text}
                        {/if}
                    </div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
  .heat-map {
      position: relative;

    &__months {
        display: flex;
        height: 27px;
    }
    &__month {
        @include text-style(0.25, 400, 1.1rem, "DM Mono");
        margin-bottom: 12px;
        position: absolute;
        top: 0px;
    }
    &__week-col {
        display: flex;
        flex-direction: column-reverse;
        margin-right: 2px;
    }
    &__cell {
        width: 13px;
        height: 13px;
        border-radius: 5px;
        background-color: rgba(var(--fgColor1), 0.0285);
        position: relative;
        margin-bottom: 2px;
        font-size: 0.6rem;
        @include center;

        &--ahead {
            opacity: 1;
            background-color: rgba(var(--fgColor1), 0.01);
        }
        &--today {
            @include shadow-border(rgba(#0C8CE9, 1), 2px);
        }
        &--today::before {
            border-radius: 6px !important;
        }
        &::before {
            content: " ";
            width: 100%;
            height: 100%;
            @include abs-top-left;
            border-radius: 5px;
            background-color: var(--color);
            z-index: -1;
        }
    }
  }
</style>