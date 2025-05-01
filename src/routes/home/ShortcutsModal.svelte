<script lang="ts">
	import { themeState } from "$lib/store"
    
    import { ModalType } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { SHORT_CUTS } from "$lib/data-general"

	import Modal from "$components/Modal.svelte"
    import Hotkeys from "$components/Hotkeys.svelte"

    $: light = !$themeState.isDarkTheme

    const exitModal = () => closeModal(ModalType.Shortcuts)
</script>

<Modal  
    options={{ borderRadius: "15px", scaleUp: true }} 
    onClickOutSide={() => closeModal(ModalType.Shortcuts)}
>
    <div 
        class="shortcuts"
        class:shortcuts--light={light}
    >
        <div class="shortcuts__title">
            <div style:margin-left="20px">
                Keyboard Shortcuts
            </div>
        </div>
        <ul class="shortcuts__section-list">
            {#each SHORT_CUTS.sections as section}
                <li>
                    {#if section.title !== "General"}
                        <h2 class="shortcuts__subtitle">{section.title}</h2>
                    {/if}
                    <ul class="shortcuts__list">
                        {#each section.shortcuts as shortcut}
                            <li class="shortcuts__shortcut">
                                <div class="shortcuts__shortcut-title">
                                    {shortcut.title}
                                </div>
                                <Hotkeys hotkeys={shortcut.controls} type="boxed" />
                            </li>
                        {/each}
                    </ul>
                </li>
            {/each}
        </ul>
    </div>
</Modal>


<style lang="scss">
    .shortcuts {
        padding: 15px 0px 0px 0px;

        &--light &__shortcut-title {
            @include text-style(1);
        }

        &__section-list {
            overflow-y: scroll;
            height: 500px;
            padding-bottom: 20px;
        }
        &__title {
            @include text-style(1, var(--fw-400-500), 1.5rem);
            border-bottom: var(--divider-border);
            margin-bottom: 4px;
            padding-bottom: 14px;
        }
        &__subtitle {
            @include text-style(0.9, var(--fw-400-500), 1.4rem);
            margin-bottom: 5px;
            padding: 0px 20px;
            border-top: var(--divider-border);
            padding-top: 10px;
        }
        &__list {
            margin-bottom: 13px;  
            padding: 0px 20px;
        }
        &__shortcut {
            height: 30px;
            @include flex(center, space-between);
        }
        &__divider {
            border-bottom: var(--divider-border);
            margin: 8px 0px 8px 0px;
        }
        &__shortcut-title {
            @include text-style(0.5, var(--fw-400-500), 1.35rem);
            margin-right: 50px;
        }
    }
</style>