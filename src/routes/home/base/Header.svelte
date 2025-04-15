<script lang="ts">
    import { imageUpload } from "$lib/pop-ups"

	import TextEntry from "$components/TextEntry.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    export let options: BaseViewOptions
    export let showIcon: boolean
    export let onOptionUpdate: (options: BaseViewOptions) => void

    let settingsOpen = false

    function onViewOptions(optn: string) {
        if (optn === "banner") {
            options.banner.show = !options.banner.show
        }
        else if (optn === "icon") {
            options.header.icon.show = !options.header.icon.show
        }
        else if (optn === "entry") {
            options.header.showEntry = !options.header.showEntry
        }
        else if (optn === "header") {
            options.header.pos = options.header.pos === "top" ? "side" : "top"
        }
        else if (optn === "left margin") {
            options.leftMargin = !options.leftMargin
        }
        onOptionUpdate(options)
    }
    function openBannerImg() {
        imageUpload.init({
            onSubmitImg: (src: string) => {
                options.banner.img = { src, center: 50 }
                onOptionUpdate(options)
            }
        })
        settingsOpen = false
    }
</script>

<div 
    class="base-header"
    class:base-header--no-banner={!options.banner.show}
    class:base-header--has-icon={showIcon}
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
                            name: "Show",
                            active: options.banner.show,
                            onToggle: () => onViewOptions("banner")
                        },
                        {
                            name: "Replace",
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
                            active: options.header.icon.show,
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
                        minWidth: "155px",
                        fontSize: "1.32rem",
                        zIndex: 1000
                    },
                    position: { 
                        top: "28px", right: "0px" 
                    },
                    onListItemClicked: ({ name }) => {
                        if (name === "Replace") {
                            openBannerImg()
                        }
                    },
                    onClickOutside: () => {
                        settingsOpen = false
                    }
                }}
            />
        </div>
        {#if options.header.showEntry}
            {#key options.entry}
                <div style:width="100%">
                    <TextEntry 
                        id="header"
                        zIndex={100}
                        entry={options.entry}
                    />
                </div>
            {/key}
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
            margin-top: -6px;
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