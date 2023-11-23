<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { homeViewLayout, themeState } from "$lib/store"
	import { getThemeFromSection, setNewTheme } from "$lib/utils-appearance"
    import { lightColorThemes, darkColorThemes, imageThemes, ambientVideos, defaultThemes } from "$lib/data-themes"

	import Modal from "../../components/Modal.svelte"
	import { ModalType } from "$lib/enums";
	import { closeModal, openModal } from "$lib/utils-home";
	import AppearanceImgUpload from "./AppearanceImgUpload.svelte";
	import AppearanceVidUrl from "./AppearanceVidUrl.svelte";

    let clickedTheme: Theme | null = null
    let selectedTheme: Theme | null = null
    let isAmbientTabSelected = false

    const handleNewCustomImgBtnSelected = () => {
        openModal(ModalType.CustomImgBg)
    }
    const handleNewCustomVidBtnSelected = () => {
        openModal(ModalType.CustomVidBg)
    }
   const handleThemeClicked = (theme: Theme) => {
        const title = theme.sectionDetails.title
        const idx = theme.sectionDetails.index
        const isSelf = title === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index
        const isPickedTheme = title === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index

        if (isSelf) {
            clickedTheme = null
            return
        }
        else if (!isPickedTheme) {
            clickedTheme = theme
        }
    }
    const handleThemeSelected = () => {
        const title = clickedTheme!.sectionDetails.title as keyof AppearanceThemes
        const idx = clickedTheme!.sectionDetails.index
        selectedTheme = getThemeFromSection(title, idx)
        clickedTheme = null

        setNewTheme(selectedTheme)
    }
    const handleEnterPressed = (event: KeyboardEvent) => {
        if (event.key != "Enter" || clickedTheme === null) return
        handleThemeSelected()
    }

    onMount(() => { 
        selectedTheme = JSON.parse(localStorage.getItem("theme")!) 
    })
    onDestroy(() => {
    })
</script>

<svelte:window on:keydown={handleEnterPressed} />

