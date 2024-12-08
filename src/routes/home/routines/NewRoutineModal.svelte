<script lang="ts">
	import { onMount } from "svelte"
	import { themeState } from "$lib/store"
	import { toast } from "$lib/utils-toast"
	import { TextEditorManager } from "$lib/inputs"
    
	import Modal from "../../../components/Modal.svelte"
	import AsyncButton from "../../../components/AsyncButton.svelte"
	import ConfirmationModal from "../../../components/ConfirmationModal.svelte"
	import { getElemById } from "$lib/utils-general"

    export let onFinishEdit: ((newRoutine: DailyRoutine | null) => void) | ((newRoutine: WeeklyRoutine | null) => void)
    export let isForWeek: boolean
    export let bounds: { titleMax: number, descrMax: number }

    let editHasBeenMade = false
    let isSaving = false
    let confirmModalOpen = false
    let emptyTitleError = false

    let currTitleLength = 0
    let currDescriptionLength = 0
    let isDescrFocused = false
    let isTitleFocused = false

    $: isLight      = !$themeState.isDarkTheme
    $: closeRightAway = currTitleLength === 0 && currDescriptionLength === 0

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
    let title = newRoutine.title
    let descriptionn = newRoutine.descriptionn

    (new TextEditorManager({ 
        initValue: "",
        placeholder: "Type description here...",
        doAllowEmpty: true,
        maxLength: bounds.descrMax,
        id: "new-routine-description",
        handlers: {
            onBlurHandler: (_, val) => {
                descriptionn = val
                isDescrFocused = false
            },
            onInputHandler: (_, __, length) => {
                currDescriptionLength = length
            },
            onFocusHandler: () => isDescrFocused = true
        }
    }))

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
        }
        else {
            newRoutine.name = newRoutine.name.slice(0, bounds.titleMax)
            newRoutine.description = newRoutine.description.slice(0, bounds.descrMax)
        }
    }
    async function saveChanges() {
        if (isSaving) return
        try {
            isSaving = true
            validateInput()
            // await asyncCall()
            onFinishEdit(newRoutine as any)

            toast("success", { message: "New routine created!" })
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
        else if (closeRightAway) {
            confirmUnsavedClose()
        }
        else {
            confirmModalOpen = true
        }
    }
    function cancelCloseAttempt() {
        confirmModalOpen = false
    }
    function confirmUnsavedClose() {
        confirmModalOpen = false
        onFinishEdit(null)
    }
    function onKeyPress(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) saveChanges()
        if (e.key === "Escape" && !e.shiftKey) onAttemptClose()
    }

    onMount(() => {
        requestAnimationFrame(() => getElemById("new-routine-title-input")!.focus())
    })
</script>

<svelte:window on:keyup={onKeyPress} /> 

<Modal options={{ borderRadius: "18px", overflowY: "hidden" }} onClickOutSide={onAttemptClose}>
    <div class="new-routine" class:new-routine--light={isLight} on:keyup={onKeyPress}>
        <form>
            <h1 class="new-routine__heading">
                {#if isForWeek}
                    New Weekly Routine
                {:else}
                    New Daily Routine
                {/if}
            </h1>
            <div class="new-routine__title">
                <label class="new-routine__subtitle" for="new-routine-title-input">
                    Name
                </label>
                <div 
                    class="input-box input-box--border"
                    class:input-box--border-focus={isTitleFocused}
                >
                    <input 
                        type="text"
                        name="routine-block-title-input" 
                        id="new-routine-title-input"
                        aria-label="Title"
                        spellcheck="false"
                        autocomplete="off"
                        placeholder={"Type name here..."}
                        maxlength={bounds.titleMax}
                        bind:value={title}
                        on:blur={() => {
                            isTitleFocused = false
                        }}
                        on:focus={() => {
                            isTitleFocused = true
                        }}
                    >
                    <div 
                        class="input-box__count"
                        class:input-box__count--over={currTitleLength > bounds.titleMax}
                    >
                        {bounds.titleMax - currTitleLength}
                    </div>
                </div>
                {#if emptyTitleError}
                    <span class="input-box-error-text">
                        Title is empty
                    </span>
                {/if}
            </div>
            <div class="new-routine__description">
                <label class="new-routine__subtitle" for="new-routine-description">
                    Description
                </label>
                <div 
                    class="input-box input-box--border"
                    class:input-box--border-focus={isDescrFocused}
                >
                    <div 
                        id="new-routine-description"
                        class="edit-routine__description-text-editor text-editor"
                        contenteditable
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
                    disabled={false}
                    isLoading={isSaving} 
                    actionFunc={saveChanges} 
                    styling={{
                        width: "calc(100% - (35% + 8px))",
                        borderRadius: "9px",
                        padding: "12px 25px",
                        height: "18.5px"
                    }}
                />
            </div>
        </form>
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
        padding: 17px 25px 20px 25px;
        
        &--light .input-box {
            @include input-box--light;
        }
        &--light &__heading {
            @include text-style(1, 600);
        }
        &--light &__subtitle {
            @include text-style(0.97, 600);
        }
        &--light input {
            color: rgba(var(--textColor1), 1) !important;
        }
        &--light .text-editor {
            color: rgba(var(--textColor1), 1) !important;
        }
        &--light &__cancel-btn {
            @include text-style(0.97, 500);
            @include txt-color(0.09, "bg");
        }
        &--light &__cancel-btn:hover {
            @include txt-color(0.15, "bg");
        }
        
        input, .text-editor {
            @include text-style(0.85, 500, 1.3rem);
        }
        input::placeholder {
            @include text-style(_, 400, 1.3rem);
        }
        &__heading {
            @include text-style(0.7, 500, 1.2rem);
            margin-bottom: 15px;
        }
        &__subtitle {
            display: block;
            @include text-style(0.6, 400, 1.24rem);
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
            height: 140px;
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
            padding: 12px 25px;
            border-radius: 9px;
            @include center;
            @include text-style(1, _, 1.34rem);
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