<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { globalContext, ytPlayerStore, timer } from "../../../lib/store"
	import { hasAmbienceSpace, setAmbience } from "../../../lib/utils-home"
	import { formatTimeToHHMM, prefer12HourFormat } from "../../../lib/utils-date"

    $: ambience = $globalContext.ambience
    $: rightBarOpen = $globalContext.rightBarOpen
    $: showTime = ambience?.showTime
    $: clockFont = ambience?.clockFont ?? "DM Sans"

    const TOP_PADDING = 40
    const NUM_SPACING = TOP_PADDING + 10
    const NUM_CHANGE_TIME = 2000
    const FONT_OPTIONS = {
        "DM Sans":        { size: "19rem", topOffset: "-50px" },
        "Zodiak-Bold":    { size: "19rem", topOffset: "-55px" },
        "Melodrama-Bold": { size: "25rem", topOffset: "-75px" },
        "Bagel Fat One":  { size: "22rem", topOffset: "-85px" },
    }

    let doUse12HourFormat = prefer12HourFormat()
    let currentTimeStr = ""
    let currentTimePeriod = ""
    let init = false
    let lineHeight = 0

    let digits: string[] = ["0", "0", ":", "0", "0"]
    let digitRefs: HTMLElement[] = []

    timer.subscribe(({ date }) => {
        if (init) {
            updateTimeStr(date)
        }
    }) 

    function updateTimeStr(date: Date) {
        const timeStr = formatTimeToHHMM(date, doUse12HourFormat)

        if (doUse12HourFormat) {
            const [time, period] = timeStr.split(" ")
            currentTimeStr = time
            currentTimePeriod = period
        } 
        else {
            currentTimeStr = timeStr
            currentTimePeriod = ""
        }

        const [hh, mm] = currentTimeStr.split(":")
        const newDigits = [
            hh.length === 1 ? "X" : hh[0],
            hh.length === 1 ? hh[0] : hh[1],
            ":",
            mm[0], 
            mm[1]
        ]

        updateDigitElements(newDigits)
        init = true
    }
    function updateDigitElements(newDigits: string[]) {
        const yOffset = NUM_SPACING + lineHeight

        digitRefs.forEach((element, index) => {
            const digit = digits[index]
            const newDigit = newDigits[index]
            const diff = newDigit !== digit

            if (!diff && init) return
            
            const digitNumElem = element as HTMLElement
            const digitElem = digitNumElem.parentElement
            const span      = digitNumElem.querySelector('span') as HTMLSpanElement

            if (newDigit === "X") {
                span.style.display = 'none'
            } 
            else if (newDigit != ":") {
                span.style.display = 'block'
                span.textContent = init ? digit : newDigit

                if (init) {
                    const newDigitElem = makeNewDigitElem(newDigit)
                    digitElem.appendChild(newDigitElem)

                    digitElem.style.transform = `translateY(-${yOffset}px)`
                    digitElem.style.transition = `transform ${NUM_CHANGE_TIME}ms ease-in-out`
                    
                    setTimeout(() => {
                        digitElem.style.transform = `translateY(0px)`
                        digitElem.style.transition = 'transform 0s ease-in-out'

                        digitRefs[index] = newDigitElem
                        newDigitElem.style.marginBottom = `${NUM_SPACING}px`
                        digitNumElem.remove()

                    }, NUM_CHANGE_TIME)
                }
            }

            digits[index] = newDigit
        })
    }
    function makeNewDigitElem(newDigit: string) {
        return Object.assign(document.createElement('div'), {
                className: 'space__digit-num',
                innerHTML: `<span>${newDigit}</span>`
        })
    }
    onMount(() => {
        if (!hasAmbienceSpace()) {
            setAmbience()
        }

        requestAnimationFrame(() => updateTimeStr(new Date()))
        $ytPlayerStore?.togglePlayback(true)
    })

    onDestroy(() => {
        $ytPlayerStore?.togglePlayback(false)
    })
</script>
<div 
    class="space"
    class:space--right-bar-open={rightBarOpen}
    style:--line-height={`${lineHeight}px`}
    style:--top-padding={`${TOP_PADDING}px`}
    style:--num-spacing={`${NUM_SPACING}px`}
    style:font-family={clockFont}
    style:font-size={FONT_OPTIONS[clockFont]?.size}
>
    <div 
        class="space__time-wrapper"
        class:hidden={!showTime}
    >
        <div class="space__time">
            <div 
                class="space__time-numbers"
                style:margin-top={FONT_OPTIONS[clockFont]?.topOffset}
            >
                <div class="space__digit">
                    <div 
                        bind:this={digitRefs[0]} 
                        class="space__digit-num"
                    >
                        <span>0</span>
                    </div>
                </div>
                <div class="space__digit">
                    <div 
                        bind:this={digitRefs[1]} 
                        class="space__digit-num"
                    >
                        <span>0</span>
                    </div>
                </div>
                <div class="space__digit">
                    <div 
                        bind:this={digitRefs[2]} 
                        bind:clientHeight={lineHeight}
                        class="space__digit-num"
                    >
                        <span>:</span>
                    </div>
                </div>
                <div class="space__digit">
                    <div 
                        bind:this={digitRefs[3]} 
                        class="space__digit-num"
                    >
                        <span>0</span>
                    </div>
                </div>
                <div class="space__digit">
                    <div 
                        bind:this={digitRefs[4]} 
                        class="space__digit-num"
                    >
                        <span>0</span>
                    </div>
                </div>
            </div>
            {#if currentTimePeriod}
                <span class="space__time-period">
                    {currentTimePeriod}
                </span>
            {/if}
        </div>
    </div>
</div>

<style global lang="scss">
    .space {
        position: fixed;
        height: 100vh;
        width: 100vw;
        @include flex(flex-start, center);
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &--right-bar-open {
            width: calc(100vw - 160px);
        }
        &--hidden {
            @include not-visible;
        }
        &__time-wrapper {
            @include text-style(1, 500);
            margin-top: 20vh;
            position: relative;
            overflow: hidden;
            // mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
            // -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
            
            padding: var(--top-padding) 0px;
            height: calc(var(--line-height) + calc(var(--top-padding) * 2));
        }
        &__time {
            display: flex;
            margin-right: 14px;
        }
        &__time-numbers {
            display: flex;
            margin-right: 12px;
        }
        &__time-period {
            font-size: 3rem;
            font-weight: 300;
            margin-top: -5px;
            letter-spacing: 2px;
        }
        &__digit {
            @include flex(center);
            flex-direction: column;
        }
        &__digit-num {
            display: block;
            letter-spacing: 1px;
            margin-bottom: var(--num-spacing);

            span {
                display: block;
            }
        }
    }
</style>