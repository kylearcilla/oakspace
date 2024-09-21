<script lang="ts">
	import { onMount } from "svelte"
	import { type Writable } from "svelte/store"

	import { ModalType } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { TextEditorManager } from "$lib/inputs"
	import { SessionManager } from "$lib/session-manager"
	import { MAX_SESSION_NAME_LENGTH } from "$lib/utils-session"
    
	import Modal from "../../components/Modal.svelte"
	import TasksList from "../../components/TasksList.svelte"
	import AsyncButton from "../../components/AsyncButton.svelte"

    const TITLE_INPUT_ID = "session-title-input"
    let isSaving = false
    let titleInput: HTMLElement

    let title = ""
    let tasks: Task[] = []
    let mode: SessionMode = "pom"
    let focusTime = 25
    let breakTime = 5
    let allowSfx = true
    let allowChime = true

    let titleEditor: Writable<TextEditorManager>
    let tasksContainer: HTMLElement

    $: initTitleEditor()

    function initTitleEditor() {
        titleEditor = new TextEditorManager({ 
            initValue: "",
            placeholder: "new session title",
            maxLength: MAX_SESSION_NAME_LENGTH,
            id: TITLE_INPUT_ID,
            doAllowEmpty: false,
            handlers: {
                onInputHandler: (_, val) => title = val
            }
        }).state
    }

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
            todos: tasks
        })

        onAttemptClose()
    }
    async function onTaskUpdate(context: TaskUpdateContext | TaskAddContext | TaskDeleteContext)  {
        tasks = context.payload.tasks
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
            {#if titleEditor}
                <div 
                    bind:this={titleInput}
                    id={TITLE_INPUT_ID}
                    class="new-session__text-editor text-editor"
                    data-placeholder={$titleEditor.placeholder}
                    contenteditable
                    spellcheck="false"
                    bind:innerHTML={$titleEditor.value}
                    on:input={(e) => $titleEditor.onInputHandler(e)}
                    on:focus={(e) => $titleEditor.onFocusHandler(e)}
                    on:paste={(e) => $titleEditor.onPaste(e)}
                >
                </div>
                <!-- <div class="text-editor-caret"></div> -->
            {/if}
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
                    Fixed focus sessions with timed breaks in between.
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

        <!-- Tasks -->
         <div class="new-session__tasks">
            <div class="new-session__tasks-header">
                <h4>Tasks</h4>
                <span>{tasks.length}</span>
            </div>
            <div class="new-session__tasks-container" bind:this={tasksContainer}>
                <TasksList
                    options={{
                        id: "session",
                        tasks,
                        containerRef: tasksContainer,
                        isCreatingNewTask: false,
                        handlers: {
                            onAddTask: onTaskUpdate,
                            onDeleteTask: onTaskUpdate,
                            onTaskUpdate: onTaskUpdate
                        },
                        settings: {
                            progress: "count",
                            numbered: false
                        },
                        styling: {
                            task: { 
                                fontSize: "1.21rem",
                                fontWeight: "500",
                                opacity: 0.74,
                                padding: "7px 2px 12px 0px",
                                borderRadius: "10px"
                            },
                            subtask: { 
                                fontSize: "1.2rem",
                                fontWeight: "500",
                                padding: "6px 0px 9px 0px",
                                opacity: 0.65
                            },
                            description: { 
                                margin: "6px 0px 7px 0px", 
                                fontSize: "1.2rem",
                                fontWeight: "500",
                                opacity: 0.54
                            },
                            checkbox: {
                                width: "11px",
                                borderRadius: "4px",    
                                height: "11px",
                                margin: "1px 12px 0px 8px"
                            }
                        },
                        addBtn: {
                            text: "Add Task",
                            style: { 
                                fontSize: "1.2rem"
                            },
                            pos: "top"
                        },
                        contextMenuOptions: { 
                            width: "170px" 
                        },
                        ui: { 
                            sidePadding: "7.5px",
                            showDragHandle: false,
                            hasTaskDivider: true,
                            listHeight: "100%"
                        }
                    }}
                />
            </div>
        </div>

        <!-- Confirm Buttons -->
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
        width: 450px;
        padding: 13px 23px 21px 23px;

        &__title {
            position: relative;
        }
        &__text-editor {
            @include text-style(_, _, 1.55rem);
            margin-bottom: 10px;
        }
        &__modes {
            @include flex(center);
        }
        &__mode {
            background-color: rgba(var(--textColor1), 0.02);
            padding: 10px 16px 17px 16px;
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
                // border: 1.5px solid rgba(var(--fgColor1));
                box-shadow: rgba(var(--fgColor1), 0.8) 0px 0px 0px 2px inset, 
                            rgba(var(--fgColor1), 0.1) 0px 0px 0px 2px;
            }
            &--selected &-title {
                color: rgba(var(--fgColor1));
            }
        }
        &__mode-title {
            @include text-style(0.7, 600, 1.28rem);
        }
        &__mode-description {
            @include text-style(0.34, 500, 1.2rem);
            margin-top: 6px;
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
            margin: 0px 7px 17px 0px;
        }
        &__time span {
            @include text-style(0.5, 500, 1.25rem);
            padding-left: 7px;
        }
        &__time-input {
            margin: 8px 0px 0px 0px;
            padding: 7px 8px;
            border-radius: 12px;
            background-color: rgba(var(--textColor1), 0.025);
            @include text-style(0.65, 400, 1.2rem, "DM Mono");
            @include flex(center, space-between);
        }
        &__time-input button {
            background-color: rgba(var(--textColor1), 0.014);
            height: 25px;
            width: 25px;
            border-radius: 5px;
            @include center;
            @include text-style(0.32, 600, 1.4rem, "Manrope");

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
            margin-bottom: 15px;
            padding: 0px 5px;

            span {
                @include text-style(0.14, 500, 1.2rem);
            }
        }
        &__sfx-name {
            @include text-style(0.5, 500, 1.25rem);
            margin-bottom: 3px;
        }
        &__sfx-btns {
            @include center;
        }
        &__sfx-btn {
            @include flex(center);
            margin-left: 15px;
            
            span {
                @include text-style(0.3, 500, 1.28rem, "DM Sans");
            }
            &--picked span {
                @include text-style(0.8);
            }
            &--picked &-check-box {
                border: 1.5px solid rgb(var(--fgColor1));
            }
            &--picked &-check-box:before {
                display: block;
            }
        }
        &__sfx-btn-check-box {
            @include circle(12px);
            position: relative;
            border: 1.5px solid rgba(var(--textColor1), 0.2);
            margin-right: 8px;
            
            &:before {
                content: " ";
                background-color: rgba(var(--fgColor1));
                display: none;
                @include circle(5px);
                @include abs-center;
            }
        }

        /* tasks */
        &__tasks {
            margin: 17px 0px 0px -1px;

            h4 {
                @include text-style(0.5, 500, 1.25rem);
                margin: 0px 10px 0px 7px;
            }
            span {
                @include text-style(0.11, 400, 1.25rem, "DM Mono");
            }
        }
        &__tasks-header {
            @include flex(center, space-between);
            margin-bottom: 7px;
        }
        &__tasks-container {
            min-height: 35px;
            max-height: 200px;
        }
        &__btns {
            margin-top: 10px;
            @include flex(center);
            button {
                padding: 12px 25px;
                border-radius: 9px;
                @include center;
                @include text-style(0.55, 500, 1.28rem);
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