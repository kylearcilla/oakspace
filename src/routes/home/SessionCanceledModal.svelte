<script lang="ts">
	import { themeState } from "$lib/store";
	import Modal from "../../components/Modal.svelte";

    export let clearSession: () => void

</script>

<Modal onClickOutSide={() => console.log("my name jef")}>
    <div class={`canceled-session ${$themeState.isDarkTheme ? "" : "canceled-session--light"}`}>
        <h1 class="canceled-session__title">Session Canceled</h1>
        <p class="canceled-session__text">
            Session not logged due to cancellation.
        </p>
        <button class="canceled-session__ok-btn" on:click={() => clearSession()}>
            OK
        </button>
    </div>
</Modal>


<style lang="scss">
    .canceled-session {
        width: 275px;
        padding: 20px 20px 20px 20px;
        text-align: center;
        @include flex-container(center, center);
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