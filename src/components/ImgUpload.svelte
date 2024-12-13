<script lang="ts">
	import { themeState } from "$lib/store"
	import BounceFade from "./BounceFade.svelte"
	import { imageUpload } from "$lib/utils-home"
	import { getImgUploadErrorMsg, validateUserImgFileInput, validateUserImgURLInput } from "$lib/utils-media-upload"
	import { drag } from "d3";
	import { onMount } from "svelte";
    
    const { onSubmit, close, state } = imageUpload
    
    $: isOpen =  $state.isOpen
    $: constraints =  $state.constraints
    $: position =  $state.position

    let errorTxt = ""
    let imgUrl = ""
    let imgFileName = ""
    let inputType: "link" | "file" = "link"

    let isInputFocus = false
    let isInputLoading = false
    let dragOver = false

    let fileInput: HTMLElement
    let linkInput: HTMLInputElement

    const _constraints = {
        maxMbSize: constraints?.maxMbSize ?? 5,
        ...constraints
    }

    $: if (isOpen && linkInput) {
        linkInput.focus()
    }
    $: if (isOpen && !linkInput) {
        setTimeout(() => linkInput.focus(), 100)
    }

    async function onImgUrlSubmit() {
        try {
            if (!imgUrl) return
    
            isInputLoading = true
            await validateUserImgURLInput({
                url: imgUrl, constraints: _constraints
            })

            onSubmit(imgUrl)
            close()
        }
        catch(e: any) {
            console.log(errorTxt)
            errorTxt = getImgUploadErrorMsg(e)
        }
        finally {
            isInputLoading = false
        }
    }
    async function onImgUploaded(event: Event) {
        try {
            const input = event.target as HTMLInputElement
            const file = input.files![0]

            imgFileName = file.name
            isInputLoading = true

            await validateUserImgFileInput({
                file, constraints: _constraints
            })
        }
        catch(e: any) {
            errorTxt = getImgUploadErrorMsg(e)
        }
        finally {
            isInputLoading = false
        }
    }
    function onDrop(e: DragEvent) {
        console.log(e)
    }
    function highlightTabBtnClicked(type: "link" | "file") {
        inputType = type

        imgUrl = ""
    } 
</script>

<BounceFade 
    id={"img-upload--dmenu"}
    zIndex={300}
    isHidden={!isOpen}
    position={{
        top: `${position.top}px`,
        left: `${position.left}px`
    }}
    onDismount={() => {
        inputType = "link"
        errorTxt = ""
        imgFileName = ""
        imgUrl = ""
    }}
    onClickOutside={() => onSubmit(null)}
