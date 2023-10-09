<script lang="ts">
    import Modal from "../../components/Modal.svelte"
	import { clickOutside } from "$lib/utils-general"
	import { sessionStore, themeState } from "$lib/store"
	import { onMount } from "svelte";

    export let closeModal: () => void

    let isDropdownOpen = false
    let isTagListDropDownOpen = false

    let sessionNameInput: HTMLElement

    const MAX_SESSION_NAME_LENGTH = 18

    let newTitle = ""
    let newTag = { name: "", color: "" }

    let tags = [
        {
            name: "school",
            color: "#9997FE"
        },
        {
            name: "swe",
            color: "#FF8B9C"
        },
        {
            name: "book",
            color: "#CFAB96"
        },
    ]

    const handleDropDownControlsListClicked = () => isDropdownOpen = !isDropdownOpen

    const handlePomOptionClicked = (optionIdx: number) => {
        if (optionIdx === 0) {
            newTag = $sessionStore!.tag
        }
        else if (optionIdx === 1) {
            $sessionStore!.isPlaying? $sessionStore!.pauseSession() : $sessionStore!.playSession()
        }
        else if (optionIdx === 2) {
            $sessionStore!.restartPeriod()
        }
        else if (optionIdx === 3) {
            $sessionStore!.skipToNextPeriod()
        }
        else if (optionIdx === 4) {
            $sessionStore!.cancelSession()
        }
        else {
            $sessionStore!.finishSession()
        }
        isDropdownOpen = false
    }

    const handleEditSessionDoneBtnClicked = () => {
        if (newTag.name != "") {
            $sessionStore!.editSesionTag(newTag)
            $sessionStore!.editSessionTitle(newTitle)
        }
        
        handleEditSessionCancelClicked()
    }
    const handleEditSessionCancelClicked = () => {
        closeModal()

        newTag = { 
            name: $sessionStore!.tag.name, 
            color: $sessionStore!.tag.color 
        }
    }
    const handleNewTagClicked = (idx: number) => {
        newTag = tags[idx]
        isTagListDropDownOpen = false
    }
    const handleCreateTagBtnClicked = () => {
        isTagListDropDownOpen = false
    }
    const editTextInputHandler = (event: Event) => {
        // todoToEditNewTitle = (event.target as HTMLInputElement).value
    }

    const handleSessionComponentClicked = (event: Event) => {
        const target = event.target as HTMLElement
        const className = target.classList.value
    }
</script>

<Modal options={{ overflow: "visible"}} onClickOutSide={closeModal}>
    <div class={`edit-session-modal ${$themeState.isDarkTheme ? "edit-session-modal--dark" : "edit-session-modal--light"}`}>
        <h1 class="modal-bg__content-title">Edit Active Session</h1>
        <h3 class="modal-bg__content-subheading">Title / Tag</h3>
        <!-- Name -->
        <div class="edit-session-modal__name-input" bind:this={sessionNameInput}>
            <input 
                spellcheck="false"
                type="text"
                placeholder="Afternoon Reading" 
                on:focus={() => sessionNameInput.classList.add("edit-session-modal__name-input--focus")}
                on:blur={() => sessionNameInput.classList.remove("edit-session-modal__name-input--focus")}
                on:input={editTextInputHandler}
                bind:value={newTitle}
            >
            <div class="edit-session-modal__name-input__divider"></div>
            <div class="edit-session-modal__name-input-tag-dropdown-container dropdown-container">
                <button class="edit-session-modal__name-input-tag-dropdown-btn dropdown-btn trans-btn" on:click={() => isTagListDropDownOpen = true }>
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
                                <button class="dropdown-element" on:click={() => handleNewTagClicked(idx)}>
                                    <div class="edit-session-modal__name-input-btn-tag dropdown-menu__option-icon" style={`background-color: ${tag.color}`}></div>
                                    <p>{tag.name}</p>
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            </li>
                        {/each}
                        <li class="dropdown-menu__new-option-container">
                            <div class="divider divider--thin"></div>
                            <button on:click={handleCreateTagBtnClicked}>
                                <span>+</span>New Tag
                            </button>
                        </li>
                    </ul>
                {/if}
            </div>
        </div>
        <div class="edit-session-modal__buttons-container">
            <button 
                disabled={newTitle === "" || newTitle.length >= MAX_SESSION_NAME_LENGTH} 
                class="edit-session-modal__done-btn fill-btn" 
                on:click={handleEditSessionDoneBtnClicked}>
                    Save Changes
            </button>
            <button 
                class="edit-session-modal__cancel-btn unfill unfill--gray" 
                on:click={handleEditSessionCancelClicked}>
                    Cancel
            </button>
        </div>
    </div>
</Modal>


<style lang="scss">
    @import "../../scss/dropdown.scss";

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
        &--dark .trans-btn {
            @include trans-btn-dark-styling;
        }
        /* Dark Themes Adjustments */
        &--dark .dropdown-menu {
            border: 1px solid rgba(60, 60, 60, 0.1);
            @include dropdown-menu-dark;
        }
        &--dark &__name-input {
            @include input-text-field-dark;

            &__divider {
                width: 0.5px;
            }
        }
        &--dark &__name-input-tag-dropdown-btn {
            @include dropdown-btn-dark;
        }

        h3 {
            margin: 20px 0px 10px 0px;
        }
        /* Name Input */
        &__name-input { 
            font-size: 1.32rem;
            padding: 0px 7px 0px 20px;
            height: 47px;
            border-radius: 10px;
            width: 100%;
            @include flex-container(center, _);
            transition: 0.2s ease-in-out;
            border: 1px solid rgba(211, 211, 211, 0);
            background-color: var(--modalBgAccentColor);
            
            &--focus {
                border-color: rgba(211, 211, 211, 0.5);
            }
            
            input {
                color: rgba(var(--textColor1), 0.5);
                transition: 0.14s ease-in-out;
                font-weight: 500;
                width: 70%;
                border-width: 0px;

                &::placeholder {
                    font-size: 1.4rem;
                    font-weight: 400;
                    opacity: 0.2;
                }
            }
            &__divider {
                width: 0.9px;
                height: 14px;
                margin: 0px 10px 0px 0px;
                background-color: rgba(var(--textColor1), 0.15);
            }
        }
        &__name-input-tag-dropdown-container {
            position: relative;
            .dropdown-menu {
                position: absolute;
                top: 40px;
                width: 100px;
                &__option {
                    p {
                        margin-left: 3px;
                    }
                    span {
                        margin-right: 3px;
                    }
                }
            }
        }
        &__name-input-tag-dropdown-btn {
            @include flex-container(center, _);
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