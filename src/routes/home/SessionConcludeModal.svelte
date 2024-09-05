<script lang="ts">
    import { ModalType } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { sessionManager } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { randomArrayElem } from "$lib/utils-general"
	import { resultImg, resultText } from "$lib/data-session"
	import { updateTotalFocusTime } from "$lib/utils-session"
	import { formatDatetoStr, getTimePeriodString, secsToHHMM } from "$lib/utils-date"

	import Modal from "../../components/Modal.svelte"
	import AsyncButton from "../../components/AsyncButton.svelte"
	import ConfirmationModal from "../../components/ConfirmationModal.svelte"

    export let session: Session
    let confirmModalOpen = false
    let isSaving = false

    const MIN_GOOD_SCORE = 60

    const result  = session.result
    const { endTime, totalFocusTime, totalBreakTime, elapsedSecs } = result!
    const timePeriod = getTimePeriodString(session.startTime, endTime)
    const totalTime = secsToHHMM(elapsedSecs)
    const activeTime = secsToHHMM(totalFocusTime)
    const inactiveTime = secsToHHMM(totalBreakTime)
    
    const activePerc = Math.floor(100 * (totalFocusTime / elapsedSecs))
    const inActivePerc = Math.floor(100 * (totalBreakTime / elapsedSecs))
    const key = activePerc >= MIN_GOOD_SCORE ? "good" : "bad"
    const txt = randomArrayElem(resultText[key])
    const img = randomArrayElem(resultImg[key])

    const isReview = $sessionManager === null
    const divWidth = isReview ? 305 : 360

    const emojis = ["👏", "🎉", "💪", "🙌", "💪", "🤧"]

    async function saveData() {
        $sessionManager!.quit()
        closeModal(ModalType.SessionSummary)

        updateTotalFocusTime(session.result!.totalFocusTime)
    }
    function dontSave() {
        $sessionManager!.quit()
        closeModal(ModalType.SessionSummary)

        toast("info", {
            message: "Session not counted."
        })
    }
    function onClickOutside() {
        if (isReview) {
            closeModal(ModalType.SessionSummary)
        }
    }
</script>

<Modal 
    options={{ borderRadius: "24px" }}
    onClickOutSide={onClickOutside}
