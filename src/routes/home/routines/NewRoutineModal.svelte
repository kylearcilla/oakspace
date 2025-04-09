<script lang="ts">
    import { onMount } from "svelte"
    import { v4 as uuidv4 } from 'uuid'
	import { themeState } from "$lib/store"
	import { toast } from "$lib/utils-toast"
	import { TextEditorManager } from "$lib/inputs"
    
	import Modal from "$components/Modal.svelte"
	import ConfirmBtns from "$components/ConfirmBtns.svelte"
	import ConfirmationModal from "$components/ConfirmationModal.svelte"

    export let onFinishEdit: (newRoutine: DailyRoutine | WeeklyRoutine | null) => void
    export let type: "daily" | "weekly"
    
    const MAX_TITLE_LENGTH = 50
    const MAX_DESCRIPTION_LENGTH = 400
    const DESCRIPTION_ID = "new-routine-description"

    let titleInput: HTMLElement
    let isSaving = false
    let confirmModalOpen = false

    let descrLength = 0
    let descrFocus = false
    let titleFocus = false

    $: light      = !$themeState.isDarkTheme

    const newWkRoutine: WeeklyRoutine = {
        idx: -1,
        id: uuidv4(),
        name: "",
        description: "",
        blocks: {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], 
            Friday: [], Saturday: [], Sunday: []
        }
    }
    const newDailyRoutine: DailyRoutine = {
        idx: -1,
        id: uuidv4(),
        name: "",
        description: "",
        blocks: []
    }
    let newRoutine = type === "weekly" ? newWkRoutine : newDailyRoutine

    new TextEditorManager({ 
        initValue: "",
        placeholder: "description here...",
        singleLine: true,
        maxLength: MAX_DESCRIPTION_LENGTH,
        id: DESCRIPTION_ID,
        handlers: {
            onBlurHandler: (_, val) => {
                newRoutine.description = val
                descrFocus = false
            },
            onInputHandler: (_, __, length) => {
                descrLength = length
            },
            onFocusHandler: () => descrFocus = true
        }
    })

    /* conclude */
    function asyncCall() {
        return new Promise((resolve) => setTimeout(() => resolve("xxx"), 1400))
    }
    async function submit() {
        if (isSaving) return

        try {
            isSaving = true
            await asyncCall()
            onFinishEdit(newRoutine)

            toast("success", { 
                message: "New routine created!" 
            })
        }
        catch(e: any) {
            toast("error", { 
                message: "Error saving your changes. Try again later."
            })
        }
        finally {
            isSaving = false
        }
    }
    function cancelClicked() {
        if (isSaving) {
            return
        }
        else if (isEmpty(true)) {
            close()
        }
        else {
            confirmModalOpen = true
        }
    }
    function close() {
        confirmModalOpen = false
        onFinishEdit(null)
    }
    function onKeyPress(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey && !isEmpty()) {
            submit()
        }
        if (e.key === "Escape" && !e.shiftKey) {
            cancelClicked()
        }
    }
    function isEmpty(all: boolean = false) {
        const name = newRoutine.name.trim().length
        const descr = newRoutine.description.trim().length

        return name === 0 && all ? descr === 0 : true
    }

    onMount(() => requestAnimationFrame(() => titleInput.focus()))
</script>

<svelte:window on:keyup={onKeyPress} /> 

<Modal 
    options={{ 
        borderRadius: "13px", 
        overflowY: "hidden",
        scaleUp: true  
    }} 
    onClickOutSide={cancelClicked}
>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="new-routine" 
        class:new-routine--light={light} 
        on:keyup={onKeyPress}
    >
        <div 
            class="input-box input-box--border"
            class:input-box--light={light}
            class:input-box--border-focus={titleFocus}
        >
            <input 
                bind:this={titleInput}
                class="new-routine__title text-editor"
                aria-label="Title"
                spellcheck="false"
                placeholder="new block title..."
                maxLength={MAX_TITLE_LENGTH}
                style:margin-top="1px"
                on:focus={() => titleFocus = true}
                on:blur={() => titleFocus = false}
                bind:value={newRoutine.name}
            />
        </div>
        <div 
            class="input-box input-box--border"
            class:input-box--light={light}
            class:input-box--border-focus={descrFocus}
        >
            <div 
                id={DESCRIPTION_ID}
                class="new-routine__description text-editor"
                aria-label="Description"
                contenteditable
                spellcheck="false"
            />
            <div 
                class="input-box__count"
                class:input-box__count--over={descrLength > MAX_DESCRIPTION_LENGTH}
            >
                {MAX_DESCRIPTION_LENGTH - descrLength}
            </div>
        </div>
        <ConfirmBtns 
            disabled={newRoutine.name.trim().length === 0}
            isLoading={isSaving}
            onCancel={cancelClicked}
            onOk={submit}
        />
    </div>
</Modal>

{#if confirmModalOpen} 
    <ConfirmationModal 
        text="Discard unsaved changes?"
        confirmText="Yes, Discard"
        onCancel={() => {
            confirmModalOpen = false
        }}
        onOk={() => {
            close()
        }}
    /> 
{/if}

<style lang="scss">
    @import "../../../scss/inputs.scss";

    .new-routine {
        width: 420px;
        padding: 17px 20px 18px 20px;

        --cancel-btn-opacity: 0.025;
        
        &--light {
            --cancel-btn-opacity: 0.065;
        }
        &__title {
            margin: 0px 0px 9px 0px;
            width: 100%;

            &::placeholder {
                opacity: 0.3;
            }
        }
        &__description {
            display: block;
            position: relative;
            max-height: 180px;
            height: calc(100% - 40px);
        }
        .input-box {
            min-height: 160px;
            align-items: flex-start;
            margin-bottom: 14px;
            cursor: text;

            &:first-child {
                min-height: 0px !important;
                height: 40px !important;
                border-radius: 10px !important;
                padding: 5px 10px 3px 13px !important;
                margin-bottom: 10px;
            }
        }
        .input-box__count {
            margin-right: 5px;
            @include abs-bottom-right(12px, 8px);
        }
    }
</style>