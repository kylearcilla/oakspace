<script lang="ts">
	import { themeState } from "$lib/store";
	import Modal from "../../components/Modal.svelte";
</script>

<Modal onClickOutSide={() => console.log("my name jef")}>
    <div class={`session-finished ${$themeState.isDarkTheme ? "" : "session-finished--light"}`}>
        <div class="session-finished__img-container">
            <img src="https://media.tenor.com/BcUevwfD6zUAAAAC/the-wind-rises-writing.gif" alt="session-result">
        </div>
        <div class="session-finished__text">
            <h2 class="session-finished__text-title">
                Session Finished 👏
            </h2>
            <p class="session-finished__text-message">
                Holy guacamole you're insane! Great work!
            </p>
        </div>
        <div class="session-finished__result">
            <div class="session-finished__result-title">Calculated Time</div>
            <div class="session-finished__result-time">4:30 PM - 8:30 PM</div>
            <div class="session-finished__result-elapsed">{"(3h)"}</div>
        </div>
        <div class="session-finished__result">
            <div class="session-finished__result-title">Yout Time</div>
            <div class="session-finished__result-time">4:30 PM - 8:34 PM</div>
            <div class="session-finished__result-elapsed">{"(3h 5m)"}</div>
        </div>
        <div class="session-finished__score">
            <span>Score:</span> 90 🥈
        </div>
        <button class="session-finished__ok-btn">
            OK
        </button>
    </div>
</Modal>

<style lang="scss">
    .session-finished {
        width: 360px;
        padding: 30px 15px 22px 15px;
        text-align: center;
        @include flex-container(center, center);
        flex-direction: column;

        &__img-container {
            margin-bottom: 20px;
            object-fit: cover;
            width: 100%;

            img {
                width: 80%;
            }
        }
        &__text {
            text-align: center;
            margin-bottom: 12px;
        }
        &__text-title {
            font-size: 1.65rem;
            margin-bottom: 9px;
            font-weight: 500;
        }
        &__text-message {
            font-size: 1.3rem;
            margin-bottom: 20px;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.3);
        }
        &__result {
            width: 95%;
            display: flex;
            font-size: 1.35rem;
            margin-bottom: 4px;
        }
        &__result-title {
            width: 35%;
            text-align: left;
            margin-left: 5px;
        }
        &__result-time {
            width: 45%;
            white-space: nowrap;
            color: rgba(var(--textColor1), 0.55);
            font-weight: 300;
        }
        &__result-elapsed {
            text-align: left;
            width: 10%;
            white-space: nowrap;
            color: rgba(var(--textColor1), 0.3);
            font-weight: 300;
        }
        &__score {
            margin-top: 30px;
            text-align: center;
            font-size: 1.4rem;
            color: rgba(var(--textColor1), 0.7);

            span {
                color: rgba(var(--textColor1), 1);
                margin-right: 8px;
            }
        }
        &__ok-btn {
            margin-top: 40px;
            width: 65%;
            height: 37px;
            background-color: rgba(var(--fgColor1));
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