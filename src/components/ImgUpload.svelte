<script lang="ts">
	import { ModalType } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { getImgUploadErrorMsg, validateUserImgFileInput, validateUserImgURLInput } from "$lib/utils-media-upload"
    
	import Modal from "./Modal.svelte"

    export let constraints: ImgUploadConstraints | undefined
    export let title: string
    export let inputPlaceHolder: string = ""
    export let onSubmit: (imgSrc: string) => void

    let isImgUrlOptClicked = true
    let isInputLoading = false
    let errorMsg = ""
    let isInputFocus = false
    let imgUrl = ""
    let imgFileName = ""

    const _constraints = {
        maxMbSize: constraints?.maxMbSize ?? 5,
        ...constraints
    }

    async function onImgUrlSubmit() {
        try {
            if (!imgUrl) return
    
            isInputLoading = true
            await validateUserImgURLInput({
                url: imgUrl, constraints: _constraints
            })

            onSubmit(imgUrl)
            closeModal(ModalType.ImgUpload)
        }
        catch(e: any) {
            console.log(errorMsg)
            errorMsg = getImgUploadErrorMsg(e)
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
            errorMsg = getImgUploadErrorMsg(e)
        }
        finally {
            isInputLoading = false
        }
    }
    function highlightTabBtnClicked(isUrl: boolean) {
        isImgUrlOptClicked = isUrl
    } 
</script>

<Modal 
    onClickOutSide={() => closeModal(ModalType.ImgUpload)}
    options={{ borderRadius: "13px" }}
