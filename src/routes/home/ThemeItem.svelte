<script lang="ts">
	import { themeState } from "$lib/store";
	import { themePreviews } from "$lib/data-themes";

    export let type: "dark" | "light"
    export let clicked: boolean
    export let onClick: (type: "dark" | "light") => void

    $: state = $themeState
    $: selectedType = $themeState.isDarkTheme ? "dark" : "light"
    $: lightTheme = state.lightTheme
    $: darkTheme = state.darkTheme

    $: updatePreview(lightTheme, darkTheme)
    let preview: ThemePreview | null = null

    function updatePreview(lightTheme: string, darkTheme: string) {
        preview = themePreviews.find(preview => {
            if (type === "dark") {
                return preview.name === darkTheme
            }
            else {
                return preview.name === lightTheme
            }
        })!
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    role="button"
    tabindex="0"
    on:click={() => onClick(type)}
    class="theme-item smooth-bounce"
    class:theme-item--clicked={clicked}
    class:theme-item--selected={selectedType === type}
    style:--star-color={selectedType === type ? "" : "rgba(var(--textColor1), 0.5)"}
    style:--bg-1={preview?.bg1}
    style:--bg-2={preview?.bg2}
    style:--bg-3={preview?.bg3}
    style:--fg-1={preview?.fg1}
    style:--fg-2={preview?.fg2}
    style:--fg-3={preview?.fg3}
    style:--fg-4={preview?.fg4} 
    style:--borderColor={preview?.borderColor}
>
    <div class="theme-item__wrapper">
        <div class="theme-item__container">
            <div class="preview">
                <div class="flx">
                    <div>
                        <div class="flx">
                            <div class="preview__circle"></div>
                            <div class="preview__circle"></div>
                            <div class="preview__circle"></div>
                        </div>
                        <div class="preview__box"></div>
                        <div class="preview__line"></div>
                        <div 
                            class="preview__line"
                            style:width="17px"
                        >
                        </div>
                        <div class="preview__line"></div>
                        <div 
                            class="preview__line" 
                            style:margin-top="25px"
                        >
                        </div>
                    </div>
                    <div class="preview__inner">
                        <div class="preview__line"></div>
                        <div 
                            class="flx"
                            style:margin="8px 0px 18px 0px"
                        >
                            <div class="preview__box"></div>
                            <div style:margin-left="5px">
                                <div 
                                    class="preview__line"
                                    style:background-color="var(--fg-4)"
                                    style:width="25px"
                                >
    
                                </div>
                                <div class="preview__line"></div>
                            </div>
                        </div>
                        <div class="preview__line"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <span>
        {type === "dark" ? "Dark" : "Light"}
    </span>
</div>


<style lang="scss">
    .theme-item {
        margin-right: 13px;
        cursor: pointer;

        &--clicked &__wrapper {
            box-shadow: rgba(#0C8CE9, 1) 0px 0px 0px 2.5px;
        }
        &--clicked span {
            color: #0C8CE9 !important;
            font-weight: 500 !important;
        }
        &--selected span::after {
            content: "*";
            display: block;
            color: var(--star-color);
            margin-left: 6px;
        }

        &:active {
            transform: scale(0.98);
        }
        &__wrapper {
            border-radius: 15px;
            box-shadow: var(--borderColor) 0px 0px 0px 2px;
        }
        &__container {
            @include box(120px, 170px, 15px);
            background-color: var(--bg-1);
            position: relative;
            overflow: hidden;
        }
        span {
            @include text-style(0.6, var(--fw-400-500), 1.35rem, "DM Mono");
            @include flex(center);
            margin: 12px 0px 0px 2px
        }
    }
    .preview {
        @include abs-bottom-right(-10px, -20px);
        @include box(110px, 160px, 12px);
        background-color: var(--bg-2);
        border: 1.5px solid rgba(var(--textColor1), 0.03);
        padding: 7px 0px 0px 7px;

        &__circle {
            @include circle(5px);
            background-color: var(--fg-2);
            margin-right: 2.5px;
        }
        &__box {
            background-color: var(--fg-1);
            @include box(12px, 12px, 4.5px);
            margin: 7px 0px 8px 0px;
        }
        &__line {
            background-color: var(--fg-2);
            height: 4.5px;
            width: 22px;
            border-radius: 4px;
            margin-bottom: 4px;
        }
        &__inner {
            background-color: var(--bg-3);
            @include box(110px, 160px, 15px);
            margin-left: 15px;
            padding: 12px 10px 10px 13px;
        }
        &__inner &__box {
            margin: 0px 0px 10px 0px;
            @include box(25px, 25px, 8px);
            background-color: var(--fg-4);
        }
        &__inner &__line {
            background-color: var(--fg-3);
            width: 40px;
        }
    }
</style>