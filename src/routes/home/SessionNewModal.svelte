<script lang="ts">
	import { onMount } from "svelte"

	import { themeState } from "$lib/store"
	import { Icon, ModalType } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
    import { MAX_SESSION_TITLE } from "$lib/constants"
	import { TextEditorManager } from "$lib/text-editor"
	import { SessionManager } from "$lib/session-manager"

	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import TasksList from "$components/TasksList.svelte"
	import ConfirmBtns from "$components/ConfirmBtns.svelte"

    const SIDE_SPACING = 23
    const TITLE_ID = "session-title"

    $: light = !$themeState.isDarkTheme

    let isSaving = false
    let rootRef: HTMLElement
    let titleElem: HTMLElement

    let title = ""
    let tasks: Task[] = []
    let mode: SessionMode = "pom"
    let focusTime = 25
    let breakTime = 5
    let allowSfx = true
    let allowChime = true
    let newTaskFlag = false

    new TextEditorManager({ 
        id: TITLE_ID,
        initValue: title,
        placeholder: "new session title...",
        allowFormatting: false,
        singleLine: true,
        maxLength: MAX_SESSION_TITLE
    })

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
    function onAttemptClose() {
        closeModal(ModalType.NewSession)
    }

    onMount(() => {
        requestAnimationFrame(() => titleElem.focus())
    })
</script>

<Modal 
    options={{ 
        borderRadius: "19px", 
        scaleUp: true,
        overflowY: "visible", 
        overflowX: "visible"
    }} 
    onClickOutSide={onAttemptClose}
