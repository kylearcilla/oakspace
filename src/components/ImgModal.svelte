<script lang="ts">
	import Modal from "$components/Modal.svelte"

    export let onClickOutside: () => void
    export let img: { src: string, caption?: string }
</script>

<Modal 
    options={{ 
        borderRadius: "0px",
        scaleUp: true,
        overflowY: "visible",
        overflowX: "visible"
    }} 
    onClickOutSide={() => onClickOutside()}
>
    <div class="highlight-img">
        <img src={img.src} alt="icon">

        {#if img.caption !== undefined}
            <div class="highlight-img__caption">
                <span>
                    {img.caption}
                </span>
            </div>
        {/if}
    </div>
</Modal>

<style lang="scss">
    .highlight-img {
        position: relative;
        
        &:hover &__caption {
            @include visible;
        }
        img {
            max-height: 60vh;
            object-fit: cover;
        }
        &__caption {
            @include abs-top-left;
            width: 100%;
            height: 100%;
            background-color: rgba(black, 0.55);
            text-align: center;
            @include center;
            @include not-visible;
            transition: 0.2s ease-in-out 0.1s;
        }
        span {
            @include text-style(_, 400, 1.3rem, "DM Mono");
            cursor: text;
            color: white;
            width: 80%;
            height: max-content;
            opacity: 1;
        }
    }
</style>