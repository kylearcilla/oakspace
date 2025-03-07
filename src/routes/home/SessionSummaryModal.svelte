<script lang="ts">
	import { sessionManager, themeState } from "$lib/store"
    
    import { ModalType } from "$lib/enums"
	import { toast } from "$lib/utils-toast"
	import { closeModal } from "$lib/utils-home"
	import { randomArrayElem } from "$lib/utils-general"
	import { resultImg, resultText, incrementFocusTime } from "$lib/utils-session"
	import { formatDatetoStr, getTimePeriodString, secsToHHMM } from "$lib/utils-date"

	import Modal from "$components/Modal.svelte"
	import ConfirmBtns from "$components/ConfirmBtns.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    export let onClickOutside: (() => void) | undefined = undefined
    export let session: Session
    export let isReview = false

    $: light = !$themeState.isDarkTheme

    let confirmModalOpen = false
    let saving = false

    const MIN_GOOD_SCORE = 60
    const EMOJIS = ["👏", "🎉", "💪", "🙌", "💪", "🤧"]

    const result  = session.result
    const { endTime, totalFocusTime, totalBreakTime, elapsedSecs } = result!
    const timePeriod = getTimePeriodString(session.startTime, endTime)
    const totalTime = secsToHHMM(elapsedSecs)
    const activeTime = secsToHHMM(totalFocusTime)
    const inactiveTime = secsToHHMM(totalBreakTime)
    
    const activePerc = Math.round(100 * (totalFocusTime / elapsedSecs))
    const inActivePerc = 100 - activePerc
    const key = activePerc >= MIN_GOOD_SCORE ? "good" : "bad"
    const txt = randomArrayElem(resultText[key])
    const img = randomArrayElem(resultImg[key])

    async function saveData() {
        $sessionManager!.quit()
        
        closeModal(ModalType.SessionSummary)
        incrementFocusTime(session.result!.totalFocusTime)
    }
    function dontSave() {
        $sessionManager!.quit()
        closeModal(ModalType.SessionSummary)

        toast("info", {
            message: "Session not counted."
        })
    }
    function _onClickOutside() {
        if (onClickOutside) {
            onClickOutside()
        }
    }
</script>

<Modal 
    options={{ borderRadius: "24px", scaleUp: true }}
    onClickOutSide={_onClickOutside}
>
    <div 
        class="conclude"
        class:conclude--review={isReview}
        class:conclude--light={light}
    >
        {#if !isReview}
            <div class="conclude__gif">
                <img src={img} alt="result-img">
            </div>
            <div class="conclude__header">
                <h1>Session Finished {randomArrayElem(EMOJIS)}</h1>
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
                <div class="conclude__stat">
                    <span>Date</span>
                    <div class="conclude__metric">
                        {formatDatetoStr(session.startTime)}
                    </div>
                </div>

            {/if}
            <div class="conclude__stat">
                <span>Period</span>
                <div class="conclude__metric">
                    {timePeriod}
                </div>
            </div>

            {#if !isReview}
                <div class="conclude__stat" style:margin-bottom="12px">
                    <span>Duration</span>
                    <div class="conclude__metric">
                        {totalTime}
                    </div>
                </div>
            {/if}
            <div class="conclude__stat"  style:margin-bottom="13px">
                <span>Focus Time</span>
                <div 
                    class="conclude__metric"
                    class:conclude__metric--focus-color={true}
                >
                    <span>+{activeTime}</span>
                    <span style:margin-left="6px">
                        {activePerc}%
                    </span>
                </div>
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
                    <span style:margin-left="6px">
                        {inActivePerc}%
                    </span>
                </div>
            </div>
        </div>

        <div style:padding="25px 10px 2px 10px">
            <ConfirmBtns 
                isLoading={saving}
                onCancel={dontSave}
                onOk={saveData}
            />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text="Are you sure you don't want to count this session?"
        onOk={dontSave}
        onCancel={() => confirmModalOpen = false}
    /> 
{/if}

<style lang="scss">
    .conclude {
        width: 400px;
        text-align: center;
        flex-direction: column;
        padding: 13px 8px 15px 8px;
        @include flex(_, center);

        --green-color: #92c369;
        --red-color: #c88580;

        &--review {
            width: 350px;
            padding: 16px 10px 24px 10px;
        }
         &--light {
             --green-color: #879879;
             --red-color: #dd8176;
         }
         &--light &__stat {
            @include text-style(0.7);
        }

        img {
            border-radius: 14px;
            height: 200px;
            object-fit: cover;
            width: calc(100% - 8px);
        }
        &__header {
            margin: 13px 0px 30px 0px;
            text-align: center;

            h1 {
                @include text-style(1, var(--fw-400-500), 2rem);
            }
            p {
                @include text-style(0.35, var(--fw-400-500), 1.45rem);
                text-align: center;
                margin: 9px auto 0px auto;
                width: 80%;
            }
        }
        &__review-header {
            padding: 6px 0px 30px 0px;
            text-align: center;

            span {
                @include text-style(0.35, var(--fw-400-500), 1.45rem);
            }
        }
        &__name {
            @include text-style(0.65, var(--fw-400-500), 1.6rem);
        }
        &__total-time {
            @include text-style(1, 400, 4.5rem);
            margin: 4px 0px 7px 0px;
        }
        &__stats {
            width: 100%;
            padding: 0px 14px;
        }
        &__stat {
            @include flex(center, space-between);
            @include text-style(0.35, var(--fw-400-500), 1.5rem);
            margin-bottom: 11px;
        }
        &__metric {
            @include text-style(1, var(--fw-400-500), 1.45rem);

            span:last-child {
                opacity: 0.5;
            }
        }
        &__metric--focus-color {
            color: var(--green-color);
        }
        &__metric--inactive-color {
            color: var(--red-color);
        }
    }
</style>