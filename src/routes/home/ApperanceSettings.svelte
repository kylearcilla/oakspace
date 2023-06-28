<script lang="ts">
	import { clickOutside, setRootColors } from "$lib/helper";
    import { lightColorThemes, darkColorThemes, imageThemes, ambientVideos, defaultThemes } from "$lib/data-themes";
	import { onMount } from "svelte";
	import { colorThemeState } from "$lib/store";

    export let onNavButtonClicked: any;
    const closeModal = () => onNavButtonClicked("")


    let clickedTheme: { sectionTitle: keyof typeof themeSections, index: number, themeTitle: string } | null = null
    let selectedTheme: Theme | null = null

    // object to map section names to array names for dynmaically selecting the corresponding array to use
    const themeSections: any = {
        default: defaultThemes,
        light: lightColorThemes,
        dark: darkColorThemes,
        image: imageThemes,
        video: ambientVideos
    };
    const handleThemeClicked = (sectionTitle: keyof typeof themeSections, index: any) => {
        if (sectionTitle === clickedTheme?.sectionTitle && index === clickedTheme?.index) {
            clickedTheme = null
            return
        }
        else if (sectionTitle === selectedTheme?.sectionDetails.title && index === selectedTheme?.sectionDetails.index) {
            return
        }
        else {
            clickedTheme = { sectionTitle, index, themeTitle: themeSections[sectionTitle][index].title }
        }
    }
    const handleThemeSelected = () => {
        // @ts-ignore
        selectedTheme = themeSections[clickedTheme.sectionTitle][clickedTheme.index]
        colorThemeState.set({
            title: selectedTheme!.title,
            isDarkTheme: selectedTheme!.properties.isDark,
            themeToggleBtnIconColor: selectedTheme!.properties.iconToggleBtnBgColor,
            hasTwin: selectedTheme!.properties.hasTwin,
            sectionTitle: selectedTheme!.sectionDetails.title
        })
        setRootColors(selectedTheme!.properties)

        clickedTheme = null
        localStorage.setItem("theme", JSON.stringify(selectedTheme))
    }
    onMount(() => {
        selectedTheme = JSON.parse(localStorage.getItem("theme")!)
    })
</script>