>
    <div 
        class="new-session"
        class:new-session--light={light}
        style:--side-spacing={`${SIDE_SPACING}px`}
    >
        <div 
            bind:this={titleElem}
            class="new-session__title text-editor"
            id={TITLE_ID}
            aria-label="Title"
            spellcheck="false"
            contenteditable="true"
            bind:textContent={title}
        />
        
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

        <div 
            class="new-session__options"
            class:new-session__options--flow={mode === "flow"}
        >
            <div class="new-session__time">
                <span class="new-session__label">
                    Focus Time
                </span>
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
                <span class="new-session__label">
                    Break Time
                </span>
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

         <div class="new-session__sfx">
            <div>
                <div class="new-session__label">
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
                <div class="new-session__label">
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

        <div class="new-session__list" bind:this={rootRef}>
            <div class="new-session__list-header">
                <div class="new-session__label">
                    Todos
                    </div>
                    <div class="flx-center">
                    <span class="new-session__list-count">
                        {tasks.filter((task) => task.parentId === null).length}
                    </span>
                    <button 
                        class="new-session__add-btn"
                        on:click={() => newTaskFlag = !newTaskFlag}
                    >
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1, strokeWidth: 1.8, opacity: 0.7 }}
                        />
                    </button>
                </div>
            </div>
            <div 
                class="new-session__list-body"
                class:new-session__list-body--empty={tasks.length === 0}
            >
                {#if rootRef}
                    <TasksList
                        {newTaskFlag}
                        {tasks}
                        allowInitTasksCall={false}
                        onTaskChange={(_tasks) => tasks = _tasks}
                        options={{
                            id: "session-todos",
                            hotkeyFocus: "default",
                            context: "modal",
                            settings: {
                                checkSubtasks: false,
                                allowDuplicate: false,
                                removeOnComplete: false,
                                max: 20,
                                maxDepth: 2
                            },
                            ui: { 
                                sidePadding: `${SIDE_SPACING + 2}px`,
                                fontSize: "1.5rem",
                                padding: "9px 0px 7px 0px",
                                hasTaskDivider: true
                            },
                            rootRef
                        }}
                    />
                {/if}
                {#if tasks.length === 0}
                    <span class="new-session__list-empty">
                        0 items
                    </span>
                {/if}
            </div>
         </div>

         <div style:padding="0px {SIDE_SPACING}px 0px {SIDE_SPACING}px">
            <ConfirmBtns 
                 disabled={title === ""}
                 isLoading={isSaving}
                 onCancel={onAttemptClose}
                 onOk={initSession}
             />
        </div>
    </div>
</Modal>

<style lang="scss">
    @use "../../scss/inputs.scss" as *;

    .new-session {
        width: 460px;
        padding: 9px 0 20px 0;

        --time-btn-bg-opacity: 0.02;

        &--light {
            --time-btn-bg-opacity: 0.035;
        }
        &--light &__mode:hover {
            background-color: rgba(var(--textColor1), 0.06);
        }
        &--light &__mode-description {
            @include text-style(0.45);
        }
        &--light &__label {
            @include text-style(1);
        }
        &--light &__sfx span {
            @include text-style(0.45);
        }
        &--light &__sfx-btn span {
            @include text-style(1);
        }
        &--light &__list span {
            @include text-style(0.35);
        }

        &__title {
            @include text-style(_, var(--fw-400-500), 1.4rem);
            margin: 4px 0px 14px 0px;
            width: 100%;
            padding: 0 var(--side-spacing);
        }
        &__label {
            @include text-style(0.8, var(--fw-400-500), 1.2rem);
            margin-bottom: 3px;
        }
        &__modes {
            @include flex(center);
            padding: 0 calc(var(--side-spacing) - 3px);
        }
        &__mode {
            background-color: rgba(var(--textColor1), var(--time-btn-bg-opacity));
            border: 1.5px solid rgba(var(--textColor1), calc(var(--time-btn-bg-opacity) + 0.004));
            padding: 10px 20px 22px 17px;
            width: calc(50% - 3.5px);
            border-radius: 16px;
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
                            rgba(var(--fgColor1), 0.195) 0px 0px 0px 2px;
            }
            &--selected &-title {
                color: rgba(var(--fgColor1));
            }
        }
        &__mode-title {
            @include text-style(0.7, var(--fw-500-600), 1.3rem);
        }
        &__mode-description {
            @include text-style(0.34, var(--fw-400-500), 1.2rem);
            margin-top: 8px;
        }
        &__options {
            @include flex(center);
            margin-top: 14px;
            padding: 0 calc(var(--side-spacing));
        }
        &__options--flow &__time {
            opacity: 0.4;
            
            button {
                cursor: not-allowed; 
            }
        }
        &__time {
            width: calc(50% - 3.5px);
            margin: 4px 7px 18px 0px;
        }
        &__time span {
            padding-left: 3px;
            font-size: 1.25rem;
        }
        &__time-input {
            margin: 11px 0px 0px 0px;
            padding: 7px 8px;
            border-radius: 12px;
            @include text-style(0.7, var(--fw-400-500), 1.2rem);
            @include flex(center, space-between);
            background-color: rgba(var(--textColor1), var(--time-btn-bg-opacity));
        }
        &__time-input button {
            background-color: rgba(var(--textColor1), calc(var(--time-btn-bg-opacity) + 0.004));
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
            margin-bottom: 18px;
            padding: 0 calc(var(--side-spacing) + 3px);

            span {
                @include text-style(0.225, var(--fw-400-500), 1.25rem);
                display: inline-block;
                margin-top: 2px;
            }
        }
        &__sfx-btns {
            @include center;
        }
        &__sfx-btn {
            @include flex(center);
            margin-left: 15px;
            
            span {
                @include text-style(0.3, var(--fw-400-500), 1.25rem);
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
            @include circle(12px);
            position: relative;
            border: 2px solid rgba(var(--textColor1), 0.2);
            margin-right: 8px;
            
            &:before {
                content: " ";
                background-color: rgba(var(--fgColor1));
                display: none;
                @include circle(4px);
                @include abs-center;
            }
        }

        /* tasks */
        &__list span {
            @include text-style(0.2, var(--fw-400-500), 1.25rem);
        }
        &__list-header {
            margin-top: 20px;
            padding: 0 calc(var(--side-spacing) + 3px);
            @include flex(center, space-between);
        }
        &__list-body {
            position: relative;
            height: calc(100% - 35px);
            overflow-y: scroll;
            min-height: 100px;
            max-height: 280px;
            margin: 5px 0px 10px 0px;
            
            &--empty {
                min-height: 70px;
            }
        }
        &__list-count {
            margin-right: 11px;
        }
        &__list-empty {
            padding: 0px 0px 0px calc(var(--side-spacing) + 3px);
        }
        &__add-btn {
            @include center;
            @include circle(20px);
            background-color: rgba(var(--textColor1), 0.065);
            margin-right: -4px;

            &:hover {
                background-color: rgba(var(--textColor1), 0.15);
            }
        }
    }
</style>