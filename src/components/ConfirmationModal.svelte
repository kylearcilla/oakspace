<script lang="ts">
	import { themeState } from "$lib/store"
	import Modal from "./Modal.svelte"

    export let text: string
    export let onCancel: () => void
    export let onOk: () => void
    export let type: "default" | "delete" = "default"

    $: light  = !$themeState.isDarkTheme

    let isHolding = false
    const HOLD_DOWN_DELETE_CONFIRM = 1.5

    function pointerDown(pe: PointerEvent) {
        if (pe.button === 2 || type === "default") return
        isHolding = true
    }
    function pointerUp(pe: PointerEvent) {
        if (type === "default") {
            onOk()
        }
        else if (pe.button === 2) {
            return
        }
        isHolding = false
    }
    function onHoldEnd() {
        if (isHolding) {
            isHolding = false
            onOk()
        }
    }
    function onPointerUp() {
        if (isHolding) {
            isHolding = false
        }
    }
    function onMouseLeave() {
        if (isHolding) {
            isHolding = false
        }
    }
</script>

<Modal 
    options={{ borderRadius: "10px"}} 
    onClickOutSide={() => onCancel()}
>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="confirm"
        class:confirm--light={light}
        class:confirm--default={type === "default"}
        style:--hold-down-length={`${HOLD_DOWN_DELETE_CONFIRM}s`}
        on:pointerup={onPointerUp} 
        on:mouseleave={onMouseLeave}
    >
        <div class="confirm__text">
            {@html text}
        </div>
        <div style:width="100%">
            <button
                class="confirm__ok-btn"
                class:confirm__ok-btn--holding={isHolding}
                on:pointerdown={pointerDown}
                on:pointerup={pointerUp}
                on:animationend={onHoldEnd}
            >
                <span>
                    {#if isHolding}
                        {type === "default" ? "Submitting..." : "Deleting..."}
                    {:else}
                        Yes, I'm sure
                    {/if}
                </span>
            </button>
            <button
                class="confirm__cancel-btn"
                on:click={onCancel}
            >
                Cancel
            </button>
        </div>
    </div>
</Modal>


<style global lang="scss">

    .confirm { 
        width: 330px;
        padding: 14px 20px 22px 20px;
        font-family: "Geist Mono";

        --brightness-hover: 1.1;

        &--light {
            --brightness-hover: 1.015;
        }
        &--light &__text {
            @include text-style(1);
        }
        &--light &__cancel-btn {
            @include txt-color(0.08, "bg");
        }
        &--default {
            --confirm-color-3: rgba(var(--textColor1), 0.035);
        }
        &--default &__ok-btn {
            background-color: rgba(var(--textColor1), 0.02);
        }
        &--default &__ok-btn:hover {
            background-color: rgba(var(--textColor1), 0.03);
        }
        &--default &__ok-btn span {
            color: rgba(var(--textColor1), 0.8) !important;
        }
        &__text {
            @include text-style(0.85, var(--fw-400-500), 1.35rem);
            margin: 10px 7px 35px 7px;
            text-align: center;
        }
        button {
            padding: 12px 25px;
            border-radius: 9px;
            @include center;
            @include text-style(1, var(--fw-400-500), 1.3rem);

            &:active {
                transform: scale(0.99);
            }
        }
        &__cancel-btn {
            width: calc(100% - 53px);
            font-weight: 300;
            @include txt-color(0.03, "bg");
            
            &:hover {
                @include txt-color(0.06, "bg");
            }
        }
        &__ok-btn {
            margin-bottom: 6px;
            width: calc(100% - 53px);
            position: relative;
            overflow: hidden;
            transition: 0.14s cubic-bezier(.4,0,.2,1) !important;
            background-color: var(--confirm-color-1);
            
            &:hover {
                filter: brightness(var(--brightness-hover));
            }
            &::before {
                @include abs-top-left;
                visibility: hidden;
                content: " ";
                width: 100%;
                height: 100%;
                background-color: var(--confirm-color-3);
                z-index: 0;
            }
            span {
                @include text-style(1, _, 1.3rem);
                color: var(--confirm-color-2);
                z-index: 10;
            }
        }
        &__ok-btn--holding::before {
            animation: hold-confirm var(--hold-down-length) ease-in-out;
            visibility: visible !important;
        }
        @keyframes hold-confirm {
            0% {
                width: 0px;
            }
            100% {
                width: 100%;
            }
        }
    }
</style>