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
        <ul class="shortcuts__section-list">
            <li>
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
            </li>
            <li>
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
            </li>
            <li>
            <h2 class="shortcuts__subtitle">Tasks</h2>
                <ul class="shortcuts__list">
                    {#each SHORT_CUTS.tasks as shortcut}
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
            </li>
        </ul>
    </div>
</Modal>


<style lang="scss">
    .shortcuts {
        padding: 17px 0px 0px 27px;
        width: 350px;

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

        &__section-list {
            overflow-y: scroll;
            height: 500px;
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
            margin-bottom: 18px;  
            padding-right: 27px;
        }
        &__shortcut {
            height: 30px;
            @include flex(center, space-between);
            
            &-title {
                font-size: 1.25rem;
                font-weight: 300;
                color: rgba(var(--textColor1), 0.5)
            }
            &-keys-container {
                @include flex(center, center);
            }
        }
        &__key {
            @include flex(center, center);
            margin-left: 4px;
            background-color: rgba(255, 255, 255, 0.03);
            padding: 5.5px 11px;
            border-radius: 9px;
            font-size: 1.05rem;

            &--square {
                width: 24px;
                height: 24px;
                padding: 0px;
            }
        }
    }
</style>