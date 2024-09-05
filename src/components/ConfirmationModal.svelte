<script lang="ts">
	import { themeState } from "$lib/store";
	import Modal from "./Modal.svelte";

    export let text: string
    export let onCancel: FunctionParam
    export let onOk: FunctionParam
    export let options: ConfirmOptions

    $: isDarkTheme  = $themeState.isDarkTheme
    $: deleteColors = {
        color1: isDarkTheme ? "#ECAAAE" : "#583e40",
        color2: isDarkTheme ? "#181111" : "#d4ac9e",
        color3: isDarkTheme ? "#322122" : "#C29B90"
    }

    const _options = {
        type:    options?.type ?? "default",
        cancel:  options?.cancel ?? "Cancel",
        ok:      options?.ok ?? "OK",
        caption: options?.caption
    }
    const { type, cancel, ok, caption } = _options

    let isHolding = false
    let holdEnd = false
    let isDelete = options.type === "delete"

    const HOLD_DOWN_DELETE_CONFIRM = 1.5

    function onConfirmPointerDown(pe: PointerEvent) {
        if (pe.button === 2) return
        isHolding = true
    }
    function onConfirmPointerUp(pe: PointerEvent) {
        if (pe.button === 2) return
        isHolding = false

        if (type != "delete") {
            onOk()
        }
    }
    function onHoldEnd() {
        holdEnd = true
        onOk()
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

<Modal options={{ borderRadius: "18px"}} onClickOutSide={() => onCancel()}>
    <div 
        class="confirm"
        class:confirm--light={!isDarkTheme}
        class:confirm--non-delete={type != "delete"}
        style:--hold-down-length={`${HOLD_DOWN_DELETE_CONFIRM}s`}
        on:pointerup={onPointerUp} 
        on:mouseleave={onMouseLeave}
    >
        {#if caption}
            <span class="confirm__caption">
                {caption}
            </span>
        {/if}
        <div class="confirm__text">
            {@html text}
        </div>
        <div class="confirm__btns-container">
            <button
                class="confirm__cancel-btn"
                on:click={onCancel}
            >
                {cancel}
            </button>
            <button
                class="confirm__ok-btn"
                class:confirm__ok-btn--holding={type === "delete" && isHolding}
                style:background-color={`${isDelete ? deleteColors.color2 : "rgba(var(--fgColor1)"}`}
                style:--hold-fill-color={`${deleteColors.color3}`}
                on:pointerdown={onConfirmPointerDown}
                on:pointerup={onConfirmPointerUp}
                on:animationend={onHoldEnd}
            >
                <span style:color={`${isDelete ? deleteColors.color1 : "rgba(var(--textColor1)"}`}>
                    {#if isHolding && type === "delete"}
                        Deleting...
                    {:else}
                        {ok}
                    {/if}
                </span>
            </button>
        </div>
    </div>
</Modal>


<style global lang="scss">

    .confirm { 
        width: 350px;
        padding: 16px 21px 19px 21px;

        &--light &__caption {
            @include text-style(0.7);
        }
        &--light &__text {
            @include text-style(1);
        }
        &--light &__cancel-btn {
            @include txt-color(0.08, "bg");
        }
        &--light &__ok-btn:hover {
            filter: brightness(0.94);
        }
        &--light#{&}--non-delete &__ok-btn span {
            color: var(--modalBgColor) !important;
        }

        &__caption {
            @include text-style(0.2, 500, 1.25rem);
            margin-bottom: 7px;
            display: block;
        }
        &__text {
            @include text-style(0.85, 500, 1.44rem);
            margin-bottom: 32px;
        }
        button {
            padding: 12px 25px;
            border-radius: 9px;
            @include center;
            @include text-style(1, 500, 1.34rem);
            transition: 0.01s ease-in-out;
        }

        &__btns-container {
            width: 100%;
            @include flex(center);
        }
        &__cancel-btn {
            width: 35%;
            margin-right: 8px;
            font-weight: 300;
            @include txt-color(0.03, "bg");
            
            &:hover {
                @include txt-color(0.06, "bg");
            }
        }
        &__ok-btn {
            width: calc(100% - (35% + 8px));
            position: relative;
            overflow: hidden;
            transition: 0.14s cubic-bezier(.4,0,.2,1) !important;
            
            &--holding::before {
                animation: hold-confirm var(--hold-down-length) ease-in-out;
                visibility: visible !important;
            }
            &:hover {
                filter: brightness(1.1);
            }
            &::before {
                @include abs-top-left;
                visibility: hidden;
                content: " ";
                width: 100%;
                height: 100%;
                background-color: var(--hold-fill-color);
                z-index: 0;
            }
            span {
                @include text-style(1, _, 1.34rem, "DM Sans");
                z-index: 10;
                margin: 0px;
            }
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