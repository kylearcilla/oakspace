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
        height: 18px;
        width: 30px;
        border-radius: 20px;
        position: relative;

        &--active {
            background-color: var(--elemColor2);
        }
        &--active &__circle {
            left: calc(100% - (12px + 3.5px));
        }

        &__circle {
            transition: 0.1s ease-in-out;
            @include circle(13.5px);
            position: absolute;
            top: 2px;
            left: 2.5px;
            background-color: white;
        }
    }
</style>