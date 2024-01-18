<script lang="ts">
	import { closeModal } from "$lib/utils-home"
	import { getPomPeriodElapsedTime } from "$lib/utils-date"
	import { HrsMinsFormatOption, ModalType } from "$lib/enums"
	import { getTimePeriodString, secsToHHMM } from "$lib/utils-date"
    import { sessionManager, sessionStore, themeState } from "$lib/store"
    
	import Modal from "../../components/Modal.svelte"

    let isInStatsPage = true
    let elapsedTimeStr = ""

    $: {
        elapsedTimeStr = getPomPeriodElapsedTime(new Date($sessionStore!.startTime), new Date($sessionStore!.endTime!))
    }

    function exitModal() {
        $sessionStore!.clearSession()
        sessionManager.set(null)
        closeModal(ModalType.SesssionFinished)
    }
    function sessionFinishedBtnClicked() { 
        isInStatsPage = !isInStatsPage
    }
    function todayStatsFinishedBtnClicked() {
         exitModal()
    }
    function keyboardShortcutHandler(event: KeyboardEvent) {
        if (event.key != "Enter") return
        isInStatsPage ? sessionFinishedBtnClicked() : todayStatsFinishedBtnClicked()
    }
</script>

<svelte:window on:keyup={(event) => keyboardShortcutHandler(event)} />

