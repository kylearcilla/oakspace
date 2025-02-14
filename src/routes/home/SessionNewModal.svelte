<script lang="ts">
	import { onMount } from "svelte"

	import { ModalType } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { SessionManager } from "$lib/session-manager"
    
	import Modal from "../../components/Modal.svelte"
	import AsyncButton from "../../components/AsyncButton.svelte"

    let isSaving = false
    let titleInput: HTMLElement

    let title = ""
    let tasks: Task[] = []
    let mode: SessionMode = "pom"
    let focusTime = 25
    let breakTime = 5
    let allowSfx = true
    let allowChime = true

    async function initSession() {
        const startTime = new Date()
        startTime.setSeconds(startTime.getSeconds() - 1)

        new SessionManager({
            id: "",
            name: title ?? "untitled",
            mode,
            focusTime: focusTime * 60,
            breakTime: breakTime * 60,
            startTime,
            allowChime,
            allowSfx,
            todos: []
        })

        onAttemptClose()
    }
    function onAttemptClose() {
        closeModal(ModalType.NewSession)
    }

    onMount(() => titleInput.focus())
</script>

<Modal 
    options={{ borderRadius: "20px", overflow: "visible" }} 
    onClickOutSide={onAttemptClose}
>
    <div class="new-session">
        <!-- Title -->
        <div class="new-session__title">
            <input 
                bind:this={titleInput}
                bind:value={title} 
                placeholder="new session title"
                type="text" 
            />
        </div>
        
        <!-- Options -->
        <div class="new-session__modes">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div 
                role="button"
                tabindex="0"
                class="new-session__mode"
                class:new-session__mode--selected={mode === "pom"}
                on:click={() => mode = "pom"}
            >
                <div class="new-session__mode-title">
                    Pomodoro
                </div>
                <div class="new-session__mode-description">
                    Fixed sessions with timed breaks in between.
                </div>
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div 
                role="button"
                tabindex="0"
                class="new-session__mode"
                class:new-session__mode--selected={mode === "flow"}
                on:click={() => mode = "flow"}
            >
                <div class="new-session__mode-title">
                    Flow
                </div>
                <div class="new-session__mode-description">
                    Flexible focus sessions. Breaks at any time. 
                </div>
            </div>
        </div>

        <!-- Time Inputs -->
        <div 
            class="new-session__options"
            class:new-session__options--flow={mode === "flow"}
        >
            <div class="new-session__time">
                <span>Focus Time</span>
                <div class="new-session__time-input">
                    <button
                        disabled={mode === "flow"} 
                        on:click={() => focusTime = Math.max(5, focusTime - 5)}
                    >
                        -
                    </button>
                        {focusTime} minutes
                    <button
                        disabled={mode === "flow"}
                        on:click={() => focusTime = Math.min(120, focusTime + 5)}
                    >
                        +
                    </button>
                </div>
            </div>
            <div class="new-session__time">
                <span>Break Time</span>
                <div class="new-session__time-input">
                    <button
                        disabled={mode === "flow"} 
                        on:click={() => breakTime = Math.max(5, breakTime - 5)}
                    >
                        -
                    </button>
                        {breakTime} minutes
                    <button
                        disabled={mode === "flow"}
                        on:click={() => breakTime = Math.min(30, breakTime + 5)}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>

        <!-- Sound Effects -->
         <div class="new-session__sfx">
            <div>
                <div class="new-session__sfx-name">
                    {#if mode === "pom"}
                        Sound Effects
                    {:else}
                        Lengthy Breaks
                    {/if}
                </div>
                <span>
                    {#if mode === "pom"}
                        Soft sounds to mark periods.
                    {:else}
                        Pings during lengthy breaks.
                    {/if}
                </span>
            </div>
            <div class="new-session__sfx-btns">
                <button 
                    class="new-session__sfx-btn"
                    class:new-session__sfx-btn--picked={allowSfx}
                    on:click={() => allowSfx = true}
                >
                    <div class="new-session__sfx-btn-check-box"></div>
                    <span>On</span>
                </button>
                <button 
                    class="new-session__sfx-btn"
                    class:new-session__sfx-btn--picked={!allowSfx}
                    on:click={() => allowSfx = false}
                >
                    <div class="new-session__sfx-btn-check-box"></div>
                    <span>Off</span>
                </button>
            </div>
         </div>

         <div class="new-session__sfx">
            <div>
                <div class="new-session__sfx-name">
                    Time Blindness
                </div>
                <span>Gently chimes every {`${SessionManager.CHIME_PERIOD_SECS / 60}`} minutes.</span>
            </div>
            <div class="new-session__sfx-btns">
                <button 
                    class="new-session__sfx-btn"
                    class:new-session__sfx-btn--picked={allowChime}
                    on:click={() => allowChime = true}
                >
                    <div class="new-session__sfx-btn-check-box"></div>
                    <span>On</span>
                </button>
                <button 
                    class="new-session__sfx-btn"
                    class:new-session__sfx-btn--picked={!allowChime}
                    on:click={() => allowChime = false}
                >
                    <div class="new-session__sfx-btn-check-box"></div>
                    <span>Off</span>
                </button>
            </div>
         </div>

        <div class="new-session__btns">
            <button 
                class="new-session__cancel-btn"
                disabled={isSaving}
                on:click={onAttemptClose}
            >
                Cancel
            </button>
            <AsyncButton
                disabled={title === ""}
                isLoading={isSaving} 
                actionFunc={initSession} 
                styling={{
                    width: "calc(100% - (35% + 8px))",
                    borderRadius: "9px",
                    padding: "12px 25px",
                    height: "18.5px"
                }}
            />
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/inputs.scss";

    .new-session {
        width: 470px;
        padding: 14px 23px 21px 23px;

        &__title {
            position: relative;
        }
        input {
            @include text-style(_, var(--fw-400-500), 1.6rem);
            margin-bottom: 14px;
            width: 100%;

            &::placeholder {
                @include text-style(0.1, var(--fw-400-500));
            }
        }
        &__modes {
            @include flex(center);
        }
        &__mode {
            background-color: rgba(var(--textColor1), 0.02);
            padding: 10px 20px 19px 17px;
            width: calc(50% - 3.5px);
            border-radius: 16px;
            border: 1.5px solid rgba(var(--textColor1), 0.02);
            transition: 0.1s cubic-bezier(.4,0,.2,1);
            cursor: pointer;

            &:hover {
                background-color: rgba(var(--textColor1), 0.03);
            }
            &:active {
                transform: scale(0.99);
            }
            &:first-child {
                margin-right: 7px;
            }
            &--selected {
                box-shadow: rgba(var(--fgColor1), 0.8) 0px 0px 0px 2px inset, 
                            rgba(var(--fgColor1), 0.1) 0px 0px 0px 2px;
            }
            &--selected &-title {
                color: rgba(var(--fgColor1));
            }
        }
        &__mode-title {
            @include text-style(0.7, var(--fw-500-600), 1.5rem);
        }
        &__mode-description {
            @include text-style(0.34, var(--fw-400-500), 1.42rem);
            margin-top: 8px;
        }
        &__options {
            @include flex(center);
            margin-top: 14px;
        }
        &__options--flow &__time {
            opacity: 0.4;
            
            button {
                cursor: not-allowed; 
            }
        }
        &__time {
            width: calc(50% - 3.5px);
            margin: 4px 7px 22px 0px;
        }
        &__time span {
            @include text-style(0.65, var(--fw-400-500), 1.425rem);
            padding-left: 7px;
        }
        &__time-input {
            margin: 11px 0px 0px 0px;
            padding: 7px 8px;
            border-radius: 12px;
            background-color: rgba(var(--textColor1), 0.025);
            @include text-style(0.65, var(--fw-400-500), 1.3rem, "Geist Mono");
            @include flex(center, space-between);
        }
        &__time-input button {
            background-color: rgba(var(--textColor1), 0.014);
            height: 25px;
            width: 25px;
            border-radius: 5px;
            @include center;
            @include text-style(0.45, var(--fw-500-600), 1.5rem);

            &:disabled {
                opacity: 1;
            }
            &:active {
                transform: scale(0.97);
            }
            &:hover {
                @include text-style(0.62);
                background-color: rgba(var(--textColor1), 0.05);
            }
        }
        /* sound effects */
        &__sfx {
            @include flex(center, space-between);
            margin-bottom: 17px;
            padding: 0px 5px;

            span {
                @include text-style(0.14, var(--fw-400-500), 1.4rem);
            }
        }
        &__sfx-name {
            @include text-style(0.65, var(--fw-400-500), 1.5rem);
            margin-bottom: 3px;
        }
        &__sfx-btns {
            @include center;
        }
        &__sfx-btn {
            @include flex(center);
            margin-left: 15px;
            
            span {
                @include text-style(0.3, var(--fw-400-500), 1.5rem);
            }
            &--picked span {
                @include text-style(0.8);
            }
            &--picked &-check-box {
                border: 2px solid rgb(var(--fgColor1));
            }
            &--picked &-check-box:before {
                display: block;
            }
        }
        &__sfx-btn-check-box {
            @include circle(14px);
            position: relative;
            border: 2px solid rgba(var(--textColor1), 0.2);
            margin-right: 8px;
            
            &:before {
                content: " ";
                background-color: rgba(var(--fgColor1));
                display: none;
                @include circle(6px);
                @include abs-center;
            }
        }

        &__btns {
            margin-top: 40px;
            @include flex(center);

            button {
                padding: 12px 25px;
                border-radius: 9px;
                @include center;
                @include text-style(0.55, var(--fw-400-500), 1.5rem);
            }
        }
        &__cancel-btn {
            width: 35%;
            margin-right: 8px;
            font-weight: 400;
            @include txt-color(0.03, "bg");

            &:hover {
                transition-duration: 0s;
                @include txt-color(0.06, "bg");
            }
        }
    }
</style>