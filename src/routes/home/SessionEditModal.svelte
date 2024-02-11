<script lang="ts">
    import Modal from "../../components/Modal.svelte"
	import { closeModal } from "$lib/utils-home"
	import { clickOutside } from "$lib/utils-general"
	import { sessionManager, sessionStore, themeState } from "$lib/store"
	import { MAX_SESSION_NAME_LENGTH } from "$lib/utils-session"
    
	import { ModalType } from "$lib/enums"

    let tags = [ { name: "Korean", color: "#9997FE" }, { name: "swe", color: "#FF8B9C" } ]
    
    let isTagListDropDownOpen = false
    let sessionNameInput: HTMLElement
    
    let newTitle = $sessionStore!.name
    let newTag = {  name: $sessionStore!.tag.name,  color: $sessionStore!.tag.color }
    
    function exitEditModal() {
        $sessionManager?.toggleEditSessionModal(false)
        closeModal(ModalType.EditSession)
    }
    function editSessionDoneBtnClicked(e: Event) {
        e.preventDefault()
        if (newTitle === "" || newTitle.length > MAX_SESSION_NAME_LENGTH) return

        $sessionStore!.editSesionTag(newTag)
        $sessionStore!.editSessionTitle(newTitle)
        editSessionCancelBtnClicked()
    }
    function editSessionCancelBtnClicked() {
        exitEditModal()
        newTag = {  name: $sessionStore!.tag.name,  color: $sessionStore!.tag.color  }
    }
    function handleNewTagClicked(idx: number) {
        newTag = tags[idx]
        isTagListDropDownOpen = false
    }
    function handleCreateTagBtnClicked() {
        isTagListDropDownOpen = false
    }
</script>