>
    <div 
        class="img-upload"
        class:img-upload--light={!$themeState.isDarkTheme}
    >
        <h1 class="img-upload__title modal-bg__content-title">
            {title}
        </h1>
        <div class="highlighter-tabs">
            <div class="highlighter-tabs__container">
                <button 
                    on:click={() => highlightTabBtnClicked(true)}
                    class="highlighter-tabs__tab-btn"
                    class:highlighter-tabs__tab-btn--selected={isImgUrlOptClicked}
                    disabled={!isImgUrlOptClicked && isInputLoading}
                >
                    Image url
                </button>
                <button 
                    on:click={() => highlightTabBtnClicked(false)}
                    class="highlighter-tabs__tab-btn"
                    class:highlighter-tabs__tab-btn--selected={!isImgUrlOptClicked}
                    disabled={isImgUrlOptClicked && isInputLoading}
                >
                    File Input
                </button>
            </div>
            <div class="settings-tabs__divider highlighter-tabs__divider"></div>
            <div 
                class={`highlighter-tabs__highlighter highlighter-tabs__highlighter--${isImgUrlOptClicked ? "url" : "upload"}`}
            >
            </div>
        </div>
        {#if isImgUrlOptClicked}
            <!-- Image Url -->
            <div class="img-upload__img-url">
                <p class="img-upload__copy">
                    Copy and paste an image link from the web.
                </p>
                <div class="img-upload__url-img-content">
                    <div 
                        class="input-box input-box--border"
                        class:input-box--border-focus={isInputFocus}
                        class:input-box--error={errorMsg}
                    >
                        <input 
                            type="text" 
                            placeholder="IMG / GIF url goes here..."
                            bind:value={imgUrl}
                            on:input={() => errorMsg = ""}
                            on:focus={() => isInputFocus = true}
                            on:blur={() => isInputFocus = false}
                        >
                    </div>
                    <button 
                        class="form-submit-btn" 
                        disabled={isInputLoading || imgUrl === ""}
                        on:click={onImgUrlSubmit}
                    >
                        {#if isInputLoading}
                            <div class="form-submit-btn__loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        {:else}
                            Submit
                        {/if}
                    </button>
                </div>
                <div 
                    class="input-box-error-text"
                    class:hidden={!errorMsg}
                >
                    {errorMsg ?? ""}
                </div>
            </div>
        {:else}
            <!-- File Input -->
            <div class="img-upload__file-input">
                <p class="img-upload__copy">
                    Upload an image from your device.
                </p>
                <div class="img-upload__file-input-content">
                    <div 
                        class="img-upload__file-input-name-container input-box input-box--border"
                        class:input-box--error={errorMsg}
                    >
                        <span 
                            class="img-upload__file-input-name"
                            class:img-upload__file-input-name--no-name={imgFileName}
                        >
                            {imgFileName ? imgFileName : "Click the button to upload."}
                        </span>
                        {#if errorMsg}
                            <div class="text-input-container__error-msg">
                                {errorMsg ?? ""}
                            </div>
                        {/if}
                    </div>
                    <div class="img-upload__file-input-content-btns">
                        <div 
                            class="img-upload__file-input-btn form-submit-btn"
                        >
                            <input 
                                type="file" 
                                id="imageInput" 
                                accept="image/*" 
                                title={imgFileName === "" ? "Upload image from your computer." : "Replace uploaded image."}
                                on:input={onImgUploaded}
                            >
                            <i class="fa-solid fa-file-arrow-up"></i>
                        </div>
                        {#if !errorMsg && imgFileName}
                            <button class="form-submit-btn">
                                {#if isInputLoading}
                                    <div class="form-submit-btn__loading-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                {:else}
                                    Submit
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
        <p class="img-upload__bottom-msg">Max image size is capped to 5 MB.</p>
    </div>
</Modal>

<style lang="scss">
    @import "../scss/highlighter-tabs.scss";
    @import "../scss/inputs.scss";

    .img-upload {
        position: relative;
        width: 420px;
        padding: 20px 28px 28px 28px;

        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .text-input-container {
            // @include input-text-field-light;
        }
        &--light .highlighter-tabs {
            @include highlighter-tabs-light-mode;
        }
        &--light &__copy {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.8);
        }
        &--light &__file-input-name {
            font-weight: 500;
            opacity: 0.4;
        }

        &__title {
            @include text-style(1, 500, 1.55rem);
        }
        &__copy {
            @include text-style(0.35, 400, 1.35rem);
            margin: 15px 0px 30px 0px;
        }
        /* Url Input */
        &__url-img-content {
            @include flex(center);
            height: 47px;

            button {
                margin-left: 7px;
                width: calc(30% - 7px);
            }
        }
        /* File Input */
        &__file-input-content {
            @include flex(center);
            margin-top: 27px;
            height: 47px;
            width: 100%;
        }
        &__file-input-name-container {
            flex: 1;
            min-width: 0px;
        }
        &__file-input-name {
            opacity: 0.2;
            margin-bottom: 2px;
            @include text-style(0.5, 500, 1.4rem);
            @include elipses-overflow;
            
            &--no-name {
                opacity: 0.03;
            }
        }
        &__file-input-content-btns {
            @include flex(center, flex-end);
            margin-left: 6px;
            height: 100%;
            min-width: 0px;

            button {
                height: 100%;
                padding: 0px 17px;
                margin-left: 6px;
            }
        }
        &__file-input-btn {
            height: 47px;
            width: 47px;
            position: relative;
            cursor: pointer;

            input {
                cursor: pointer;
                height: 100%;
                width: 100%;
                @include abs-center;
                opacity: 0;
                z-index: 100;

                &::-webkit-file-upload-button {
                    visibility: hidden;
                }
            }
            i {
                z-index: 40;
                @include abs-center;
            }
        }
        &__bottom-msg {
            @include abs-bottom-right(20px, 20px);
            color: rgba(var(--textColor1), 0.15);
            font-size: 1.3rem;
            font-weight: 300;
            display: none;
        }
    }
    .highlighter-tabs {
        margin-top: 14px;
        &--url {
            width: 85px;
            left: 0px;
        }
        &--upload {
            width: 94px;
            left: 98px;
        }

        &__highlighter {
            &--url {
                width: 55px;
                left: 0px;
            }
            &--upload {
                left: 72px;
                width: 60px;
            }
        }
    }
    .input-box {
        height: calc(100% - 2px);
    }
    .img-upload .input-box {
        width: 70%;
    }
</style>