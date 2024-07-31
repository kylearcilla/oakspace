<script lang="ts">
    import { lightColorThemes, darkColorThemes, imageThemes, ambientVideos, defaultThemes } from "$lib/data-themes"

</script>

<div class="background">
    <!-- Image Themes -->
    <div class="img-themes bento-box">
        <h3 class="bento-box__title"> Image Themes</h3>
        <p class="bento-box__copy">Customize your workspace with personalized image backgrounds, reflecting your unique aesthetic!</p>
        <ul class="img-themes__img-list">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li class="custom-item" role="button" tabindex="0">
            <div class="custom-item__img-container">
                    <span>+</span>
                </div>
                <div class="custom-item__txt-container">
                    <div class="custom-item__file-name">
                        No Image
                    </div>
                    <div class="custom-item__input-btn">
                        Your Custom Image
                    </div>
                </div>
            </li>
            {#each imageThemes as imgTheme, idx}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li 
                    role="button" tabindex="0"
                    title={`${imgTheme.title} – ${imgTheme.artist}`}
                >
                    <img src={imgTheme.thumbnailImgSrc} alt="vid-thumbnail">
                    <div class="theme-item__text">
                        <div class="theme-item__text-title">
                            {imgTheme.title}
                        </div>
                        <div class="theme-item__text-caption">
                            {imgTheme.artist}
                        </div>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</div>


<style lang="scss">
    .background {

    }
</style>