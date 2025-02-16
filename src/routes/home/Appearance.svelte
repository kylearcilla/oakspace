<script lang="ts">
	import { ModalType } from "$lib/enums"
	import { Icon } from "../../lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { themePreviews } from "../../lib/data-themes"
	import { kebabToNormal } from "../../lib/utils-general"
	import { globalContext, themeState } from "$lib/store"
	import { findThemeFromName, setNewTheme } from "../../lib/utils-appearance"

	import ThemeItem from "./ThemeItem.svelte"
	import Modal from "../../components/Modal.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import DropdownList from "../../components/DropdownList.svelte"

    $: hasAmbience = $globalContext.ambience.active
    $: isDark = $themeState.isDarkTheme
    $: state = $themeState

    $: clickedType   = isDark ? "dark" : "light"
    $: clickedFlavor = clickedType === "dark" ? state.darkTheme : state.lightTheme
    $: selectedItem  = clickedFlavor === "dark" || clickedFlavor === "light" ? "basic" : clickedFlavor

    $: flavorOptions = themePreviews.filter(theme => {
        if (clickedType === "dark") {
            return theme.isDark
        }
        else {
            return !theme.isDark
        }
    })
    let flavorOptionsOpen = false

    function onSubmit() {
        if (hasAmbience) return

        const theme = findThemeFromName(clickedFlavor)
        setNewTheme(theme)

        localStorage.setItem("theme-name", theme.name)
        window.location.reload()
    }
    function onFlavorSelected(name: string) {
        clickedFlavor = name
        flavorOptionsOpen = false
    }
</script>

<svelte:window on:keydown={e => e.key === "Enter" && onSubmit()}/>

<Modal 
    options={{ 
        borderRadius: "17px",
        overflowY: "visible",
        overflowX: "visible"
    }}
    onClickOutSide={() => closeModal(ModalType.Themes)}
>
    <div class="themes" class:themes--light={!isDark}>
        <h1>Themes</h1>
        <p>Style your space according to your taste.</p>
        <div 
            class="flx" 
            style:margin-top="22px"
        >
            <ThemeItem 
                type="dark"
                clicked={clickedType === "dark"}
                onClick={() => clickedType = "dark"}
            />
            <ThemeItem 
                type="light"
                clicked={clickedType === "light"}
                onClick={() => clickedType = "light"}
            />
        </div>
        <div class="themes__flavor">
            <div>
                <h2>Flavor</h2>
                <p style:margin-top="4px">
                    {`Choose a ${isDark ? "dark" : "light"} theme color palette.`}
                </p>
            </div>
            <button 
                id="flavors--dbtn"
                class="themes__flavor-dropdown-btn"
                class:themes__flavor-dropdown-btn--active={flavorOptionsOpen}
                on:click={() => flavorOptionsOpen = !flavorOptionsOpen}
            >
                {#if clickedFlavor}
                    {@const flavor = flavorOptions.find(flavor => flavor.name === clickedFlavor)}
                    {@const name = flavor.name}
                    {@const title = (name === "dark" || name === "light") ? "Basic" : kebabToNormal(name, true)}
                    <span>{title}</span>
                    <div class="themes__arrow smooth-bounce">
                        <SvgIcon 
                            icon={Icon.Dropdown}
                            options={{
                                scale: 1.25, height: 12, width: 12, strokeWidth: 1.2
                            }}
                        />
                    </div>
                {/if}
            </button>
            <DropdownList 
                id="flavors--dmenu"
                isHidden={!flavorOptionsOpen}
                options={{
                    pickedItem: kebabToNormal(selectedItem, true),
                    listItems: flavorOptions.map(f => ({ 
                        name: (f.name === "dark" || f.name === "light") ? "Basic" : kebabToNormal(f.name, true)
                    })),
                    onListItemClicked: ({ idx }) => {
                        const flavor = flavorOptions[idx].name
                        onFlavorSelected(flavor)
                        flavorOptionsOpen = false
                    },
                    onClickOutside: () => {
                        flavorOptionsOpen = false
                    },
                    styling: {
                        width: "150px",
                        zIndex: 2,
                        fontFamily: "Geist Mono"
                    },
                    position: {
                        top: "54px",
                        right: "0px"
                    }
                }}
            />
        </div>
        <div class="themes__btns">
            <button on:click={() => closeModal(ModalType.Themes)}>
                Close
            </button>
            <button 
                title={hasAmbience ? "Cannot change while inside workspace." : ""}
                disabled={hasAmbience}
                on:click={onSubmit}
            >
                Done
            </button>
        </div>
    </div>
</Modal>

<style lang="scss">
    @import "../../scss/dropdown.scss";

    .themes {
        width: 540px;
        padding: 16px 27px 20px 24px;
        overflow: visible;

        --button-bg-opacity: 0.035;
        --flavor-btn-opacity: 0.035;

        &--light {
            --button-bg-opacity: 0.055;
            --flavor-btn-opacity: 0.055;
        }
        &--light p {
            color: rgba(var(--textColor1), 0.55) !important;
        }
        h1 {
            @include text-style(1, var(--fw-400-500), 1.8rem, "Geist Mono");
        }
        h2 {
            @include text-style(1, var(--fw-400-500), 1.55rem, "Geist Mono");
        }
        p {
            margin: 4px 0px 0px 0px;
            @include text-style(0.4, 400, 1.5rem);
        }
        &__flavor {
            border-top: var(--divider-border);
            margin-top: 27px;
            padding-top: 13px;
            position: relative;
            @include flex(center, space-between);
        }
        &__flavor-dropdown-btn {
            @include flex(center, space-between);
            padding: 6px 12px 7px 15px;
            border-radius: 20px;
            margin-right: 0px;
            background-color: rgba(var(--textColor1), var(--flavor-btn-opacity));

            &--active .themes__arrow {
                transform: rotate(-180deg);
            }
            &:hover {
                background-color: rgba(var(--textColor1), calc(var(--flavor-btn-opacity) + 0.035));
            }
            &:hover .themes__arrow {
                @include visible(0.4);
            }
            span {
                @include text-style(1, var(--fw-400-500), 1.35rem, "Geist Mono");
            }
        }
        &__flavor-options {
            background-color: #1a1a1a;
        }
        &__arrow {
            opacity: 0.4;
            margin-left: 10px;
            transform: rotate(0deg);
            // @include not-visible;
        }
        &__color-circle {
            @include circle(14px);
            margin-right: 8px
        }
        &__btns {
            @include flex(center, space-between);
            margin-top: 45px;

            button {
                @include text-style(1, var(--fw-400-500), 1.5rem);
                background-color: rgba(var(--textColor1), var(--button-bg-opacity));
                padding: 11px 12px 13px 15px;
                border-radius: 8px;
                width: calc(100% - 150px);
                text-align: center;
            }
            button:hover {
                background-color: rgba(var(--textColor1), calc(var(--button-bg-opacity) + 0.035));
            }
            button:first-child {
                margin-right: 10px;
                width: 140px;
            }
        }
    }
    .dmenu {
        border-radius: 13px;
        span {
            @include text-style(1, 400, 1.4rem, "Geist Mono");
        }
        &__option-btn {
            @include flex(center, space-between);
        }
    }
</style>
