<script lang="ts">
	import { onMount } from "svelte"
	import Modal from "../../components/Modal.svelte"
    import AsyncButton from "../../components/AsyncButton.svelte"

    export let onCancel: FunctionParam
    export let onOk: (text: string) => (Promise<void> | void)
    export let options: {
        title?: string
        id?: string
        allowEmpty?: string,
        initText?: string
        placeholder?: string
        maxLength?: number
    } | undefined = undefined

    const title = options?.title ?? ""
    const initText = options?.initText ?? ""
    const placeholder = options?.placeholder ?? "Type here..."
    const maxLength = options?.maxLength ?? 500
    const allowEmpty = options?.allowEmpty ?? false
    const id = options?.id ?? ""

    let textInputRef: HTMInputLElement
    let text = initText
    let isFocused = false
    let emptyTitleError = false
    let currLength = initText.length
    let loading = false

    function onInputHandler() {
        text = textInputRef.value
        currLength = text.length
    }
    async function okBtnClicked() {
        const isOver = text.length > maxLength

        if (isOver || !allowEmpty && text === "") {
            emptyTitleError = true
        }
        else {
            onOk(text)
            onCancel()
        }
    }

    onMount(() => textInputRef.focus())
</script>

<Modal 
    options={{ borderRadius: "20px", overflowY: "hidden" }} 
    onClickOutSide={onCancel}
>
    <div class="text-modal">
        {#if title}
            <h1>{title}</h1>
        {/if}
        <div 
            class="input-box input-box--border"
            class:input-box--border-focus={isFocused}
        >
            <input
                bind:this={textInputRef}
                {id}
                {placeholder}
                name={id}
                type="text"
                aria-label="Title"
                spellcheck="false"
                autocomplete="off"
                maxlength={maxLength}
                bind:value={text}
                on:blur={() => {
                    isFocused = false
                }}
                on:input={() => {
                    onInputHandler()
                }}
                on:focus={() => {
                    emptyTitleError = false
                    isFocused = true
                }}
            >
                <div 
                    class="input-box__count"
                    class:input-box__count--over={currLength > maxLength}
                >
                    {maxLength - currLength}
                </div>
        </div>
        {#if emptyTitleError}
            <span class="input-box-error-text">
                Text is empty
            </span>
        {/if}
        <div class="text-modal__btns">
            <button on:click={onCancel}>
                Cancel
            </button>
            <AsyncButton 
                styling={{ 
                    height: "40px", 
                    width: "calc(100% - 140px)",
                    borderRadius: "8px" 
                }}
                isLoading={loading}
                actionFunc={okBtnClicked}
            />
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/inputs.scss";

    .text-modal {
        width: 390px;
        padding: 19px 19px 19px 19px;
        
        .input-box {
            padding: 8.5px 12px 8px 16px;
            margin: 0px 0px 0px 0px;
        }
        h1 {
            @include text-style(0.35, 500, 1.35rem);
            margin: -2px 0px 14px 0px;
        }
        &__text {

        }
        &__btns {
            @include flex(center);
            margin-top: 30px;

            button {
                height: 40px;
                width: 140px;
                border-radius: 8px;
                margin-right: 6px;
                @include center;
                @include txt-color(0.03, "bg");
                @include text-style(0.5, 500, 1.22rem);


                &:hover {
                    @include txt-color(0.04, "bg");
                }
            }
        }
    }
</style>