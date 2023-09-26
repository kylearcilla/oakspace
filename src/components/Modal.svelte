<script lang="ts">
	import { clickOutside } from "$lib/utils-general";

    enum SettingsModal { Settings, Youtube, Music, Stats, Appearance }

    export let onNavButtonClicked: (modal: SettingsModal | null) => void
    export let isModalSmall: boolean
</script>

<div class="modal-bg">
    <div 
        use:clickOutside on:click_outside={() => onNavButtonClicked(null)} 
        class={`modal-bg__content modal-bg__content--overflow-y-scroll ${isModalSmall != null ? "" : "modal-bg__content--small"}`}
    >
        <slot></slot>
    </div>
</div>

<style lang="scss">
    .modal {
        &--content {
            overflow: hidden;
        } 
    }
    .modal-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        
        &__content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            overflow: hidden;
            padding: 20px 25px 25px 25px;
            border-radius: 20px;
            background-color: var(--modalBgColor);
            color: rgb(var(--textColor1));
            
            &--no-padding {
                padding: 0px;
            }
            &--overflow-show {
                overflow: visible;
            }
            &--overflow-y-scroll {
                overflow-y: scroll;
            }
            &--small {
                border-radius: 8px;
                padding: 15px 20px 15px 20px;
            }
            &--med {
                border-radius: 8px;
                padding: 19px 25px 25px 25px;
            }

        }
        &__content-copy {
            color: rgba(var(--textColor1), 0.7);
            margin-bottom: 20px;
        }
        &__content-title {
            font-size: 1.9rem;
            margin-bottom: 10px;
        }

        &--hidden {
            display: none;
        }
}
</style>