<Modal options={{ overflow: "visible", overflowY: "inherit" }} onClickOutSide={exitEditModal}>
    <div class={`edit-session-modal ${$themeState.isDarkTheme ? "edit-session-modal--dark" : "edit-session-modal--light"}`}>
        <h1 class="modal-bg__content-title">Edit Active Session</h1>
        <form on:submit={editSessionDoneBtnClicked} autocomplete="off">
            <!-- Name -->
            <label for="new-session-name-input" class="modal-bg__content-subheading">Title / Tag</label>
            <div class="edit-session-modal__name-input">
                <div class="edit-session-modal__name-input-container text-input-container" bind:this={sessionNameInput}>
                    <input 
                        name="new-session-name"
                        id="new-session-name-input"
                        spellcheck="false"
                        type="text"
                        placeholder="Afternoon Reading" 
                        on:focus={() => sessionNameInput.classList.add("text-input-container--focus")}
                        on:blur={() => sessionNameInput.classList.remove("text-input-container--focus")}
                        bind:value={newTitle}
                    >
                    <div class="edit-session-modal__name-input-divider"></div>
                    <div class="edit-session-modal__name-input-tag-dropdown-container dropdown-container">
                        <button 
                            class="edit-session-modal__name-input-tag-dropdown-btn dropdown-btn trans-btn" on:click={() => isTagListDropDownOpen = !isTagListDropDownOpen }
                            type="button"
                        >
                            <div class="edit-session-modal__name-input-btn-tag" style={`background-color: ${newTag.color}`}></div>
                            <div class="dropdown-btn__title">
                                {newTag.name}
                            </div>
                            <div class="dropdown-btn__arrows">
                                <div class="dropdown-btn__arrows-triangle-up">
                                    <i class="fa-solid fa-chevron-up"></i>
                                </div>
                                <div class="dropdown-btn__arrows-triangle-down">
                                    <i class="fa-solid fa-chevron-down"></i>
                                </div>
                            </div>
                        </button>
                        {#if isTagListDropDownOpen}
                        <ul use:clickOutside on:click_outside={() => isTagListDropDownOpen = false} class="dropdown-menu">
                            {#each tags as tag, idx} 
                                <li class={`dropdown-menu__option ${tag.name === newTag.name ? "dropdown-menu__option--selected" : ""}`}>
                                    <button class="dropdown-element" type="button" on:click={() => handleNewTagClicked(idx)}>
                                        <div class="dropdown-menu__option-icon">
                                            <div 
                                                class="new-session-modal__name-input-tag-option-circle"
                                                style={`background-color: ${tag.color}`}
                                            >
                                            </div>
                                        </div>
                                        <span class="dropdown-menu__option-text">
                                            {tag.name}
                                        </span>
                                        {#if tag.name === newTag.name}
                                            <div class="dropdown-menu__option-icon">
                                                <i class="fa-solid fa-check"></i>
                                            </div>
                                        {/if}
                                    </button>
                                </li>
                            {/each}
                            <div class="dropdown-menu__divider"></div>
                            <li class="dropdown-menu__option">
                                <button on:click={handleCreateTagBtnClicked}>
                                    <div class="dropdown-menu__option-icon">
                                        <span class="new-session-modal__name-input-new-tag-option-icon">+</span>
                                    </div>
                                    <span class="dropdown-menu__option-text">
                                        New Tag
                                    </span>
                                </button>
                            </li>
                        </ul>
                    {/if}
                    </div>
                </div>
            </div>
            <div class="edit-session-modal__buttons-container">
                <button 
                    disabled={newTitle === "" || newTitle.length >= MAX_SESSION_NAME_LENGTH} 
                    class="edit-session-modal__done-btn fill-btn" 
                    type="submit"
                >
                        Save Changes
                </button>
                <button 
                    class="edit-session-modal__cancel-btn unfill unfill--gray" 
                    on:click={editSessionCancelBtnClicked}
                >
                        Cancel
                </button>
            </div>
        </form>
    </div>
</Modal>


<style lang="scss">
    @import "../../scss/dropdown.scss";
    @import "../../scss/form.scss";

    /* Edit Active Session Modal */
    .edit-session-modal {
        background-color: var(--modalBgColor);
        width: 350px;
        padding: 15px 18px;
        overflow: visible;
        border-radius: 15px;

        /* Btn Styling */
        .fill-btn {
            @include color-btn-styling;
        }
        .trans-btn {
            @include trans-btn-light-styling;
        }
        .unfill {
            @include unfill-btn-ficus-styling(var(--fgColor1));
        }
        .unfill--gray {
            @include unfill-btn-ficus-styling(var(--textColor1));
        }

        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .text-input-container {
            @include input-text-field-light;
        }
        &--dark .trans-btn {
            @include trans-btn-dark-styling;
        }
        /* Dark Themes Adjustments */
        &--dark label {
            font-weight: 400;
            color: rgba(var(--textColor1), 0.55);
        }
        &--dark .dropdown-menu {
            border: 1px solid rgba(60, 60, 60, 0.1);
            @include dropdown-menu-dark;
        }
        &--dark &__name-input-tag-dropdown-btn {
            @include dropdown-btn-dark;
        }

        label {
            margin: 20px 0px 10px 0px;
            display: inline-block;
        }
        /* Name Input */
        &__name-input { 
            width: 100%;
            &__divider {
                width: 0.5px;
            }
            &-divider {
                width: 0.9px;
                height: 14px;
                margin: 0px 10px 0px 0px;
                background-color: rgba(var(--textColor1), 0.15);
            }
        }
        &__name-input-container {
            width: 100%;
            height: 47px;
            margin-top: 6px;

            input {
                width: 65%;
            }
        }
        &__name-input-tag-dropdown-container {
            position: relative;
            .dropdown-menu {
                position: absolute;
                top: 40px;
                width: 100px;
            }
        }
        &__name-input-tag-dropdown-btn {
            @include flex(center, _);
            background: none;
            box-shadow: none;
            padding: 10px 11px 10px 10px;
            border-radius: 10px;
        }
        &__name-input-btn-tag {
            @include circle(8px);
            margin-right: 7px;
        }
        &__buttons-container {
            width: 250px;
            margin-top: 50px;
            display: flex;
            width: 100%;

            button {
                @include center;
                border-radius: 9px;
                height: 40px;
                font-size: 1.3rem;
                transition: 0.12s ease-in-out;

                &:active {
                    transform: scale(0.99);
                }
            }
        }
        &__done-btn {
            width: 70%;
            background-color: rgba(var(--fgColor1), 1);
            color: var(--modalBgColor);
            margin-right: 5px;
        }
        &__cancel-btn {
            width: 30%;
            background-color: transparent;
        }
    }
</style>