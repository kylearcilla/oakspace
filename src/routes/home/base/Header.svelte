<script lang="ts">
	import { createEventDispatcher } from "svelte";

    import { themeState } from "$lib/store"
	import { clickOutside } from "$lib/utils-general"
    import { HOME_THOUGHT_ENTRY } from "$lib/mock-data"
    import { imageUpload, iconPicker } from "$lib/pop-ups"

	import TextEntry from "./TextEntry.svelte"
	import ToggleBtn from "$components/ToggleBtn.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"

    $: isLight = !$themeState.isDarkTheme

    export let bannerImg: Banner
    export let options: BaseOptions
    export let header: BaseHeader

    const BASE_HEADER_ICON_ID = "base-header--icon"
    const dispatch: BaseDispatcher = createEventDispatcher()
    let settingsOpen = false

    $: showIcon = header.pos === "top" && header.icon.show

    function openBannerImg() {
        imageUpload.init({
            onSubmit: (src: string) => {
                onBannerUpdate({ src, center: 50 })
            }
        })
        settingsOpen = false
    }
    function initIconPicker() {
        iconPicker.init({
            id: BASE_HEADER_ICON_ID,
            onSubmitIcon: (icon) => {
                onHeaderUpdate({ icon: { ...header.icon, ...icon } })
            }
        })
    }
    function onBannerUpdate(updates: Partial<Banner>) {
        dispatch("base", { 
            context: "banner",
            payload: { ...bannerImg, ...updates }
        })

    }
    function onOptionsUpdate(updates: Partial<BaseOptions>) {
        dispatch("base", { 
            context: "options",
            payload: { ...options, ...updates }
        })
    }
    function onHeaderUpdate(updates: Partial<BaseHeader>) {
        dispatch("base", { 
            context: "header",
            payload: { ...header, ...updates }
        })
    }
</script>

<div 
    class="base-header"
    class:base-header--no-banner={!options.banner}
    class:base-header--has-icon={showIcon}
    class:base-header--emoji-icon={showIcon && header.icon?.type === "emoji"}
>
    {#if showIcon}
        {@const { type, src } = header.icon}
        <button
            id={BASE_HEADER_ICON_ID}
            class="base-header__icon"
            on:click={() => initIconPicker()}
        >
            {#if type === "emoji"}
                <span>{src}</span>
            {:else}
                <img src={src}>
            {/if}
        </button>
    {/if}
    <div style:width="100%">
        <div class="base-header__heading">
            <h1>Home</h1>

            <!-- settings stuff -->
            <div class="base-header__settings-btn">
                <SettingsBtn 
                    id="base"
                    options={{ 
                        opacity: {
                            fg: 0.25,
                            bg: 0
                        },
                        hOpacity: {
                            fg: 0.5,
                            bg: 0.05
                        },
                    }}
                    onClick={() => settingsOpen = !settingsOpen}
                />
            </div>

            <BounceFade 
                isHidden={!settingsOpen}
                zIndex={200}
                position={{ top: "28px", right: "0px" }}
            >
                <div 
                    data-dmenu-id="base"
                    class="base-header__dmenu dmenu" 
                    class:dmenu--light={isLight}
                    style:--font-size="1.32rem"
                    style:width={"170px"}
                    use:clickOutside on:outClick={() => settingsOpen = false} 
                >
                    <!-- banner -->
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            Banner
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Show Banner</span>
                            <ToggleBtn 
                                active={options.banner}
                                onToggle={() => {
                                    onOptionsUpdate({ banner: !options.banner })
                                }}
                            />
                        </div>
                        {#if options.banner}
                            <div class="dmenu__option">
                                <button class="dmenu__option-btn" on:click={() => openBannerImg()}>
                                    <span class="dmenu__option-text">
                                        Change Wallpaper
                                    </span>
                                </button>
                            </div>
                        {/if}
                    </li>
                    <li class="dmenu__section-divider"></li>
                    <!-- header -->
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            Header
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">On Top</span>
                            <ToggleBtn 
                                active={header.pos === "top"}
                                onToggle={() => {
                                    onHeaderUpdate({ pos: header.pos === "top" ? "side" : "top" })
                                }}
                            />
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Text Block</span>
                            <ToggleBtn 
                                active={header.showText}
                                onToggle={() => {
                                    onHeaderUpdate({ showText: !header.showText })
                                }}
                            />
                        </div>
                        {#if header.pos === "top"}
                            <div class="dmenu__toggle-optn  dmenu__option--static">
                                <span class="dmenu__option-heading">Icon</span>
                                <ToggleBtn 
                                    active={header.icon.show}
                                    onToggle={() => {
                                        onHeaderUpdate({ icon: { ...header.icon, show: !header.icon.show } })
                                    }}
                                />
                            </div>
                        {/if}
                    </li>
                    <!-- side margin -->
                    <li class="dmenu__section-divider"></li>
                    <li class="dmenu__section">
                        <div class="dmenu__section-name">
                            Side Margin
                        </div>
                        <div class="dmenu__toggle-optn  dmenu__option--static">
                            <span class="dmenu__option-heading">Show Margin</span>
                            <ToggleBtn 
                                active={options.margin}
                                onToggle={() => {
                                    onOptionsUpdate({ margin: !options.margin })
                                }}
                            />
                        </div>
                    </li>
                </div>
            </BounceFade>
        </div>
        {#if header.showText}
            <div style:width="100%">
                <TextEntry 
                    id="header"
                    zIndex={100}
                    entry={HOME_THOUGHT_ENTRY}
                />
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .base-header {
        width: 100%;
        margin-bottom: 10px;

        &--no-banner {
            margin-top: 0 !important;
        }
        &--has-icon {
            margin-top: -100px;
        }
        &--emoji-icon &__icon {
            margin-bottom: 0px;
        }

        &__icon {
            margin-bottom: 15px;
            font-size: 6rem;
            height: 95px;
            width: 95px;
            
            img {
                @include square(100px);
                border-radius: 4px;
                object-fit: cover;
            }
        }
        &__heading {
            margin: 0px 0px 0px 0px;
            position: relative;
            width: 100%;
            @include flex(flex-start, space-between);

            h1 {
                @include text-style(1, var(--fw-400-500), 2.75rem, "Geist Mono");
            }
        }
        &__settings-btn {
            @include abs-top-right(0px, 0px);
            z-index: 100;
        }
    }
</style>