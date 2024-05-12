<script lang="ts">
	import { themeState } from "$lib/store";
	import Modal from "./Modal.svelte";

    export let text: string
    export let onCancel: FunctionParam
    export let onOk: FunctionParam
    export let options: ConfirmOptions

    $: isDarkTheme  = $themeState.isDarkTheme
    $: deleteColors = {
        color1: isDarkTheme ? "#ECAAAE" : "",
        color2: isDarkTheme ? "#181111" : "",
        color3: isDarkTheme ? "#301617" : ""
    }

    let _options = {
        type:    options?.type ?? "default",
        cancel:  options?.cancel ?? "Cancel",
        ok:      options?.ok ?? "OK",
        caption: options?.caption
    }

    let isHolding = false
    let holdEnd = false
    let isDelete = options.type === "delete"

    function onBtnPointerDown() {
        if (_options.type !== "delete") {
            onOk()
            return
        }
        if (!holdEnd) isHolding = true
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

<Modal options={{ borderRadius: "14px"}} onClickOutSide={() => onCancel()}>
    <div class="confirm" on:pointerup={onPointerUp} on:mouseleave={onMouseLeave}>
        {#if _options.caption}
            <span>{_options.caption}</span>
        {/if}
        <h1>{text}</h1>
        <div class="confirm__btns-container">
            <button
                class="confirm__cancel-btn"
                on:click={onCancel}
            >
                {_options.cancel}
            </button>
            <button
                class="confirm__ok-btn"
                class:confirm__ok-btn--holding={isHolding}
                style:background-color={`${isDelete ? deleteColors.color2 : "rgba(var(--fgColor1)"}`}
                style:--hold-fill-color={`${deleteColors.color3}`}
                on:pointerdown={onBtnPointerDown}
                on:mouseup={() => isHolding = false}
                on:animationend={onHoldEnd}
            >
                <span style:color={`${isDelete ? deleteColors.color1 : "rgba(var(--textColor1)"}`}>
                    {_options.ok}
                </span>
            </button>
        </div>
    </div>
</Modal>


<style lang="scss">

    .confirm { 
        width: 350px;
        padding: 25px 34px 24px 34px;
        span {
            @include text-style(0.2, 400, 1.25rem);
            margin-bottom: 10px;
            display: block;
        }
        h1 {
            @include text-style(0.85, 400, 1.44rem, "DM Sans");
            margin-bottom: 32px;
        }
        button {
            padding: 14px 25px;
            border-radius: 9px;
            @include center;
            @include text-style(1, _, 1.34rem, "DM Sans");
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
            font-weight: 500;
            position: relative;
            overflow: hidden;
            
            &--holding::before {
                animation: hold-confirm 1.5s ease-in-out;
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