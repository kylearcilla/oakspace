<script lang="ts">
	import { InputManager, TextEditorManager } from "$lib/inputs";
	import { toast } from "$lib/utils-toast";
	import { themeState } from "$lib/store";
    
	import Modal from "../../../components/Modal.svelte"
	import AsyncButton from "../../../components/AsyncButton.svelte"
	import ConfirmationModal from "../../../components/ConfirmationModal.svelte"

    export let onFinishEdit: ((newRoutine: DailyRoutine | null) => void) | ((newRoutine: WeeklyRoutine | null) => void)
    export let isForWeek: boolean
    export let bounds: { titleMax: number, descrMax: number }

    let editHasBeenMade = false
    let isSaving = false
    let confirmModalOpen = false
    let emptyTitleError = false

    let currTitleLength = 0
    let currDescriptionLength = 0

    $: isLight  = !$themeState.isDarkTheme

    const newWkRoutine: WeeklyRoutine = {
        id: "",
        name: "",
        description: "",
        blocks: {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], 
            Friday: [], Saturday: [], Sunday: []
        }
    }
    const newDailyRoutine: DailyRoutine = {
        id: "",
        name: "",
        description: "",
        blocks: []
    }

    let newRoutine = isForWeek ? newWkRoutine : newDailyRoutine

    const titleInput = (new InputManager({ 
        initValue: "",
        placeholder: "Type name here...",
        maxLength: bounds.titleMax,
        id: "new-routine-title-input",
        handlers: {
            onBlurHandler: (e, val) => {
                newRoutine.name = val
            },
            onInputHandler: (e, val, length) => {
                emptyTitleError = false
                editHasBeenMade = true
                currTitleLength = length
            }
        }
    })).state

    const descriptionEditor = (new TextEditorManager({ 
        initValue: "",
        placeholder: "Type description here...",
        doAllowEmpty: true,
        maxLength: bounds.descrMax,
        id: "new-routine-description",
        handlers: {
            onBlurHandler: (e, val) => {
                newRoutine.description = val
            },
            onInputHandler: (e, val, length) => {
                editHasBeenMade = true
                currDescriptionLength = length
            }
        }
    })).state

    /* Conclude Changes */
    function asyncCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("Mock data"), 1400)
        })
    }
    function validateInput() {
        if (currTitleLength === 0) {
            emptyTitleError = true
            throw new Error("Name is missing")
            // throw new Error("Name is missing.")
        }
        else if (currTitleLength > bounds.titleMax) {
            throw new Error("Title is too long.")
        }
        else if (currDescriptionLength > bounds.descrMax) {
            throw new Error("Description is too long.")
        }
    }
    async function saveChanges() {
        if (isSaving) return
        try {
            isSaving = true
            validateInput()
            // await asyncCall()
            onFinishEdit(newRoutine as any)

            toast("success", { message: "Changes saved!" })
        }
        catch(e: any) {
            const message = e.message ?? "Error saving your changes. Try again later."

            if (message === "Name is missing") return

            toast("error", { message })
        }
        finally {
            isSaving = false
        }
    }
    function onAttemptClose() {
        if (isSaving) {
            return
        }
        else if (editHasBeenMade) {
            confirmModalOpen = true
        }
        else {
            confirmUnsavedClose()
        }
    }
    function cancelCloseAttempt() {
        confirmModalOpen = false
    }
    function confirmUnsavedClose() {
        confirmModalOpen = false
        onFinishEdit(null)
    }
</script>

