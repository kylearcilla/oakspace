<script lang="ts">
	import { onDestroy } from "svelte"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { globalContext, sessionManager, themeState, timer } from "$lib/store"

	import { updateRoute } from "$lib/utils-home"
	import { secsToHhMmSs } from "$lib/utils-date"
	import { TextEditorManager } from "$lib/inputs"
	import { SessionManager } from "$lib/session-manager"

    const TITLE_ID = "session-title"
    const TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS
    const MAX_SESSION_TITLE = 100

    let textWidth = 0
    let unsubscribe: any
    let editor: TextEditorManager | null = null

    let timeWidth = 0
    let pointerDown = false

    $: light = !$themeState.isDarkTheme
    $: context = $globalContext
    $: ambience = context.ambience?.active
    $: styling = ambience ? context.ambience?.styling ?? "" : "" 
    $: location = context.sessionLocation

    $: manager = $sessionManager
    $: focusUI = ["focus", "to-focus"].includes(manager!.state)
    $: transition = manager!.state.startsWith("to-")
    $: progressSecs = manager!.progressSecs
    $: session   = manager!.session
    $: secs = transition ? TRANSITION_DUR_SECS - progressSecs : progressSecs

    $: if (manager && !unsubscribe) { 
        unsubscribe = timer.subscribe(() => manager.updateProgress()) 
    }

    $: if (session && !editor) {
        editor = new TextEditorManager({ 
            id: TITLE_ID,
            doAllowEmpty: false,
            initValue: session?.name,
            placeholder: "session title...",
            singleLine: true,
            maxLength: MAX_SESSION_TITLE,
            handlers: {
                onBlurHandler: (_, val) => manager!.updateTitle(val)
            }
        })
    }

    function onPointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement
        const path = $page.url.pathname
        const classes = target.classList
        const valid = classes.contains("session") || classes.contains("session__time") || target.closest(".session__ring")

        if (!valid) {
            return
        }
        else if (path === "/home/session") {
            goto(manager!.prevPage)
        }
        else if (location === "workspace") {
            if (path === "/home/space") {
                manager!.toggleShow()
            }
            else {
                goto("/home/space")
            }
        }
        else {
            manager!.updatePrevPage(path)
            goto("/home/session")
            updateRoute("session")
        }
        pointerDown = true
    }
    onDestroy(() => unsubscribe())
</script>

<div
    title={session.name}
    class="session"
    class:session--active={pointerDown}
    class:session--ambience={ambience}
    class:session--ambience-solid={styling === "solid"}
    class:session--transparent={ambience && styling != "solid"}
    class:session--transition={transition}
    class:session--light={light}
    class:ambient-blur={styling === "blur"}
    class:ambient-clear={styling === "clear"}
    style:--shimmer-text-width={`${textWidth}px`}
    on:pointerdown={onPointerDown}
    on:pointerup={() => pointerDown = false}
>
    {#if manager}
        {@const { todosChecked, state, isPlaying} = manager }
        {@const todos = session.todos}
        <div class="session__ring-container">
            <div
                class="session__ring"
                class:session__ring--no-anim={!focusUI || light}
                title={focusUI ? "Focused" : "On Break"}
            >
                {#if focusUI}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9" cy="9" r="7" stroke-width="3" />
                        <circle cx="9" cy="9" r="3.8" stroke-width="1.95" />
                    </svg>
                {:else}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9" cy="9" r="6.5" stroke-width="3" />
                    </svg>
                {/if}
            </div>
        </div>
        <div 
            bind:clientWidth={timeWidth}
            class="session__time"
            style:min-width="{timeWidth}px"
        >
            {secs >= 0 ? secsToHhMmSs(secs) : "--:--"}
        </div>
        <div class="divider"></div>

        {#if !transition}
            <div 
                class="session__title text-editor no-scroll-bar"
                id={TITLE_ID}
                aria-label="Title"
                spellcheck="false"
                contenteditable="true"
                bind:textContent={session.name}
            />
        {:else} 
            <div 
                bind:clientWidth={textWidth}
                class="session__message"
                class:shimmer-anim={transition}
                style:--shimmer-text-width="50px"
            >
                {#if state === "to-focus"}
                    Now focusing...
                {:else if state === "to-break"}
                    Now breaking...
                {/if}
            </div>
        {/if}

        {#if todos.length ?? 0 > 0}
            <div class="session__progress">
                {todosChecked}/{todos.length}
            </div>
        {/if}
        <button on:click={() => manager.togglePlay()}>
            <i class={`${isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}>
            </i>
        </button>
    {/if}
</div>

<style lang="scss">
    .session {
        @include flex(center);
        padding: 0px 5px 1px 7px;
        border-radius: 15px;
        z-index: 5;
        transition: 0.04s ease-in-out;
        border: none;
        height: 26px;
        cursor: pointer;
        min-width: 0;
        --color: var(--ringColor);

        .divider {
            width: 1.5px;
            height: 10px;
            border-left: 1.5px solid rgba(var(--textColor1), 0.185);
            margin: 0px 8px 0px 9px;
        }
        &--active {
            transform: scale(0.998);
        }
        &--ambience {
            height: 32px;
            padding: 0px 8px 0px 9px;
        }
        &--ambience-solid {
            background: var(--navMenuBgColor);
        }
        &--transparent {
            --color: 255, 255, 255;
        }
        &--transition {
            --color: var(--textColor1);
        }
        &__ring-container {
            @include center;
            transform: scale(0.875);
            height: 24px;
            width: 24px;
        }
        &__ring {
            margin: 2px 7px 0px 0px;
            position: relative;
            transform: scale(0.98);

            &--no-anim::before {
                display: none;
            }
            &::before {
                content: "";
                height: 12px;
                width: 12px;
                @include abs-center;
                animation: glow 4s ease-in-out infinite;
                border-radius: 20px;
            }
            svg circle {
                stroke: rgba(var(--color), 1);
            }
        }
        &__time {
            @include text-style(1, var(--fw-500-600), 1.22rem);
            color: rgba(var(--color), 1);
            margin-right: 2px;;
        }
        &__emoji {
            margin-right: 6px;
        }
        &__message, &__title {
            @include text-style(0.95, var(--fw-400-500), 1.25rem);
            margin: -1.5px 9px 0px 0px;
            max-width: 120px;
            white-space: nowrap;
        }
        &__message.shimmer-anim {
            color: rgba(var(--textColor1), 0.1);
        }
        &__progress {
            @include text-style(0.25, var(--fw-400-500), 1.18rem);
            margin: 0px 8px 0px 0px;
        }
        button {
            @include circle(21px);
            @include center;
            background-color: rgba(var(--textColor1), 0.1);
            margin-left: 4px;
            position: relative;

            i {
                font-size: 0.9rem;
                @include text-style(0.6, _, 0.9rem);
            }
            &:active {
                transform: scale(0.94);
            }
        }
    }
    @keyframes glow {
        0%, 100% {
            box-shadow: 0px 0px 3px 1px rgba(var(--color), 0.1);
        }
        40%, 50%, 60% {
            box-shadow: 0px 0px 14px 1px rgba(var(--color), 0.7);
        }
    }
</style>