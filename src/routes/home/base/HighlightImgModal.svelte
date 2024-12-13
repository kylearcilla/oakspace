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
    <div class="highlight-img">
        <img src={img.src} alt="icon">
        <div class="highlight-img__content"></div>
        <input 
            maxlength={MAX_CAPTION_LENGTH}
            placeholder="no caption"
            type="text" 
            bind:value={img.caption}
        >
    </div>
</Modal>

<style lang="scss">
    .highlight-img {
        img {
            max-width: 400px;
            max-height: 450px;
            min-width: 350px;
            object-fit: cover;
        }
        &__content {
            height: 100%;
            width: 100%;
            z-index: 2;
            @include abs-top-left;
            background-color: rgba(black, 0);
        }
        input {
            @include abs-bottom-left(-25px, 0px);
            @include text-style(0.8, 400, 1.3rem, "DM Mono");
            z-index: 5;
            width: 100%;
            height: max-content;
            cursor: text;

            &::placeholder {
                opacity: 0.4;
            }
        }
    }
</style>