{#if $sessionStore}
    <Modal options={{ borderRadius: "25px;", overflowY: "hidden" }} onClickOutSide={() => {}}>
        <div class={`session-finished ${$themeState.isDarkTheme ? "" : "session-finished--light"} ${!isInStatsPage ? "session-finished--second-page" : ""}`}>
            <div class="session-finished__page-container">
                <!-- First -->
                <div class={`session-finished__results ${!isInStatsPage ? "session-finished__results--hidden" : ""}`}>
                    <div class="session-finished__img-container">
                        <img src={$sessionStore?.sessionResult?.resultImgUrl} alt="session-result">
                    </div>
                    <div class="session-finished__text">
                        <h2 class="session-finished__text-title">
                            Session Finished 👏
                        </h2>
                        <p class="session-finished__text-message">
                            {$sessionStore?.sessionResult?.message}
                        </p>
                    </div>
                    <div class="session-finished__results-container">
                        <div class="session-finished__result">
                            <div class="session-finished__result-title">Calculated Time</div>
                            <div class="session-finished__result-time">
                                {$sessionStore?.timePeriodString}
                            </div>
                            <div class="session-finished__result-elapsed">
                                {$sessionStore?.totalElapsedTime}
                            </div>
                        </div>
                        <div class="session-finished__result">
                            <div class="session-finished__result-title">Your Time</div>
                            <div class="session-finished__result-time">
                                {#if $sessionStore.endTime}
                                    {getTimePeriodString(new Date($sessionStore.startTime), new Date($sessionStore.endTime))}
                                {/if}
                            </div>
                            <div class="session-finished__result-elapsed">
                                {elapsedTimeStr}
                            </div>
                        </div>
                    </div>
                    <div class="session-finished__score">
                        <span>Score:</span> {`${$sessionStore?.sessionResult?.medal} ${$sessionStore?.sessionResult?.score}`}
                    </div>
                    <div class="session-finished__btn-container">
                        <button class="session-finished__ok-btn" on:click={sessionFinishedBtnClicked}>
                            OK
                        </button>
                    </div>
                </div>
                <!-- Second -->
                <div class={`session-finished__stats ${!isInStatsPage ? "session-finished__stats--shown" : ""}`}>
                    {#if !isInStatsPage}
                        <div class="session-finished__stats-title">
                            <h2 class="session-finished__text-title">
                                Today's Stats
                            </h2>
                        </div>
                        <div class="session-finished__stats-container">
                            <div class="session-finished__stat">
                                <div class="session-finished__stat-icon">
                                    <i class="fa-solid fa-hourglass-half"></i>
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--change">
                                    + 1 
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--total">
                                    3
                                </div>
                            </div>
                            <div class="session-finished__stat">
                                <div class="session-finished__stat-icon">
                                    <i class="fa-brands fa-readme"></i>
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--change">
                                    {`+ ${secsToHHMM($sessionStore.userFocusTimeSecs, HrsMinsFormatOption.MIN_LETTERS)}`}
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--total">
                                    2h 34m
                                </div>
                            </div>
                            <div class="session-finished__stat">
                                <div class="session-finished__stat-icon">
                                    <i class="fa-solid fa-seedling"></i>
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--change">
                                    {`+ ${secsToHHMM($sessionStore.userBreakTimeSecs, HrsMinsFormatOption.MIN_LETTERS)}`}
                                </div>
                                <div class="session-finished__stat-text session-finished__stat-text--total">
                                    32m
                                </div>
                            </div>
                        </div>
                        <div class="session-finished__stats-btn-container">
                            <button class="session-finished__ok-btn" on:click={todayStatsFinishedBtnClicked}>
                                Done
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </Modal>
{/if}

<style lang="scss">
    $stats-height: 250px;
    $stats-width: 250px;

    .session-finished {
        width: 450px;
        max-height: 600px;
        transition: max-height 0.5s, width 0.5s;
        position: relative;

        &--light &__text {
            &-title {
                color: rgba(var(--textColor1), 0.85);
            }
            &-message {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.4);
            }
        }
        &--light &__result {
            &-title {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 600;
            }
            &-time {
                color: rgba(var(--textColor1), 0.5);
                font-weight: 500;
            }
            &-elapsed {
                color: rgba(var(--textColor1), 0.25);
                font-weight: 400;
            }
        }
        &--light &__score {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.85);
            span {
                color: rgba(var(--textColor1), 0.65);
                font-weight: 500;
            }
        }
        &--light &__stats h2 {
            font-weight: 600;
        }
        &--light &__stat {
            &-icon {
                color: rgba(var(--textColor1), 0.70);
            }
            &-text {
                &--change {
                    color: rgba(var(--textColor1), 0.4);
                }
                &--total {
                    color: rgba(var(--textColor1), 0.5);
                }
                font-weight: 500;
            }
        }

        &--second-page {
            width: $stats-width;
            max-height: $stats-height;
            animation: page-transition 0.5s ease-in-out forwards;
        }
        
        &__page-container {
            display: flex;
            width: 750px;
        }
        &__results {
            padding: 14px 15px 25px 15px;
            width: 450px;
        }

        /* Results */
        &__img-container {
            margin-bottom: 25px;
            object-fit: cover;
            width: 100%;
            @include flex-container(center, center);

            img {
                object-fit: cover;
                border-radius: 18px;
                width: 100%;
                max-height: 190px;
            }
        }
        &__text {
            text-align: center;
        }
        &__text-title {
            font-size: 1.8rem;
            margin-bottom: 10px;
            font-weight: 500;
        }
        &__text-message {
            font-size: 1.4rem;
            width: 80%;
            margin: 0px auto 20px auto;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.3);
        }
        &__results-container {
            margin-top: 35px;
            width: 100%;
            @include flex-container(center, center);
            flex-direction: column;
        }
        &__result {
            width: 95%;
            display: flex;
            font-size: 1.35rem;
            margin-bottom: 3px;
            font-size: 1.5rem;
        }
        &__result-title {
            width: 30%;
            text-align: left;
            margin-left: 5px;
            white-space: nowrap;
        }
        &__result-time {
            width: 55%;
            white-space: nowrap;
            color: rgba(var(--textColor1), 0.55);
            font-weight: 300;
            text-align: center;
        }
        &__result-elapsed {
            text-align: left;
            width: 15%;
            margin-right: -5px;
            white-space: nowrap;
            color: rgba(var(--textColor1), 0.3);
            font-weight: 300;
        }
        &__score {
            margin-top: 30px;
            text-align: center;
            font-size: 1.7rem;
            color: rgba(var(--textColor1), 0.7);

            span {
                color: rgba(var(--textColor1), 1);
                margin-right: 8px;
            }
        }
        &__btn-container {
            width: 100%;
            // @include pos-abs-bottom-left-corner(0px, 50px);
            @include flex-container(center, center);

            button {
                font-size: 1.3rem;
            }
        }
        &__ok-btn {
            margin-top: 40px;
            width: 65%;
            height: 42px;
            background-color: rgba(var(--fgColor1));
            color: var(--modalBgColor);
            border-radius: 7px;
            font-size: 1.1rem;
            transition: 0.12s ease-in-out;
            text-align: center;

            &:hover {
                filter: brightness(1.05);
            }
            &:focus {
                filter: brightness(1.09);
            }
            &:active {
                filter: brightness(1.05);
            }
        }

        /* Today's Stats */
        &__stats {
            height: $stats-height;
            width: $stats-width;
            padding: 25px 15px 20px 25px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;

            &-title h2 {
                font-weight: 500;
                font-size: 1.75rem;
            }
            &-container {
                margin-top: -16px;
                width: 100%;
                @include flex-container(center, space-around);
            }
        }
        &__stat {
            text-align: center;
            width: 70px;

            &-icon {
                opacity: 0;
                visibility: hidden;
                margin-bottom: 15px;
                animation: slide-up-icon 0.4s cubic-bezier(.13,1,.5,.94) 0.4s forwards;

                i {
                    font-size: 2.2rem;
                }
            }
            &-text {
                font-size: 1.7rem;
                font-weight: 300;
                opacity: 0;
                visibility: hidden;
                overflow: hidden;
                
                &--change {
                    font-size: 1.55rem;
                    color: rgba(var(--textColor1), 0.45);
                    animation: slide-up-change 1.2s cubic-bezier(.13, 1, .5, .94) 0.8s forwards;
                }
                
                &--total {
                    color: rgba(var(--textColor1), 0.7);
                    animation: slide-up-total 0.7s cubic-bezier(.13, 1, .5, .94) 2.3s forwards;
                }
            }
        }
        &__stats-btn-container {
            width: 80%;
            @include flex-container(center, center);

            button {
                margin-top: -20px;
                border-radius: 15px;
                width: 100%;
                font-size: 1.3rem;
                height: 44px;

            }
        }
    }

    @keyframes page-transition {
        0% {
            transform: translateX(0px);
        }
        100% {
            transform: translateX(-450px);
        }
    }
    @keyframes slide-up-icon {
        0% {
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            visibility: visible;
            transform: translateY(0px);
        }
    }
    @keyframes slide-up-change {
        0% {
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
        }
        30%, 80% {
            opacity: 1;
            visibility: visible;
            transform: translateY(0px);
        }
        100% {
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
        }
    }
    @keyframes slide-up-total {
        0% {
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            visibility: visible;
            transform: translateY(-20px);
        }
    }
</style>