>
    <div 
        class="conclude"
        class:conclude--review={isReview}
    >
        {#if !isReview}
            <div class="conclude__gif">
                <img src={img} alt="result-img">
            </div>
            <div class="conclude__header">
                <h1>Session Finished {randomArrayElem(emojis)}</h1>
                <p>{txt}</p>
            </div>
        {:else}
            <div class="conclude__review-header">
                <div class="conclude__name">
                    {session.name}
                </div>
                <div class="conclude__total-time">
                    {totalTime}
                </div>
                <span>
                    Total Time
                </span>
            </div>
        {/if}

        <div class="conclude__stats">
            {#if isReview}
                <div class="conclude__stat">
                    <span>Mode</span>
                    <div class="conclude__metric">
                        {session.mode === "flow" ? "Flow" : "Pomodoro"}
                    </div>
                </div>
                <div class="divider">
                    <svg xmlns="http://www.w3.org/2000/svg" width={divWidth} height="2" viewBox={`0 0 ${divWidth} 2`} fill="none">
                        <path d={`M0 1H ${divWidth}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                    </svg>
                </div>
                <div class="conclude__stat">
                    <span>Date</span>
                    <div class="conclude__metric">
                        {formatDatetoStr(session.startTime)}
                    </div>
                </div>
                <div class="divider">
                    <svg xmlns="http://www.w3.org/2000/svg" width={divWidth} height="2" viewBox={`0 0 ${divWidth} 2`} fill="none">
                        <path d={`M0 1H ${divWidth}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                    </svg>
                </div>
            {/if}
            <div class="conclude__stat">
                <span>Period</span>
                <div class="conclude__metric">
                    {timePeriod}
                </div>
            </div>
            <div class="divider">
                <svg xmlns="http://www.w3.org/2000/svg" width={divWidth} height="2" viewBox={`0 0 ${divWidth} 2`} fill="none">
                    <path d={`M0 1H ${divWidth}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                </svg>
            </div>
            {#if !isReview}
                <div class="conclude__stat">
                    <span>Duration</span>
                    <div class="conclude__metric">
                        {totalTime}
                    </div>
                </div>
                <div class="divider">
                    <svg xmlns="http://www.w3.org/2000/svg" width={divWidth} height="2" viewBox={`0 0 ${divWidth} 2`} fill="none">
                        <path d={`M0 1H ${divWidth}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                    </svg>
                </div>
            {/if}
            <div class="conclude__stat">
                <span>Focus Time</span>
                <div 
                    class="conclude__metric"
                    class:conclude__metric--focus-color={true}
                >
                    <span>+{activeTime}</span>
                    <span>
                        {activePerc}%
                    </span>
                </div>
            </div>
            <div class="divider">
                <svg xmlns="http://www.w3.org/2000/svg" width={divWidth} height="2" viewBox={`0 0 ${divWidth} 2`} fill="none">
                    <path d={`M0 1H ${divWidth}`} stroke-width="0.7" stroke-dasharray="3 3"/>
                </svg>
            </div>
            <div class="conclude__stat">
                <span>Break Time</span>
                <div 
                    class="conclude__metric"
                    class:conclude__metric--inactive-color={true}
                >
                    <span>
                        -{inactiveTime}
                    </span>
                    <span>
                        {inActivePerc}%
                    </span>
                </div>
            </div>
        </div>

        {#if !isReview}
            <div class="conclude__btns">
                <button on:click={() => confirmModalOpen = true}>
                    Do Not Save 
                </button>
                <AsyncButton 
                    styling={{ 
                        height: "40px", 
                        width: "calc(100% - 140px)",
                        borderRadius: "8px" 
                    }}
                    isLoading={isSaving}
                    actionFunc={saveData} 
                />
            </div>
        {/if}
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text="Are you sure you don't want to count this session?"
        onCancel={() => confirmModalOpen = false}
        onOk={dontSave}
        options={{ 
            ok: "Yes!", caption: "Heads Up!" 
        }}
    /> 
{/if}


<style lang="scss">
    .conclude {
        width: 400px;
        text-align: center;
        flex-direction: column;
        padding: 12px 8px 19px 8px;
        @include flex(_, center);

        &--review {
            width: 350px;
            padding: 12px 10px 25px 10px;
        }

        img {
            border-radius: 14px;
            height: 200px;
            object-fit: cover;
            width: calc(100% - 8px);
        }

        .divider {
            margin: 4px 0px 4px 0px;
        }
        .divider svg path {
            stroke: rgba(var(--textColor1), 0.08);
        }

        &__header {
            margin: 13px 0px 30px 0px;
            text-align: center;

            h1 {
                @include text-style(1, 500, 1.6rem);
            }
            p {
                @include text-style(0.3, 500, 1.3rem);
                text-align: center;
                margin: 9px auto 0px auto;
                width: 80%;
            }
        }
        &__review-header {
            padding: 6px 0px 25px 0px;
            text-align: center;

            span {
                @include text-style(0.35, 500, 1.45rem);
            }
        }
        &__name {
            @include text-style(0.65, 500, 1.45rem);
        }
        &__total-time {
            @include text-style(1, 400, 5rem, "DM Mono");
            margin: 2px 0px 4px 0px;
        }
        &__stats {
            width: 100%;
            padding: 0px 14px;
        }
        &__stat {
            @include flex(center, space-between);
            @include text-style(0.35, 500, 1.3rem);
        }
        
        &__metric {
            @include text-style(1, 300, 1.3rem, "DM Mono");

            span {
                &:last-child {
                    opacity: 0.5;
                }
            }
        }
        &__metric--focus-color {
            color: #A2FA78;
        }
        &__metric--inactive-color {
            color: #FFB782;
        }

        &__btns {
            margin-top: 40px;
            padding: 0px 14px;
            @include flex(center);

            button {
                height: 40px;
                width: 140px;
                border-radius: 8px;
                margin-right: 6px;
                @include center;
                @include txt-color(0.03, "bg");
                @include text-style(0.5, 500, 1.22rem);


                &:hover {
                    @include txt-color(0.04, "bg");
                }
            }
        }
    }
</style>