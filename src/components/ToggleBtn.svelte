<script lang="ts">
    export let active: boolean
    export let onToggle: () => void
</script>

<button 
    class="toggle"
    class:toggle--active={active}
    on:click={onToggle}
>
    <div class="toggle__circle smooth-bounce">
    </div>
</button>

<style lang="scss">
    .toggle {
        background-color: rgba(var(--textColor1), 0.06);
        height: 17px;
        width: 28px;
        border-radius: 20px;
        position: relative;

        &--active {
            background-color: #53B2E8;
        }
        &--active &__circle {
            left: calc(100% - (12px + 3px));
        }

        &__circle {
            transition: 0.1s ease-in-out;
            @include circle(12px);
            position: absolute;
            top: 2.5px;
            left: 3px;
            background-color: white;
        }
    }
</style>