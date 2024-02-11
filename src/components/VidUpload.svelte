<script lang="ts">
	import { ModalType } from "$lib/enums";
	import { themeState } from "$lib/store";
    import { closeModal } from "$lib/utils-home";
	import { getYtMediaId } from "$lib/utils-youtube";
	import Modal from "./Modal.svelte";

    let errorMsg: string | null = null
    let ytMediaUrl = ""
    let isInputLoading = false
    let isYtMediaUrlValid = false
    let ytMedia: YoutubeMediaId | null = null


    const handleInput = () => {
        errorMsg = null
    }
    const inputSubmitBtn = async () => {
        errorMsg = null
        isInputLoading = true

        const res = await getYtMediaId(ytMediaUrl)
        if ('id' in res) {
            ytMedia = res
        }
        else {
            errorMsg = res.error
        }

        isInputLoading = false
    }


</script>

<Modal onClickOutSide={() => closeModal(ModalType.CustomVidBg)}>
    <div class={`custom-yt ${$themeState.isDarkTheme ? "" : "custom-yt--light"}`}>
        <h1 class="custom-yt__title modal-bg__content-title">Custom Background Video</h1>
        <p class="custom-yt__copy modal-bg__content-copy">
            High quality content with minimal visual noise are ideal.
        </p>
        <div class="custom-yt__content-container">
            <div class={`text-input-container ${errorMsg ? "text-input-container--error" : ""}`}>
                <input 
                    type="text" 
                    placeholder="Youtube video or playlist link here."
                    bind:value={ytMediaUrl}
                    on:input={handleInput}
                >
                {#if errorMsg}
                    <div class="text-input-container__error-msg">
                        {errorMsg }
                    </div>
                {/if}
            </div>
            <button 
                class="form-submit-btn" disabled={isInputLoading || ytMediaUrl === ""}
                on:click={inputSubmitBtn}
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
</Modal>

<style lang="scss">
    @import "../scss/form.scss";

    .custom-yt {
        padding: 18px 20px 30px 20px;
        width: 440px;

    
        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .text-input-container {
            @include input-text-field-light;
        }
        &--light &__copy {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.8);
        }

        &__copy {
            margin: 20px 0px 20px 0px;
            color: rgba(var(--textColor1), 0.35);
            font-size: 1.3rem;
            font-weight: 300;
        }
        &__content-container {
            @include flex(center, _);
            width: 100%;

            .text-input-container {
                width: 70%;
            }
            .form-submit-btn {
                margin-left: 8px;
                width: calc(30% - 8px);
            }
        }
    }
</style>