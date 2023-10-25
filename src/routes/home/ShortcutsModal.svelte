<script lang="ts">
	import { SHORT_CUTS } from "$lib/data-general";
	import { ModalType } from "$lib/enums";
	import { themeState } from "$lib/store";
	import { closeModal } from "$lib/utils-home";
	import Modal from "../../components/Modal.svelte";


    const exitModal = () => closeModal(ModalType.Shortcuts)
</script>


<Modal options={{ borderRadius: "22px" }} onClickOutSide={exitModal}>
    <div class={`shortcuts ${$themeState.isDarkTheme ? "" : "shortcuts--light"}`}>
        <h1 class="shortcuts__title">
            Keyboard Shortcuts
        </h1>
        <h2 class="shortcuts__subtitle">General</h2>
        <ul class="shortcuts__list">
            {#each SHORT_CUTS.general as shortcut}
                <li class="shortcuts__shortcut">
                    <div class="shortcuts__shortcut-title">
                        {shortcut.title}
                    </div>
                    <div class="shortcuts__shortcut-keys-container">
                        {#each shortcut.controls as control}
                            <div class={`shortcuts__key ${control.length === 1 ? "shortcuts__key--square" : ""}`}>
                                {control}
                            </div>
                        {/each}
                    </div>
                </li>
            {/each}
        </ul>
        <h2 class="shortcuts__subtitle">Pomodoro</h2>
        <ul class="shortcuts__list">
            {#each SHORT_CUTS.pomodoro as shortcut}
                <li class="shortcuts__shortcut">
                    <div class="shortcuts__shortcut-title">
                        {shortcut.title}
                    </div>
                    <div class="shortcuts__shortcut-keys-container">
                        {#each shortcut.controls as control}
                            <div class={`shortcuts__key ${control.length === 1 ? "shortcuts__key--square" : ""}`}>
                                {control}
                            </div>
                        {/each}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</Modal>


<style lang="scss">
    .shortcuts {
        padding: 17px 27px 22px 27px;
        width: 310px;

        &--light &__subtitle {
            font-weight: 500;
        }
        &--light &__shortcut-title {
            font-weight: 500;
            color: rgba(var(--textColor1), 0.5);
        }
        &--light &__key {
            color: rgba(var(--textColor1), 0.65);
            font-weight: 500;
            background-color: rgba(0, 0, 0, 0.03);
        }

        &__title {
            text-align: center;
            margin-bottom: 20px;
            font-size: 1.8rem;
            font-weight: 500;
        }
        &__subtitle {
            font-size: 1.4rem;
            font-weight: 400;
            margin-bottom: 5px;
        }
        &__list {
            &:first-of-type {
                margin-bottom: 25px;  
            }
        }
        &__shortcut {
            height: 30px;
            @include flex-container(center, space-between);
            
            &-title {
                font-size: 1.25rem;
                font-weight: 300;
                color: rgba(var(--textColor1), 0.5)
            }
            &-keys-container {
                @include flex-container(center, center);
            }
        }
        &__key {
            @include flex-container(center, center);
            margin-left: 4px;
            background-color: rgba(255, 255, 255, 0.03);
            padding: 5.5px 11px;
            border-radius: 9px;

            &--square {
                width: 24px;
                height: 24px;
                padding: 0px;
            }
        }
    }
</style>