<div class="modal-bg">
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content modal-bg__content--main-modal modal-bg__content--overflow-y-scroll">
        <div class="appearance">
            <h1 class="modal-bg__content-title">Appearance</h1>
            <p class="modal-bg__content-copy paragraph-1">Tailor your workspace to your personal aesthetic!</p>
            <!-- Default Themes -->
            <div class="default-themes grid-section">
                <h3 class="grid-section__title">Default Themes</h3>
                <ul class="default-themes__selection">
                    {#each defaultThemes as theme, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            on:click={() => handleThemeClicked(Object.keys(themeSections)[0], idx)}  
                            class={`default-themes__selection-item appearance__theme-item 
                                    ${("default" === clickedTheme?.sectionTitle && idx === clickedTheme?.index) ? "appearance__theme-item--clicked" : ""}        
                                    ${("default" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "appearance__theme-item--selected" : ""}`        
                            }
                        >
                            <img src={theme.thumbnailImgSrc} alt="theme-icon">
                            <div class="appearance__theme-item-text"><h6>{theme.title}</h6></div>
                        </li>
                    {/each}
                </ul>
                {#if clickedTheme?.sectionTitle === "default"}
                    <div class="appearance__apply-btn-container">
                        <button on:click={handleThemeSelected} class="appearance__apply-btn unfill unfill--oval">
                            {`Apply ${clickedTheme?.themeTitle}"`}
                        </button>
                    </div>
                {/if}
            </div>
            <!-- Color Themes -->
            <div class="color-themes grid-section">
                <h3 class="grid-section__title"> Color Themes</h3>
                <p class="grid-section__copy  paragraph-2">
                    Personalize your workspace with custom color themes tailored to your unique aesthetic!
                </p>
                <!-- Light Themes -->
                <div class="color-themes__light-themes">
                    <h4 class="subheading-2">Light Themes</h4>
                    <ul class="color-themes__themes-list">
                        {#each lightColorThemes as theme, idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                on:click={() => handleThemeClicked(Object.keys(themeSections)[1], idx)}  
                                class={`color-themes__selection-item appearance__theme-item 
                                        ${("light" === clickedTheme?.sectionTitle && idx === clickedTheme?.index) ? "appearance__theme-item--clicked" : ""}        
                                        ${("light" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "appearance__theme-item--selected" : ""}`        
                                }
                            >
                                <ul class="appearance__theme-item-color-swatch-list">
                                    {#each theme.colorPalette as color}
                                        <li class="appearance__theme-item-color-swatch" style={`background-color: ${color}`}></li>
                                    {/each}
                                </ul>
                                <div class="appearance__theme-item-text appearance__theme-item-text--color-theme">
                                    <h6>{theme.title}</h6>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
                <!-- Dark Themes -->
                <div class="color-themes__dark-themes">
                    <h4 class="subheading-2">Dark Themes</h4>
                    <ul class="color-themes__themes-list">
                        {#each darkColorThemes as theme, idx}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li 
                                on:click={() => handleThemeClicked(Object.keys(themeSections)[2], idx)}  
                                class={`color-themes__selection-item appearance__theme-item 
                                        ${("dark" === clickedTheme?.sectionTitle && idx === clickedTheme?.index) ? "appearance__theme-item--clicked" : ""}        
                                        ${("dark" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "appearance__theme-item--selected" : ""}`        
                                }
                            >
                                <ul class="appearance__theme-item-color-swatch-list">
                                        {#each theme.colorPalette as color}
                                            <li class="appearance__theme-item-color-swatch" style={`background-color: ${color}`}></li>
                                        {/each}
                                </ul>
                                <div class="appearance__theme-item-text appearance__theme-item-text--color-theme">
                                    <h6>{theme.title}</h6>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>
                {#if clickedTheme?.sectionTitle === "dark" || clickedTheme?.sectionTitle === "light"}
                    <div class="appearance__apply-btn-container">
                        <button on:click={handleThemeSelected} class="appearance__apply-btn unfill unfill--oval">
                            {`Apply "${clickedTheme?.themeTitle}"`}
                        </button>
                    </div>
                {/if}
            </div>
            <!-- Image Themes -->
            <div class="img-themes grid-section">
                <h3 class="grid-section__title"> Image Themes</h3>
                <p class="grid-section__copy  paragraph-2">Customize your workspace with personalized image backgrounds, reflecting your unique aesthetic!</p>
                <ul class="img-themes__img-list">
                    {#each imageThemes as img, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            on:click={() => handleThemeClicked(Object.keys(themeSections)[3], idx)}  
                            title={img.title}
                            class={`img-themes__selection-item appearance__theme-item 
                                    ${("image" === clickedTheme?.sectionTitle && idx === clickedTheme?.index) ? "appearance__theme-item--clicked" : ""}        
                                    ${("image" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "appearance__theme-item--selected" : ""}`        
                            }
                        >
                            <img src={img.thumbnailImgSrc}>
                            <div class="appearance__theme-item-text">
                                <h6>{img.title}</h6>
                                <span class="caption-4">{img.artist}</span>
                            </div>
                        </li>
                    {/each}
                </ul>
                {#if clickedTheme?.sectionTitle === "image"}
                    <div class="appearance__apply-btn-container appearance__apply-btn-container--overflow-hover">
                        <button on:click={handleThemeSelected} class="appearance__apply-btn unfill unfill--oval">
                            {`Preview "${clickedTheme.sectionTitle}"`}
                        </button>
                    </div>
                {/if}
            </div>
            <!-- Ambient Themes -->
            <div class="ambient-mode grid-section">
                <h3 class="grid-section__title"> Ambient</h3>
                <p class="grid-section__copy  paragraph-2">Personalize your workspace with custom color themes tailored to your unique aesthetic!</p>
                <ul class="ambient-mode__vid-list">
                    {#each ambientVideos as vid, idx}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li 
                            on:click={() => handleThemeClicked(Object.keys(themeSections)[4], idx)}
                            title={vid.title}
                            class={`ambient-mode__selection-item appearance__theme-item 
                                    ${("video" === clickedTheme?.sectionTitle && idx === clickedTheme?.index) ? "appearance__theme-item--clicked" : ""}        
                                    ${("video" === selectedTheme?.sectionDetails.title && idx === selectedTheme?.sectionDetails.index) ? "appearance__theme-item--selected" : ""}`        
                            }
                        >
                            <img src={vid.thumbnailSrc}>
                            <div class="appearance__theme-item-text">
                                <h6>{vid.title}</h6>
                                <span class="caption-4">
                                    <img src={vid.channelImgSrc} alt="">
                                    {vid.channelName}
                                </span>
                            </div>
                        </li>
                    {/each}
                </ul>
                {#if clickedTheme?.sectionTitle === "video"}
                    <div class="appearance__apply-btn-container appearance__apply-btn-container--overflow-hover">
                        <button on:click={handleThemeSelected} class="appearance__apply-btn unfill unfill--oval">
                            {`Preview "${clickedTheme.sectionTitle}"`}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    $section-spacing: 8px;
    $desktop-aspect-ratio: 16 / 10;
    $video-aspect-ratio: 16 / 9;
    $selected-color: #75bef5;
    $clicked-color: rgba(var(--textColor1), 0.5);

    .modal-bg {
        &__content {
            width: 85vw;
            max-width: 950px;
        }
    }
    .appearance {
        position: relative;
        &__description {
            color: rgba(var(--textColor1), 0.8);
        }
        &__apply-btn-container {
            height: 10px;
            &--overflow-hover {
                height: 40px;
            }
            width: 100%;
            position: relative;
        }
        &__apply-btn {
            @include pos-abs-bottom-right-corner(0px, 0px);
        }
        /* Theme Item */
        &__theme-item {
            position: relative;
            transition: 0.14s ease-in-out;
            cursor: pointer;
            border-radius: 3px;
            margin-right: 20px;

            &:active {
                transform: scale(0.98);
            }

            &--clicked {
                img {
                    border: 2.5px solid $clicked-color;
                }
                h6, span {
                    color: $clicked-color !important;
                }
            }
            &--clicked > &-color-swatch-list {
                margin-top: -2px;
                height: 24px;
                background-color: $clicked-color;
                @include center;
            }
            &--selected {
                img {
                    border: 2.5px solid $selected-color;
                }
                h6, span {
                    color: $selected-color !important;
                }
                span {
                    opacity: 0.6;
                }
            }
            &--selected > &-color-swatch-list {
                margin-top: -2px;
                height: 24px;
                background-color: $selected-color;
                @include center;
            }
            &--color-theme {
                height: 50px;
                image {
                    display: none;
                }
            }
            img {
                border-radius: 3px;
                object-fit: cover;
                aspect-ratio: $desktop-aspect-ratio;
                width: 100%;
                -webkit-user-drag: none;                
            }
        }
        &__theme-item-text {
            margin: 5px 0px 0px 0px;
            &--color-theme {
                margin: 4px 0px 0px 0px;
            }
            h6 {
                @include elipses-overflow;
                color: rgba(var(--textColor1), 0.85);
                margin-bottom: 2px;
            }
            span {
                @include elipses-overflow;
                @include flex-container(center, _);
                color: rgba(var(--textColor1), 0.55);
            }
        }
        /* For Color Palettes */
        &__theme-item-color-swatch-list {
            height: 20px;
            width: 90px;
            padding-right: 3.4px;
            border-radius: 5px;
            display: flex;

            & ~ {

            }
        }
        &__theme-item-color-swatch {
            width: 20px;
            aspect-ratio: 1 / 1;
            border-radius: 3px;;
            margin-right: -3.5px;
        }
    }
    .grid-section {
        margin-bottom: $section-spacing;
        position: relative;

        &__copy {
            color: rgba(var(--textColor1), 0.55);
        }
    }
    .default-themes {
        margin-top: 20px;
        padding-bottom: 20px;
        &__selection {
            margin-top: 20px;
            display: flex;
            padding-bottom: 10px;
        }
        &__selection-item  {
            width: 140px;
        }
    }
    .color-themes {
        padding-bottom: 15px;
        h4 {
            color: rgba(var(--textColor1), 0.8);
            margin-bottom: 15px;
            font-weight: 500;
        }
        h6 {
            @include elipses-overflow;
            margin-top: 8px;
            color: rgba(var(--textColor1), 0.7);
        }
        &__selection-item {
            margin-bottom: 10px;
        }
        &__themes-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, 95px);
            width: 100%;
        }
        &__light-themes {
            margin: 25px 0px 20px 0px;
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
        margin-bottom: 80px;
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
    }
</style>