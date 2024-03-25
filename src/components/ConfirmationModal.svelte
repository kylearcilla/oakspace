<script lang="ts">
	import Modal from "./Modal.svelte";

    export let msg: string
    export let onCancel: FunctionParam
    export let onOk: FunctionParam
    export let options: { cancelMsg?: string, okMsg?: string } | undefined = undefined

    const DEFAULT_OPTIONS = {
        cancelMsg: "Cancel",
        okMsg: "OK",
    }

    let _options = {
        cancelMsg: options?.cancelMsg ?? DEFAULT_OPTIONS.cancelMsg,
        okMsg    : options?.okMsg ?? DEFAULT_OPTIONS.okMsg
    }
</script>

<Modal options={{ borderRadius: "20px"}} onClickOutSide={() => onCancel()}>
    <div class="confirm">
        <h1>{msg}</h1>
        <div class="confirm__btns-container">
            <button
                class="confirm__cancel-btn"
                on:click={onCancel}
            >
                {_options.cancelMsg}
            </button>
            <button
                class="confirm__ok-btn"
                on:click={onOk}
            >
                {_options.okMsg}
            </button>
        </div>
    </div>
</Modal>


<style lang="scss">
    .confirm { 
        width: 320px;
        padding: 14px 20px 17px 20px;
        h1 {
            @include text-style(1, 400, 1.55rem);
            margin-bottom: 30px;
        }
        button {
            padding: 11px 25px;
            border-radius: 15px;
            @include center;
            @include text-style(1, _, 1.28rem);
        }
        &__btns-container {
            @include flex(center, flex-end);
        }
        &__cancel-btn {
            margin-right: 8px;
            font-weight: 300;
            @include txt-color(0.03, "bg");

            &:hover {
                @include txt-color(0.06, "bg");
            }
        }
        &__ok-btn {
            background-color: rgba(var(--fgColor1));
            font-weight: 500;

            &:hover {
                filter: brightness(1.1);
            }
        }
    }
</style>