<Modal options={{ borderRadius: "18px", overflowY: "hidden" }} onClickOutSide={onAttemptClose}>
    <div 
        class="new-routine"
        class:new-routine--light={isLight}
    >
        <h1 class="new-routine__heading">
            {#if isForWeek}
                New Weekly Routine
            {:else}
                New Daily Routine
            {/if}
        </h1>
        <div class="new-routine__title">
            <div class="new-routine__subtitle">
                Name
            </div>
            <div class="input-box input-box--border">
                <input 
                    type="text"
                    name="routine-block-title-input" 
                    id="new-routine-title-input"
                    aria-label="Title"
                    spellcheck="false"
                    autocomplete="off"
                    value={$titleInput.value}
                    placeholder={$titleInput.placeholder}
                    maxlength={$titleInput.maxLength}
                    on:blur={(e) => $titleInput.onBlurHandler(e)}
                    on:input={(e) => $titleInput.onInputHandler(e)}
                >
                <div 
                    class="input-box__count"
                    class:input-box__count--over={currTitleLength > bounds.titleMax}
                >
                    {bounds.titleMax - currTitleLength}
                </div>
            </div>
            {#if emptyTitleError}
                <span class="input-box__error-text">
                    Title is empty
                </span>
            {/if}
        </div>
        <div class="new-routine__description">
            <div class="new-routine__subtitle">
                Description
            </div>
            <div class="input-box input-box--border">
                <div 
                    class="edit-routine__description-text-editor text-editor"
                    data-placeholder={$descriptionEditor.placeholder}
                    id="new-routine-description"
                    contenteditable
                    bind:innerHTML={$descriptionEditor.value}
                    on:paste={(e) => $descriptionEditor.onPaste(e)}
                    on:input={(e) => $descriptionEditor.onInputHandler(e)}
                    on:focus={(e) => $descriptionEditor.onFocusHandler(e)}
                    on:blur={(e)  => $descriptionEditor.onBlurHandler(e)}
                >
                </div>
                <div 
                    class="input-box__count"
                    class:input-box__count--over={currDescriptionLength > bounds.descrMax}
                >
                    {bounds.descrMax - currDescriptionLength}
                </div>
            </div>
        </div>
        <div class="new-routine__btns">
            <button 
                class="new-routine__cancel-btn"
                disabled={isSaving}
                on:click={onAttemptClose}
            >
                Cancel
            </button>
            <AsyncButton 
                isLoading={isSaving} 
                actionFunc={saveChanges} 
                styling={{
                    width: "calc(100% - (35% + 8px))",
                    borderRadius: "9px",
                    padding: "14px 25px",
                    height: "18.5px"
                }}
            />
        </div>
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text="Discard unsaved changes?"
        onCancel={cancelCloseAttempt}
        onOk={confirmUnsavedClose}
        options={{ ok: "Discard", caption: "Heads Up!" }}
    /> 
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";

    .new-routine {
        width: clamp(420px, 65vw, 500px);
        padding: 20px 25px 22px 25px;
        
        &--light .input-box {
            @include input-box--light;
        }
        &--light &__heading {
            @include text-style(1, 600);
        }
        &--light &__subtitle {
            @include text-style(0.85, 500);
        }
        &--light &__cancel-btn {
            @include text-style(1, 500);
            @include txt-color(0.09, "bg");
        }
        &--light &__cancel-btn:hover {
            @include txt-color(0.15, "bg");
        }
        
        input, .text-editor {
            @include text-style(0.58, 400, 1.3rem);
        }
        input::placeholder {
            @include text-style(_, 400, 1.3rem);
        }
        &__heading {
            @include text-style(0.2, 400, 1.34rem);
            margin-bottom: 12px;
        }
        &__subtitle {
            display: block;
            @include text-style(0.9, 400, 1.32rem);
            margin-bottom: 11px;
        }
        &__title {
            margin-bottom: 18px;
        }
        &__title .input-box {
            border-radius: 14px;
            padding: 8.5px 12px 8px 16px;
        }
        &__title input {
            padding-right: 12px;
        }
        &__description {
            margin-bottom: 34px;
        }
        &__description .input-box {
            display: block;
            padding: 8px 10px 10px 16px;
            position: relative;
        }
        &__description .text-editor {
            height: 100px;
            margin-bottom: 35px;
        }
        &__description .input-box__count {
            margin-top: 5px;
            @include abs-bottom-right(15px, 12px);
        }
        .input-box__count {
            margin-right: 5px;
        }
        &__btns {
            @include flex(center);
        }
        button {
            padding: 14px 25px;
            border-radius: 9px;
            @include center;
            @include text-style(1, _, 1.34rem);
        }
        &__cancel-btn {
            width: 35%;
            margin-right: 8px;
            font-weight: 300;
            @include txt-color(0.03, "bg");

            &:hover {
                transition-duration: 0s;
                @include txt-color(0.06, "bg");
            }
        }
    }
</style>