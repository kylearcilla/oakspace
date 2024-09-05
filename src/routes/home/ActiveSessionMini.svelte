<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores";
	import { SessionManager } from "$lib/session-manager";
	import { sessionManager } from "$lib/store"
	import { secsToHhMmSs } from "$lib/utils-date"
	import { updateRoute } from "$lib/utils-home"

    let settings = false
    let isPlaying = true
    let isOver = true
    let textWidth = 0
    let TRANSITION_DUR_SECS = SessionManager.TRANSITION_DUR_SECS

    $: manager = $sessionManager
    $: focusUI = ["focus", "to-focus"].includes(manager!.state)
    $: transition = manager!.state.startsWith("to-")
    $: state = manager!.state
    $: progressSecs = manager!.progressSecs
    $: isPlaying = manager!.isPlaying
    $: session   = manager!.session
    $: todosChecked = manager!.todosChecked

    function togglePlayback() {

    }
    function toggleDropdown() {

    }
    function onPointerDown() {
        if (!isOver) return
        const path = $page.url.pathname

        if (path === "/home/session") {
            goto(manager!.prevPage)
        }
        else {
            manager!.updatePrevPage(path)
            goto("/home/session")
            updateRoute("session")
        }
    }
    function pointerOver(pe: PointerEvent) {
        const target = pe.target as HTMLElement
        const classes = target.classList

        isOver = classes.contains("active-session")
    }
</script>

<div
    title={session.name}
    class="active-session"
    class:active-session--over={isOver}
    class:active-session--transition={transition}
    style:--text-width={`${textWidth}px`}
    on:pointerdown|self={onPointerDown}
    on:pointerover={pointerOver}
    on:pointerleave={() => isOver = false}
>
    <div class="active-session__ring-container">
        <div
            class="active-session__ring"
            class:active-session__ring--break={!focusUI}
            title={focusUI ? "Focused" : "On Break"}
        >
            {#if focusUI}
                <div class="active-session__ring active-session__ring--inner"></div>
            {/if}
        </div>
    </div>
    <div class="active-session__time">
        {secsToHhMmSs(transition ? TRANSITION_DUR_SECS - progressSecs : progressSecs)}
    </div>
    <div class="divider"></div>
    <div 
        bind:clientWidth={textWidth}
        class="active-session__message"
        class:active-session__message--shimmer={transition}
    >
        {#if state === "to-focus"}
            Now focusing...
        {:else if state === "to-break"}
            Now breaking...
        {:else}
            {session.name}
        {/if}
    </div>
    {#if session.todos.length ?? 0 > 0}
        <div class="active-session__progress">
            {todosChecked}/{session.todos.length}
        </div>
    {/if}
    <div class="active-session__btns">
        <button on:click={() => manager?.togglePlay()}>
            <i 
                class={`${isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}`}
            >
            </i>
        </button>
    </div>
</div>

<style lang="scss">
    .active-session {
        background-color: rgba(var(--textColor1), 0.065);
        @include flex(center);
        height: 100%;
        padding: 0px 5px 0px 9px;
        border-radius: 15px;
        margin: 0px 0px 0px 0px;

        --fg-color: rgba(196, 234, 47);

        &--transition {
            --fg-color: rgba(var(--textColor1), 0.4);
        }
        &--transition &__ring--inner {
            animation: none;
        }
        &--over {
            cursor: pointer;
        }
        &--over:active {
            transition: 0.1s cubic-bezier(.4,0,.2,1);
            transform: scale(0.99);
        }
        .divider {
            @include divider(0.12, 9px, 1px);
            margin: 0px 8px 0px 9px;
        }

        &__ring-container {
            @include center;
            transform: scale(0.94);
            height: 24px;
            width: 24px;
        }
        &__ring {
            margin: 0px 9px 0px 0px;
            border: 2px solid var(--fg-color);
            position: relative;
            @include center;
            @include circle(12px);

            &--break {
                opacity: 0.9;
                @include circle(11px);
            }
        }
        &__ring--inner {
            @include circle(7px);
            @include abs-center;
            border: 1.5px solid var(--fg-color);
            animation: glow-anim 4s ease-in-out infinite;
        }
        &__time {
            @include text-style(1, 400, 1.12rem, "DM Mono");
            color: var(--fg-color);
        }
        &__emoji {
            margin-right: 6px;
        }
        &__message {
            @include text-style(0.95, 500, 1.14rem, "Manrope");
            margin: -1.5px 8px 0px 0px;
            max-width: 80px;
            @include elipses-overflow;
        }
        &__message--shimmer {
            @include text-style(0.3);
            color: rgba(255, 255, 255, 0.1);
            background-image: linear-gradient(to right, transparent 0%, #fff 50%, transparent 100%);
            background-size: calc(var(--text-width) * 4.5) 100%;
            background-clip: text;
            animation: shimmer 2.5s infinite ease-in-out;
            background-repeat: no-repeat;
        }
        &__progress {
            @include text-style(0.25, 400, 1.12rem, "DM Mono");
            margin: -1px 15px 0px 0px;
        }
        &__btns {
            @include flex(center);
            
            i {
                opacity: 0.55;
                font-size: 0.9rem;
            }
            .fa-solid.fa-play {
                font-size: 0.7rem;
            }
        }
        &__btns button {
            @include circle(19px);
            @include center;
            background-color: rgba(var(--textColor1), 0.05);
            margin-left: 4px;

            &:active {
                transform: scale(0.94);
            }
        }
    }
    @keyframes shimmer {
        0% {
            background-position: calc(var(--text-width) * 4.5 * -1) 0;
        }
        100% {
            background-position: var(--text-width) 0;
        }
    }
    @keyframes glow-anim {
        0%, 100% {
            box-shadow: 0px 0px 3px 1px rgba(#C4EA2F, 0.4);
        }
        40%, 50%, 60% {
            box-shadow: 0px 0px 14px 1px rgba(#C4EA2F, 0.9);
        }
    }
</style>