>
    <div 
        class="img-upload"
        class:img-upload--light={!$themeState.isDarkTheme}
    >
        <div style:position="relative">
            <div>
                <button 
                    on:click={() => highlightTabBtnClicked("link")}
                    class="img-upload__header-btn"
                    class:img-upload__header-btn--selected={inputType === "link"}
                    disabled={inputType === "file" && isInputLoading}
                >
                    Link
                </button>
                <button 
                    on:click={() => highlightTabBtnClicked("file")}
                    class="img-upload__header-btn"
                    class:img-upload__header-btn--selected={inputType === "file"}
                    disabled={inputType === "link" && isInputLoading}
                >
                    Upload
                </button>
            </div>
            <div 
                class="divider"
                style:--h-width={inputType === "link" ? "30px" : "47px"}
                style:--h-left={inputType === "link" ? "0px" : "41px"}
            >
            </div>
        </div>
        <div class="img-upload__content">
            {#if inputType === "link"}
                <div class="img-upload__link">
                    <div 
                        class="input-box"
                        class:input-box--border-focus={isInputFocus}
                        class:input-box--error={errorTxt}
                    >
                        <input 
                            type="text" 
                            placeholder="image link goes here..."
                            bind:this={linkInput}
                            bind:value={imgUrl}
                            on:input={() => errorTxt = ""}
                            on:focus={() => isInputFocus = true}
                            on:blur={() => isInputFocus = false}
                        >
                    </div>
                </div>
            {:else}
                <div class="img-upload__upload">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        class="img-upload__drop-area"
                        class:img-upload__drop-area--hover={dragOver}
                        on:dragover={() => dragOver = true}
                        on:dragleave={() => dragOver = false}
                        on:drop={onDrop}
                    >
                        {#if imgFileName}
                            <div style:text-align="center">
                                <div class="img-upload__file">
                                    <i class="fa-solid fa-file"></i>                                 
                                    <span class="img-upload__file-name">
                                        wallpaper-1.jpg
                                    </span>
                                    <span class="img-upload__file-size">
                                        3.2 MB
                                    </span>
                                </div>
                                <div class="img-upload__file-btns">
                                    <button
                                        class="img-upload__btn"
                                        on:click={() => imgFileName = ""}
                                    >
                                        Remove
                                    </button>
                                    <button
                                        class="img-upload__btn" 
                                        on:click={() => onImgUrlSubmit()} 
                                        disabled={!!errorTxt}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div class="img-upload__drop-area-text">
                                <svg width="89" height="73" viewBox="0 0 89 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M84.0254 55.5722C84.1659 59.0169 83.3415 61.6403 81.5334 63.4471C79.73 65.2538 76.985 66.1572 73.2985 66.1572H14.0152C10.9704 66.1572 8.66112 65.3131 7.10128 63.625C5.53675 61.9369 4.71233 59.4458 4.60928 56.1425L18.409 44.0975C19.0671 43.4687 19.8347 42.9589 20.6761 42.5919C21.4616 42.2543 22.3118 42.0834 23.1703 42.0905C24.0288 42.0976 24.8759 42.2825 25.6554 42.6329C26.508 42.966 27.3136 43.4633 28.0678 44.1294L34.8412 50.0835L51.339 35.6797C52.1915 34.9679 53.0721 34.4341 53.9715 34.0782C55.8073 33.3582 57.8603 33.3714 59.6862 34.1148C60.6324 34.4706 61.5131 35.0136 62.3188 35.7527L84.0254 55.5722ZM29.4918 36.5374C27.938 36.5507 26.4091 36.1567 25.0652 35.3968C23.7517 34.641 22.6559 33.5737 21.88 32.2943C21.0989 30.9857 20.6944 29.4963 20.7089 27.9827C20.7089 26.4361 21.0977 25.0126 21.88 23.7031C22.6559 22.4237 23.7517 21.3565 25.0652 20.6006C26.4049 19.8204 27.8804 19.4281 29.4918 19.4281C31.1032 19.4281 32.5646 19.8204 33.8809 20.6052C35.2019 21.3626 36.2511 22.3982 37.0287 23.7077C37.8344 25.0126 38.2372 26.4361 38.2372 27.9827C38.2514 29.5011 37.833 30.9936 37.0287 32.2943C36.2511 33.6037 35.2019 34.6349 33.8809 35.3968C32.5693 36.1542 31.1032 36.5374 29.4918 36.5374ZM13.1345 69.1502C9.18106 69.1502 6.19254 68.1784 4.16896 66.2302C2.1407 64.2774 1.12891 61.4031 1.12891 57.6025V14.1858C1.12891 10.3852 2.1407 7.51081 4.16896 5.56262C6.19722 3.58706 9.18107 2.60156 13.1392 2.60156H75.7905C79.7674 2.60156 82.77 3.58706 84.7936 5.56262C86.8172 7.51081 87.829 10.3852 87.829 14.1858V57.6025C87.829 61.4031 86.8172 64.2774 84.7936 66.2256C82.7653 68.1784 79.7674 69.1502 75.7905 69.1502H13.1392H13.1345ZM13.5702 62.165H75.383C77.0693 62.165 78.3575 61.7361 79.2615 60.8829C80.1656 60.0024 80.6153 58.7066 80.6153 56.9957V14.7926C80.6153 13.0816 80.1656 11.7996 79.2569 10.9418C78.3575 10.0658 77.0646 9.62325 75.383 9.62325H13.5749C11.8698 9.62325 10.5629 10.0658 9.65885 10.9464C8.78291 11.7996 8.34727 13.0816 8.34727 14.7926V56.9957C8.34727 58.7066 8.78291 60.0024 9.65885 60.8829C10.5629 61.7361 11.8651 62.165 13.5702 62.165Z"/>
                                </svg>                                    
                                <div class="flx-algn-center" style:margin-top="11px">
                                    <span>Drop your image here, or</span>
                                    <button on:click={() => fileInput.click()}>
                                        browse.
                                    </button>
                                </div>
                            </div>
                            <input 
                                bind:this={fileInput}
                                type="file" 
                                id="imageInput" 
                                accept="image/*"
                                style:display="none"
                                on:input={onImgUploaded}
                            >
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
        <div class="img-upload__bottom">
            {#if errorTxt}
                <div class="error-text">
                    {errorTxt ?? ""}
                </div>
            {:else}
                <p>Max size is 5 MB</p>
            {/if}
            {#if inputType === "link"}
                <button 
                    class="img-upload__btn"
                    disabled={Boolean(errorTxt || !imgUrl)}
                    on:click={() => onImgUrlSubmit()}
                >
                    Submit
                </button>
            {/if}
        </div>
    </div>
</BounceFade>

<style lang="scss">
    @import "../scss/inputs.scss";

    .img-upload {
        position: relative;
        width: 450px;
        padding: 12px 19px 14px 19px;
        border-radius: 12px;
        background-color: var(--bg-3);

        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light &__copy {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.8);
        }
        &--light &__upload-name {
            font-weight: 500;
            opacity: 0.4;
        }

        span {
            display: block;
        }

        &__title {
            @include text-style(1, 500, 1.7rem);
        }
        &__copy {
            display: none;
            @include text-style(0.35, 400, 1.5rem);
            margin: 13px 0px 0px 0px;
        }
        &__header-btn {
            @include text-style(1, 400, 1.25rem, "DM Mono");
            margin-right: 10px;
            opacity: 0.2;
            
            &--selected {
                opacity: 1 !important;
            }
            &:hover {
                opacity: 0.5;
            }
            &:active {
                transform: scale(0.99)
            }
        }
        &__btn {
            @include text-style(1, 500, 1.35rem);
            opacity: 0.2;

            &:hover {
                opacity: 0.8;
            }
            &:disabled {
                opacity: 0.05;
            }
            &:first-child {
                margin-right: 12px;
            }
        }
        .divider {
            margin: 6.5px 0px 0px 0px;
            @include divider(0.08, 1px, 100%);
            position: relative;
        }
        .divider::before {
            content: " ";
            @include smooth-bounce;
            height: 1.5px;
            width: var(--h-width);
            background-color: rgba(var(--textColor1), 0.9);
            @include abs-top-left(-0.5px, var(--h-left));
        }

        /* link */
        &__link {
            margin-top: 12px;
            @include flex(center);

            button {
                margin-left: 7px;
                font-size: 1.4rem;
                font-weight: 600;
                width: calc(30% - 7px);
            }
        }
        /* upload */
        &__upload {
            margin-top: 14px;
            width: 100%;
            
            svg {
                opacity: 0.3;
            }
            path {
                fill: rgba(var(--textColor1), 0.14);
            }
        }
        &__drop-area {
            background-color: rgba(var(--textColor1), 0.012);
            border: 1.5px dashed rgba(var(--textColor1), 0.08);
            border-radius: 10px;
            height: 200px;
            position: relative;
            transition: 0.2s ease-in-out;
            @include center;
            
            &--hover {
                background-color: rgba(var(--textColor1), 0.03);
                border: 1.5px dashed rgba(var(--textColor1), 0.2);
                box-shadow: rgba(#0C8CE9, 0.35) 0px 0px 0px 2px inset, 
                            rgba(#0C8CE9, 0.1) 0px 0px 0px 2.5px;
            }
        }
        &__drop-area-text {
            justify-content: center;
            text-align: center;
            margin-bottom: 13px;
            @include text-style(0.15, 500, 1.35rem);
            
            button {
                @include text-style(1, 500, 1.35rem);
                opacity: 0.4;
                margin-left: 5px;
                
                &:hover {
                    opacity: 0.8;
                    text-decoration: underline;
                }
            }
        }
        &__upload-btn {
            height: 47px;
            width: 47px;
            position: relative;
            @include abs-center;
            cursor: pointer;

            input {
                cursor: pointer;
                height: 100%;
                width: 100%;
                opacity: 0;
                z-index: 100;

                &::-webkit-file-upload-button {
                    visibility: hidden;
                }
            }
        }
        &__file {
            text-align: center;
            position: relative;
            margin-top: 15px;
            
            i {
                opacity: 0.35;
                margin-bottom: 8px;
                font-size: 1.6rem;
                @include abs-top-left(-20px, 50%);
            }
        }
        &__file-name {
            @include text-style(0.4, 500, 1.4rem);
        }
        &__file-size {
            @include text-style(0.2, 400, 1.3rem, "DM Mono");
            margin-top: 5px;
        }
        &__file-btns {
            margin-top: 15px;
        }
        &__file-btns button {
            @include text-style(1, 500, 1.35rem);
            opacity: 0.2;

            &:hover {
                opacity: 0.8;
            }
            &:disabled {
                opacity: 0.1;
            }
            &:first-child {
                margin-right: 12px;
            }
        }

        &__bottom {
            margin-top: 8px;
            @include flex(center, space-between);
            p {
                @include text-style(0.15, 500, 1.3rem);
            }
        }
    }
    .input-box {
        @include text-style(0.7, 500, 1.2rem);
        padding: 8px 10px 8px 12px;
        border-radius: 8px;
        width: calc(100% + 4px);
        margin-left: -4px;
    }
</style>