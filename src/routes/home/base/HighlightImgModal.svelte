<script lang="ts">
	import Modal from "../../../components/Modal.svelte";

    export let onClickOutside: () => void
    export let img: { src: string, caption: string }

    const MAX_CAPTION_LENGTH = 50
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
    <div 
        class="highlight-img">
        <img src={img.src} alt="icon">
        <div class="highlight-img__caption">
            <input 
                maxlength={MAX_CAPTION_LENGTH}
                placeholder="no caption"
                type="text" 
                bind:value={img.caption}
            >
        </div>
    </div>
</Modal>

<style lang="scss">
    .highlight-img {
        position: relative;

        &:hover &__caption {
            @include visible;
        }
        img {
            max-width: 400px;
            max-height: 450px;
            min-width: 350px;
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
        input {
            @include text-style(_, 400, 1.3rem, "DM Mono");
            color: white;
            width: 80%;
            height: max-content;
            cursor: text;
            opacity: 1;

            &::placeholder {
                color: white;
                opacity: 0.35;
            }
        }
    }
</style>