<script lang="ts">
	import { onMount } from "svelte"

    import { imageUpload } from "$lib/utils-home"
    import { TextEditorManager } from "$lib/inputs"
	import { formatDatetoStr } from "../../../lib/utils-date"

	import Modal from "../../../components/Modal.svelte"

    export let data: DayEntry
    export let onUpdate: (updatedData: DayEntryUpdatePayload) => void

    const TEXT_ENTRY_ID = "day-entry"
    const CAPTION_ID = "day-entry-img-caption"
    
    const { img, date, thoughtEntry } = data
    const newData: DayEntryUpdatePayload = {
        img, thoughtEntry
    }

    let editorElem: HTMLElement

    new TextEditorManager({ 
        placeholder: "notes about this day...",
        allowFormatting: true,
        maxLength: 1000,
        id: TEXT_ENTRY_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newData.thoughtEntry = val
            }
        }
    })
    new TextEditorManager({ 
        placeholder: "no image caption",
        maxLength: 50,
        id: CAPTION_ID,
        handlers: {
            onInputHandler: (_, val) => {
                newData.img.caption = val
            }
        }
    })
    function initImgUpload() {
        imageUpload.init({
            onSubmit: (src: string | null) => {
                if (src) {
                    newData.src = src
                }
            }
        })
    }
    onMount(() => {
        if (!thoughtEntry) {
            editorElem.focus()
        }
    })
</script>

<Modal 
    options={{ borderRadius: "10px", scaleUp: true }} 
    onClickOutSide={() => {
        imageUpload.close()
        onUpdate(newData)
    }}
>
    <div style:perspective="120px">
        <div 
            class="day-entry"
            class:day-entry--no-img={!newData.img}
        >
            {#if newData.img}
                <div class="day-entry__img">
                    <div class="day-entry__img-caption">
                        <div 
                            id={CAPTION_ID}
                            data-placeholder="no image caption"
                            class="day-entry__img-caption"
                            contenteditable
                            spellcheck="false"
                        >
                            {newData.img.caption}
                        </div>
                    </div>
                    <div class="day-entry__img-container">
                        <div class="day-entry__img-overlay">
                            <button 
                                on:click={() => {
                                    newData.img = undefined
                                }}
                            >
                                Remove
                            </button>
                        </div>
                        <img src={newData.img.src} alt="">
                    </div>
                </div>
            {/if}
            <div class="day-entry__date">
                <span style:margin-bottom="2.5px">
                    {formatDatetoStr(date, { 
                        month: "long", day: "numeric"
                    })}
                </span>
                <span style:opacity="0.2" style:font-size="1.6rem">
                    {date.getFullYear()}
                </span>
            </div>
            <div 
                id={TEXT_ENTRY_ID}
                class="text-editor"
                contenteditable
                spellcheck="false"
                bind:this={editorElem}
            >
                {@html thoughtEntry}
            </div>

            {#if !newData.img}
                <button 
                    class="day-entry__add-img-btn"
                    on:click={() => initImgUpload()}
                >
                    Add Image
                </button>
            {/if}
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../../scss/inputs.scss";

    .day-entry {
        width: 520px;
        object-fit: cover;
        padding: 24px 30px 22px 24px;
        position: relative;
        
        &--no-img {            
            padding: 18px 25px 22px 27px;
        }
        &--no-img &__date {            
            margin: 0px 0px 20px 0px;
        }

        button {
            @include text-style(1, 400, 1.18rem, "DM Mono");
            opacity: 0.1;
            
            &:hover {
                opacity: 0.4;
            }
        }
        
        img {
            width: 230px;
            max-height: 240px;
            object-fit: cover;
            border-radius: 6px;
        }
        &__img {
            @include flex(flex-start, space-between);
            width: 100%;
        }
        &__img-container {
            position: relative;
        }
        &__img-container:hover &__img-overlay {
            @include visible;
        }
        &__img-overlay {
            @include not-visible;
            transition: 0.2s ease-in-out 0.2s;
            background-color: rgba(black, 0.5);
            height: calc(100% - 2.5px);
            width: 100%;
            border-radius: 4px;
            @include abs-top-left;
            @include center;


            button {
                opacity: 0.5;
            
                &:hover {
                    opacity: 1;
                }
            }
        }
        &__img-caption {
            @include text-style(0.2, 400, 1.3rem, "DM Mono");
            display: block;
            max-width: calc(100% - 180px);
            overflow: scroll;
            padding-right: 15px;
            margin-top: -5px;
        }
        &__img-caption div[contenteditable] {
            max-width: 100%;
            padding-top: 5px;
        }
        &__img-caption div[contenteditable]:empty:before {
            opacity: 0.55;
        }
        &__date {
            margin: -28px 0px 10px 0px;
            @include text-style(1, 400, 1.65rem, "DM Mono");

            span {
                margin-right: 14px;
                display: block;
            }
        }
        &__add-img-btn {
            @include abs-top-right(15px, 24px);
        }
    }

    .text-editor {
        @include text-style(0.45, 500, 1.5rem, "Manrope");
        max-height: 300px;
        min-height: 240px;
    }
</style>