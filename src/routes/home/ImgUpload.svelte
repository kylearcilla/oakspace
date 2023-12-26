<script lang="ts">
	import { ModalType } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { closeModal } from "$lib/utils-home"
	import { handleCustomImgFileInput, handleCustomImgUrlInput } from "$lib/utils-appearance"
    
	import Modal from "../../components/Modal.svelte"

    export let title: string
    export let inputPlaceHolder: string 
    export let onSubmit: (imgSrc: string) => void

    let isImgUrlOptClicked = true
    let isInputLoading = false
    let urlInputHasError = false
    let errorMsg: string | null = null
    let imgFileInputHasError = false
    let imgUrl = ""
    let imgFileName = ""

    const onImgUrlSubmit = async () => {
        if (!imgUrl) return

        isInputLoading = true
        const res = await handleCustomImgUrlInput(imgUrl)
        isInputLoading = false

        if (res.sucess) {
            urlInputHasError = false
            isInputLoading = false
            errorMsg = null

            onSubmit(imgUrl)
            closeModal(ModalType.ImgUpload)
        }
        else {
            urlInputHasError = true
            errorMsg = res.message! 
        }
    }
    const handleImgUrlInput = () => {
        urlInputHasError = false
        errorMsg = null
    }
    const onUserSubmitUrlImg = () => {

    }

    const onImgUploaded = (event: Event) => {
        const input = event.target as HTMLInputElement
        const file = input.files![0]

        imgFileName = file.name
        const res = handleCustomImgFileInput(file)

        if (res.sucess) {
            imgFileInputHasError = false
            isInputLoading = false
            errorMsg = null
        }
        else {
            imgFileInputHasError = true
            errorMsg = res.message!
        }
    }
    const onUserSubmitUploadImg = () => {
        if (!imgFileName || imgFileInputHasError) return

    }

    const highlightTabBtnClicked = (isUrl: boolean) => {
        isImgUrlOptClicked = isUrl
    }
</script>

<Modal onClickOutSide={() => closeModal(ModalType.ImgUpload)}>
    <div class={`img-upload ${$themeState.isDarkTheme ? "" : "img-upload--light"}`}>
        <h1 class="img-upload__title modal-bg__content-title">{title}</h1>
        <div class="highlighter-tabs">
            <div class="highlighter-tabs__container">
                <button 
                    on:click={() => highlightTabBtnClicked(true)}
                    class={`highlighter-tabs__tab-btn ${isImgUrlOptClicked ? "highlighter-tabs__tab-btn--selected" : ""}`}
                    disabled={!isImgUrlOptClicked && isInputLoading}
                >
                    Image url
                </button>
                <button 
                    on:click={() => highlightTabBtnClicked(false)}
                    class={`highlighter-tabs__tab-btn ${!isImgUrlOptClicked ? "highlighter-tabs__tab-btn--selected" : ""}`}
                    disabled={isImgUrlOptClicked && isInputLoading}
                >
                    File Input
                </button>
            </div>
            <div class="settings-tabs__divider highlighter-tabs__divider"></div>
            <div class={`highlighter-tabs__highlighter highlighter-tabs__highlighter--${isImgUrlOptClicked ? "url" : "upload"}`}></div>
        </div>
        {#if isImgUrlOptClicked}
            <!-- Image Url -->
            <div class="img-upload__img-url">
                <p class="img-upload__copy">
                    Copy and paste an image link from the web.
                </p>
                <div class="img-upload__url-img-content">
                    <div class={`text-input-container ${urlInputHasError ? "text-input-container--error" : ""}`}>
                        <input 
                            type="text" 
                            placeholder={inputPlaceHolder}
                            bind:value={imgUrl}
                            on:input={handleImgUrlInput}
                        >
                        {#if urlInputHasError}
                            <div class="text-input-container__error-msg">
                                {errorMsg ?? ""}
                            </div>
                        {/if}
                    </div>
                    <button 
                        class="form-submit-btn" disabled={isInputLoading || imgUrl === ""}
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
            </div>
        {:else}
            <!-- File Input -->
            <div class="img-upload__file-input">
                <p class="img-upload__copy">
                    Upload an image from your device.
                </p>
                <div class="img-upload__file-input-content">
                    <div class={`img-upload__file-input-name-container text-input-container ${imgFileInputHasError ? "text-input-container--error" : ""}`}>
                        <span class={`img-upload__file-input-name ${imgFileName ? "" : "img-upload__file-input-name--no-name"}`}>
                            {imgFileName ? imgFileName : "No Image Yet"}
                        </span>
                        {#if imgFileInputHasError}
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
                                type="file" id="imageInput" accept="image/*" 
                                on:input={onImgUploaded}
                                title={imgFileName === "" ? "Upload image from your computer." : "Replace uploaded image."}
                            >
                            <i class="fa-solid fa-file-arrow-up"></i>
                        </div>
                        {#if !imgFileInputHasError && imgFileName}
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
    @import "../../scss/highlighter-tabs.scss";
    @import "../../scss/form.scss";

    .img-upload {
        position: relative;
        height: 240px;
        width: 420px;
        padding: 18px 25px 18px 25px;

        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .text-input-container {
            @include input-text-field-light;
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

        &__copy {
            color: rgba(var(--textColor1), 0.35);
            font-size: 1.3rem;
            font-weight: 300;
            margin-bottom: 22px;
        }
        /* Url Input */
        &__url-img-content {
            @include flex-container(center, _);
            button {
                margin-left: 7px;
                width: calc(30% - 7px);
            }
        }
        /* File Input */
        &__file-input-content {
            margin-top: 27px;
            @include flex-container(center, _);
            height: 40px;
            width: 100%;
        }
        &__file-input-name-container {
            flex: 1;
            padding-left: 12px;
            min-width: 0px;
        }
        &__file-input-name {
            font-size: 1.4rem;
            font-weight: 400;
            opacity: 0.2;
            @include elipses-overflow;
            
            &--no-name {
                opacity: 0.03;
            }
        }
        &__file-input-content-btns {
            @include flex-container(center, flex-end);
            margin-left: 5px;
            height: 100%;
            min-width: 0px;

            button {
                height: 100%;
                padding: 0px 17px;
                margin-left: 6px;
            }
        }
        &__file-input-btn {
            height: 40px;
            width: 40px;
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
            @include pos-abs-bottom-right-corner(20px, 20px);
            color: rgba(var(--textColor1), 0.15);
            font-size: 1.3rem;
            font-weight: 300;
            display: none;
        }
    }
    .img-upload .highlighter-tabs {
        margin: 23px 0px 20px 0px;
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
    .img-upload .text-input-container {
        width: 70%;
        input::placeholder {
            opacity: 0.1;
        }
    }
</style>