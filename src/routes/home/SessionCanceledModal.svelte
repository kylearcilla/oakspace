<script lang="ts">
	import { closeModal } from "$lib/utils-home"
	import { ModalType, SessionState } from "$lib/enums"
	import { sessionStore, themeState } from "$lib/store"
    
	import { onMount } from "svelte"
	import Modal from "../../components/Modal.svelte"

    let title = ""
    let text = ""

    function exitModal() {
        $sessionStore!.clearSession()
        closeModal(ModalType.SessionCanceled)
    }
    function keyboardShortcutHandler(event: KeyboardEvent) {
        if (event.key !== "Enter" && event.key !== "Escape") return
        exitModal()
    }

    onMount(() => {
        if ($sessionStore!.state === SessionState.CANCELED) {
            title = "Session Canceled"
            text = " Session not logged due to cancellation."
        }
        else if ($sessionStore!.state === SessionState.TOOK_TOO_LONG) {
            title = "Session Terminated"
            text = " Session canceled since you took too long."
        }
    })

</script>

<svelte:window on:keyup={(event) => keyboardShortcutHandler(event)} />

<Modal onClickOutSide={() => {}}>
    <div class={`canceled-session ${$themeState.isDarkTheme ? "" : "canceled-session--light"}`}>
        <h1 class="canceled-session__title">{title}</h1>
        <p class="canceled-session__text">
            {text}
        </p>
        <button class="canceled-session__ok-btn" on:click={() => exitModal()}>
            OK
        </button>
    </div>
</Modal>


<style lang="scss">
    .canceled-session {
        width: 275px;
        padding: 20px 20px 20px 20px;
        text-align: center;
        @include flex(center, center);
        flex-direction: column;

        &--light &__title {
            font-weight: 600;
        }
        &--light &__text {
            font-weight: 500;
        }

        &__title {
            margin-bottom: 14px;
            font-size: 1.65rem;
            font-weight: 500;
        }
        &__text {
            font-size: 1.3rem;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.5);
            margin-bottom: 10px;
        }
        &__ok-btn {
            margin-top: 10px;
            width: 65%;
            height: 32px;
            background-color: rgba(var(--fgColor1));
            color: var(--modalBgColor);
            border-radius: 7px;
            font-size: 1.1rem;
            transition: 0.12s ease-in-out;

            &:hover {
                filter: brightness(1.05);
            }
            &:focus {
                filter: brightness(1.09);
            }
            &:active {
                filter: brightness(1.05);
            }
        }
    }
</style>