<Modal onClickOutSide={() => closeModal(ModalType.Appearance)}>
    <div class="appearance-wrapper">
    <div class={`appearance ${$themeState.isDarkTheme ? "" : "appearance--light"}`}>
        <h1 class="appearance__title modal-bg__content-title">Appearance</h1>
        <p class="appearance__description modal-bg__content-copy">Tailor your workspace to your personal aesthetic!</p>

        <div class="highlighter-tabs">
            <div class="highlighter-tabs__container">
                <button 
                    on:click={() => isAmbientTabSelected = false}
                    class={`highlighter-tabs__tab-btn ${!isAmbientTabSelected ? "highlighter-tabs__tab-btn--selected" : ""}`}
                >
                    Color Themes
                </button>
                <button 
                    on:click={() => isAmbientTabSelected = true}
                    class={`highlighter-tabs__tab-btn ${isAmbientTabSelected ? "highlighter-tabs__tab-btn--selected" : ""}`}
                >
                    Ambient Mode
                </button>
            </div>
            <div class="settings-tabs__divider highlighter-tabs__divider"></div>
            <div class={`highlighter-tabs__highlighter highlighter-tabs__highlighter--${isAmbientTabSelected ? "ambient" : "color"}`}></div>
        </div>

        {#if !isAmbientTabSelected}
            <!-- Default Themes -->
            <div class="default-themes bento-box">
                <h3 class="bento-box__title">Default Themes</h3>
                <ul class="default-themes__selection">
                    {#each defaultThemes as theme, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            on:click={() => handleThemeClicked(theme)}
                            role="button" tabindex="0"
                            class={`default-themes__selection-item theme-item 
                                    ${("default" === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index) ? "theme-item--clicked" : ""}        
                                    ${("default" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "theme-item--selected" : ""}`        
                            }
                        >
                            <img src={theme.thumbnailImgSrc} alt="theme-icon">
                            <div class="theme-item__text">
                                <div class="theme-item__text-title">
                                    {theme.title}
                                </div>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
            <!-- Color Themes -->
            <div class="color-themes bento-box">
                <h3 class="bento-box__title"> Color Themes</h3>
                <p class="bento-box__copy">
                    Personalize your workspace with custom color themes tailored to your unique aesthetic!
                </p>
                <!-- Light Themes -->
                <div class="color-themes__light-themes">
                    <div class="bento-box__subheading">Light Themes</div>
                    <ul class="color-themes__themes-list">
                        {#each lightColorThemes as theme, idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                on:click={() => handleThemeClicked(theme)}  
                                role="button" tabindex="0"
                                class={`color-themes__selection-item theme-item 
                                        ${("light" === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index) ? "theme-item--clicked" : ""}        
                                        ${("light" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "theme-item--selected" : ""}`        
                                }
                            >
                                <ul class="theme-item-color-swatch-list">
                                    {#each theme.colorPalette as color}
                                        <li class="theme-item-color-swatch" style={`background-color: ${color}`}></li>
                                    {/each}
                                </ul>
                                <div class="theme-item__text theme-item__text--color-theme">
                                    <div class="theme-item__text-title">
                                        {theme.title}
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
                <!-- Dark Themes -->
                <div class="color-themes__dark-themes">
                    <div class="bento-box__subheading">Dark Themes</div>
                    <ul class="color-themes__themes-list">
                        {#each darkColorThemes as theme, idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                on:click={() => handleThemeClicked(theme)}
                                role="button" tabindex="0"
                                class={`color-themes__selection-item theme-item 
                                        ${("dark" === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index) ? "theme-item--clicked" : ""}        
                                        ${("dark" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "theme-item--selected" : ""}`        
                                }
                            >
                                <ul class="theme-item-color-swatch-list">
                                        {#each theme.colorPalette as color}
                                            <li class="theme-item-color-swatch" style={`background-color: ${color}`}></li>
                                        {/each}
                                </ul>
                                <div class="theme-item__text theme-item__text--color-theme">
                                    <div class="theme-item__text-title">
                                        {theme.title}
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
        {:else}
            <!-- Image Themes -->
            <div class="img-themes bento-box">
                <h3 class="bento-box__title"> Image Themes</h3>
                <p class="bento-box__copy">Customize your workspace with personalized image backgrounds, reflecting your unique aesthetic!</p>
                <ul class="img-themes__img-list">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="custom-item" on:click={handleNewCustomImgBtnSelected} role="button" tabindex="0">
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
                            on:click={() => handleThemeClicked(imgTheme)}
                            role="button" tabindex="0"
                            title={`${imgTheme.title} – ${imgTheme.artist}`}
                            class={`img-themes__selection-item theme-item img-themes__selection-item theme-item--fade-on-hover
                                    ${("image" === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index) ? "theme-item--clicked" : ""}        
                                    ${("image" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "theme-item--selected" : ""}`        
                            }
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
            <!-- Ambient Themes -->
            <div class="ambient-mode bento-box">
                <h3 class="bento-box__title"> Ambient</h3>
                <p class="bento-box__copy">Personalize your workspace with custom color themes tailored to your unique aesthetic!</p>
                <ul class="ambient-mode__vid-list">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="custom-item" on:click={handleNewCustomVidBtnSelected} role="button" tabindex="0">
                        <div class="custom-item__img-container">
                            <span>+</span>
                        </div>
                        <div class="custom-item__txt-container">
                            <div class="custom-item__file-name">
                                No Image
                            </div>
                            <div class="custom-item__input-btn">
                                Your Custom Video
                            </div>
                        </div>
                    </li>
                    {#each ambientVideos as vidTheme, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            on:click={() => handleThemeClicked(vidTheme)}
                            role="button" tabindex="0"
                            title={`${vidTheme.title} – ${vidTheme.channelName}`}
                            class={`ambient-mode__selection-item theme-item ambient-mode__selection-item theme-item--fade-on-hover
                                    ${("video" === clickedTheme?.sectionDetails.title && idx === clickedTheme?.sectionDetails.index) ? "theme-item--clicked" : ""}        
                                    ${("video" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "theme-item--selected" : ""}`        
                            }
                        >
                            <img src={vidTheme.thumbnailSrc} alt="vid-thumbnail">
                            <div class="theme-item__text">
                                <div class="theme-item__text-title">
                                    {vidTheme.title}
                                </div>
                                <div class="theme-item__text-caption">
                                    {vidTheme.channelName}
                                </div>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
            <div class="modal-padding"></div>
        {/if}
    </div>
        <div class={`appearance-apply-btn-container ${clickedTheme ? "appearance-apply-btn-container--visible" : ""}`}>
            <button on:click={handleThemeSelected} class="appearance__apply-btn">
                {#if clickedTheme && (clickedTheme.sectionDetails.title === "image" || clickedTheme.sectionDetails.title === "video")}
                    {`Preview Selected ${clickedTheme.sectionDetails.title === "image" ? "Image" : "Video"}"`}
                {:else if clickedTheme}
                    {`Apply "${clickedTheme?.title}"`}
                {/if}
            </button>
        </div>
    </div>
</Modal>

{#if $homeViewLayout.modalsOpen.includes(ModalType.CustomImgBg)}
    <AppearanceImgUpload />
{/if}
{#if $homeViewLayout.modalsOpen.includes(ModalType.CustomVidBg)}
    <AppearanceVidUrl />
{/if}

<style lang="scss">
    @import "../../scss/highlighter-tabs.scss";

    $section-spacing: 8px;
    $desktop-aspect-ratio: 16 / 10;
    $video-aspect-ratio: 16 / 9;
    $clicked-color: rgba(var(--textColor1), 0.3);
    $selected-color: rgba(var(--fgColor1), 1);

    .appearance {
        width: 85vw;
        max-width: 950px;
        padding: $settings-modal-padding;
        padding-bottom: 0px;

        &-wrapper {
            position: relative;
        }

        .unfill {
            @include unfill-btn-ficus-styling(var(--fgColor1));
        }

        &--light .modal-bg {
            @include modal-bg-light;
        }
        &--light .bento-box {
            &__copy {
                font-weight: 500;
            }
            &__subheading {
                font-weight: 600;
            }
        }
        &--light .theme-item {
            &__text-title {
                font-weight: 600;
            }
            &__text-caption {
                font-weight: 500;
            }
        }
        &--light .highlighter-tabs {
            @include highlighter-tabs-light-mode;

            &__tab-btn {
                margin-right: 17px;
            }
            &__highlighter {
                &--ambient {
                    width: 94px;
                    left: 103px !important;
                }
            }
        }
        
        &__description {
            margin-top: 8px;
        }

        &-wrapper {
            position: relative;
        }
        &-apply-btn-container {
            @include pos-abs-bottom-right-corner(0px, 20px);
            position: sticky;
            height: 30px;
            min-width: 100px;
            @include flex-container(center, flex-end);
            visibility: hidden;
            opacity: 0;
            
            &--visible {
                visibility: visible;
                opacity: 1;
            }
        }
        &-apply-btn-container button {
            margin-right: 20px;
            padding: 8.5px 20px;
            font-size: 1.2rem;
            border-radius: 20px;
            background-color: rgb(var(--fgColor2));
            color: rgb(var(--textColor2));

            &:hover, &:focus {
                filter: brightness(1.05);
            }
        }
    }
    .appearance .highlighter-tabs {
        margin: 22px 0px 25px 0px;

        &__tab-btn {
            margin-right: 20px;
        }
        &__highlighter {
            &--color {
                width: 85px;
                left: 0px;
            }
            &--ambient {
                width: 94px;
                left: 98px;
            }
        }
    }
    .theme-item {
        position: relative;
        transition: 0.11s ease-in-out;
        cursor: pointer;
        border-radius: 3px;
        margin-right: 20px;
        outline: none;

        &:active {
            transform: scale(0.98);
            opacity: 1 !important;
        }
        
        &--fade-on-hover {
            &:hover {
                opacity: 0.7;
            }
        }
        &--clicked {
            opacity: 1 !important;
            img {
                border: 2.5px solid $clicked-color;
            }
            h6, span {
                color: $clicked-color !important;
            }
        }
        &--clicked &__text {
            &-title, &-caption {
                color: $clicked-color !important;
            }
            &-caption {
                opacity: 0.6;
            }
        }
        &--clicked &-color-swatch-list {
            margin-top: -2px;
            width: 86.5px;
            height: 24px;
            background-color: $clicked-color;
            align-items: center;
            padding-left: 3.3px;
        }
        &--clicked &-color-swatch {
            width: 18px;
        }
        &--selected {
            img {
                border: 2.5px solid $selected-color;
            }
            &-title, &-caption {
                color: rgba(var(--fgColor1), 1) !important;
            }
            &-caption {
                opacity: 0.6;
            }
        }
        &--selected &-color-swatch-list {
            margin-top: -2px;
            width: 86.5px;
            height: 24px;
            background-color: $selected-color;
            align-items: center;
            padding-left: 3.3px;
        }
        &--selected &-color-swatch {
            width: 18px; 
        }
        &--color-theme {
            height: 50px;
        }
        img {
            border-radius: 3px;
            object-fit: cover;
            aspect-ratio: $desktop-aspect-ratio;
            width: 100%;
            -webkit-user-drag: none;                
        }
        &__text {
            margin: 5px 0px 0px 0px;
            &--color-theme {
                margin: 4px 0px 0px 0px;
            }
            &-title {
                @include elipses-overflow;
                color: rgba(var(--textColor1), 0.85);
                margin-bottom: 2px;
                font-size: 1.03rem;
                font-weight: 500;
            }
            &-caption {
                @include flex-container(center, _);
                color: rgba(var(--textColor1), 0.55);
                @include elipses-overflow;
                display: block;
            }
        }
        &-color-swatch-list {
            transition: 0.15s ease-in-out;
            height: 20px;
            width: 90px;
            border-radius: 3px;
            display: flex;
        }
        &-color-swatch {
            transition: 0.15s ease-in-out;
            width: 20px;
            aspect-ratio: 1 / 1;
            border-radius: 2px;
            margin-right: -2.6px;
        }
    }
    .custom-item {
        outline: none;

        &__img-container {
            width: 120px;
            aspect-ratio: $desktop-aspect-ratio;
            position: relative;
            border-radius: 6px;
            transition: 0.11s ease-in-out;
            // background-color: rgba(255, 255, 255, 0.01);
            background-color: var(--hoverColor2);
            cursor: pointer;

            input {
                width: 100%;
                height: 100%;
                display: none;
            }

            &:hover {
                opacity: 0.5;
            }
            &:active {
                transform: scale(0.98);
            }

            span {
                @include abs-center;
                font-size: 1.7rem;
                opacity: 0.6;
            }
        }
        &__txt-container {
            margin-top: 6.5px;
        }
        &__file-name {
            @include elipses-overflow;
            color: rgba(var(--textColor1), 0.85);
            margin-bottom: 2px;
            font-size: 1.03rem;
            font-weight: 500;
        }
        &__input-btn {
            @include flex-container(center, _);
            color: rgba(var(--textColor1), 0.55);
            @include elipses-overflow;
            display: block;
        }
    }
    .bento-box {
        margin-bottom: $section-spacing;
        position: relative;

        &__copy {
            color: rgba(var(--textColor1), 0.55);
            font-size: 1.1rem;
        }
        &__subheading {
            color: rgba(var(--textColor1), 1);
            margin-bottom: 25px;
        }
    }
    /* Sections */
    .default-themes {
        padding-bottom: 20px;

        &__selection {
            margin-top: 20px;
            display: flex;
            padding-bottom: 10px;
        }
        &__selection-item {
            width: 140px;
        }
    }
    .color-themes {
        padding-bottom: 30px;

        &__selection-item {
            height: 55px;
            margin: 0px;
        }
        &__themes-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, 107px);
            width: 100%;
        }
        &__light-themes {
            margin: 25px 0px 20px 0px;
        }

        .appearance__apply-btn-container {
            bottom: -5px;
        }
    }
    .img-themes {
        padding-bottom: 20px;
        &__selection-item {
            width: 120px;
            margin-bottom: 20px;
        }
        &__img-list {
            margin-top: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fill, 135px);
            width: 100%;
            height: 400px;
            overflow-y: scroll;
        }
    }
    .ambient-mode {
        padding-bottom: 20px;
        margin-bottom: 20px;
        overflow-y: scroll;

        &__selection-item {
            width: 150px;
            margin-bottom: 20px;
            img {
                aspect-ratio: $video-aspect-ratio;
            }
        }
        &__vid-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, 165px);
            margin-top: 20px;
            height: 370px;
            overflow-y: scroll;
        }
        span {
            margin-top: 3px;
            margin-bottom: 4px;
            img {
                @include circle(13px);
                margin-right: 4px;
                border: 0px !important;
            }
        }
        .custom-item {
            &__img-container {
                width: 150px;
                aspect-ratio: $video-aspect-ratio;
            }
        }
    }
    .modal-padding {
        width: 100%;
        height: 20px;
    }
</style>