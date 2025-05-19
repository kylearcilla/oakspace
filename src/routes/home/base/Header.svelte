<script lang="ts">
    import { imageUpload } from "$lib/pop-ups"
	import { updateHome } from "$lib/api-general"
	import { DEFAUL_EMOJIS } from "$lib/constants"
	import { HOME_THOUGHT_ENTRY } from "$lib/mock-data"
	import { randomArrayElem } from "$lib/utils-general"

	import TextEntry from "$components/TextEntry.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    export let options: BaseView
    export let showIcon: boolean
    export let onOptionUpdate: (options: Partial<BaseView>) => void

    let settingsOpen = false
    let entry = options.entry

    function onViewOptions(optn: string) {
        const { banner, header, leftMargin } = options
        const { icon, showEntry, pos } = header

        if (optn === "banner" && banner) {
            const show = !banner.show
            onOptionUpdate({ 
                banner: { ...banner, show }
            })
            updateHome({ showBanner: show })
        }
        else if (optn === "icon" && !icon) {
            const newIcon: SmallIcon = {
                show: true,
                type: "emoji",
                src: randomArrayElem(DEFAUL_EMOJIS)
            }
            onOptionUpdate({ 
                header: { ...header, icon: newIcon }
            })
            updateHome({ 
                showIcon: true,
                iconSrc: newIcon.src,
                iconType: newIcon.type
            })
        }
        else if (optn === "icon") {
            const show = !icon!.show
            
            onOptionUpdate({ 
                header: { ...header, icon: { ...icon!, show } }
            })
            updateHome({ showIcon: show })
        }
        else if (optn === "delete banner") {
            onOptionUpdate({ banner: null })
            updateHome({ bannerSrc: null, showBanner: false })
        }
        else if (optn === "entry") {
            const show = !showEntry
            onOptionUpdate({
                header: { ...header, showEntry: show }
            })
            updateHome({ showEntry: show })
        }
        else if (optn === "header") {
            const headerPos = pos === "top" ? "side" : "top"
            onOptionUpdate({
                header: { ...header, pos: headerPos }
            })
            updateHome({ headerView: headerPos })
        }
        else if (optn === "left margin") {
            const flag = !leftMargin
            onOptionUpdate({ leftMargin: flag })
            updateHome({ leftMargin: flag })
        }
    }
    function openBannerImg() {
        imageUpload.init({
            onSubmitImg: async (src: string) => {
                const banner = { img: { src, center: 50 }, show: true }

                await updateHome({ 
                    bannerSrc: src,
                    bannerCenter: 50,
                    showBanner: true
                })

                onOptionUpdate({ banner })
            }
        })
        settingsOpen = false
    }
</script>

<div 
    class="base-header"
    class:base-header--no-banner={!options.banner?.show}
    class:base-header--has-icon={showIcon}
    class:base-header--pos-side={options.header.pos === "side"}
>
    <div style:width="100%">
        <div class="base-header__heading">
            <h1>Home</h1>
            <div class="base-header__settings-btn">
                <SettingsBtn 
                    id="base"
                    options={{ 
                        opacity:  { fg: 0.25, bg: 0 },
                        hOpacity: { fg: 0.5, bg: 0.05 },
                    }}
                    onClick={() => settingsOpen = !settingsOpen}
                />
            </div>

            <DropdownList 
                id="base"
                isHidden={!settingsOpen} 
                options={{
                    listItems: [
                        {
                            sectionName: "Banner",
                        },
                        {
                            name: options.banner ? "Show" : "",
                            active: options.banner?.show ?? false,
                            onToggle: () => onViewOptions("banner")
                        },
                        {
                            name: options.banner ? (options.banner.show ? "Replace" : "") : "Add Background",
                            divider: !options.banner
                        },
                        {
                            name: options.banner ? "Delete" : "",
                            divider: true
                        },
                        {
                            sectionName: "Header",
                        },
                        {
                            name: "Top",
                            active: options.header.pos === "top",
                            onToggle: () => onViewOptions("header")
                        },
                        {
                            name: "Icon",
                            active: options.header.icon?.show ?? false,

                            onToggle: () => onViewOptions("icon"),
                        },
                        {
                            name: "Text Block",
                            divider: true,
                            active: options.header.showEntry,
                            onToggle: () => onViewOptions("entry")
                        },
                        {
                            sectionName: "Side Margin",
                            divider: true
                        },
                        {
                            name: "Show",
                            active: options.leftMargin,
                            onToggle: () => onViewOptions("left margin")
                        }
                    ],
                    styling: {
                        minWidth: "140px",
                        fontSize: "1.17rem",
                        zIndex: 1000
                    },
                    position: { 
                        top: "28px", right: "0px" 
                    },
                    onListItemClicked: ({ name }) => {
                        if (name === "Replace" || name === "Add Background") {
                            openBannerImg()
                        }
                        else if (name === "Delete") {
                            onViewOptions("delete banner")
                        }
                    },
                    onClickOutside: () => {
                        settingsOpen = false
                    }
                }}
            />
        </div>
        {#if entry && options.header.showEntry}
            {#key entry}
                <div style:width="100%" style:margin="0px 0px 0px 0px">
                    <TextEntry 
                        id="header"
                        zIndex={100}
                        {entry}
                    />
                </div>
            {/key}
        {/if}
    </div>
</div>

<style lang="scss">
    @use "../../../scss/dropdown.scss" as *;

    .base-header {
        width: 100%;
        margin-bottom: 10px;

        &--no-banner {
            margin-top: 0 !important;
        }
        &--has-icon {
            margin-top: -6px;
        }
        &--pos-side {
            margin-bottom: 0px;
        }
        &__heading {
            margin: 0px 0px 0px 0px;
            position: relative;
            width: 100%;
            @include flex(flex-start, space-between);

            h1 {
                @include text-style(1, var(--fw-400-500), 2.2rem, "Geist Mono");
                margin-bottom: 0px;
            }
        }
        &__settings-btn {
            @include abs-top-right(0px, 0px);
            z-index: 100;
        }
    }
</style>