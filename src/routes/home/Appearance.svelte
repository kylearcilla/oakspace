<script lang="ts">
	import { ModalType } from "$lib/enums"
	import { Icon } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { themePreviews } from "$lib/data-themes"
	import { kebabToNormal } from "$lib/utils-general"
	import { globalContext, themeState } from "$lib/store"
	import { findThemeFromName, setNewTheme } from "$lib/utils-appearance"

	import ThemeItem from "./ThemeItem.svelte"
	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import { updateUiOptions } from "$lib/api-general"
	import ConfirmBtns from "$components/ConfirmBtns.svelte"
	import DropdownList from "$components/DropdownList.svelte"

    $: hasAmbience = $globalContext.ambience?.active ?? false
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

    async function onSubmit() {
        if (hasAmbience) return

        const theme = findThemeFromName(clickedFlavor)
        if (!theme) return

        setNewTheme(theme)

        localStorage.setItem("theme-name", theme.name)
        window.location.reload()

        updateUiOptions({ theme: theme.name })
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
                <p style:margin-top="7px">
                    {`Choose a ${isDark ? "dark" : "light"} theme color palette.`}
                </p>
            </div>
            <button 
                data-dmenu-id="flavors"
                class="themes__flavor-dropdown-btn"
                class:themes__flavor-dropdown-btn--active={flavorOptionsOpen}
                on:click={() => flavorOptionsOpen = !flavorOptionsOpen}
            >
                {#if clickedFlavor}
                    {@const flavor = flavorOptions.find(flavor => flavor.name === clickedFlavor)}
                    {@const name = flavor?.name ?? ""}
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
                id="flavors"
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
                        minWidth: "80px",
                        zIndex: 2
                    },
                    position: {
                        top: "52px",
                        right: "0px"
                    }
                }}
            />
        </div>
        <div style:padding="29px 0px 0px 0px">
            <ConfirmBtns 
                disabled={hasAmbience}
                isLoading={false}
                onCancel={() => closeModal(ModalType.Themes)}
                weakDisable={hasAmbience}
                onOk={() => onSubmit()}
             />
        </div>
    </div>
</Modal>

<style lang="scss">
    @use "../../scss/dropdown.scss" as *;

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
            @include text-style(1, var(--fw-400-500), 1.6rem);
        }
        h2 {
            @include text-style(1, var(--fw-400-500), 1.5rem);
        }
        p {
            margin: 7px 0px 0px 0px;
            @include text-style(0.4, var(--fw-400-500), 1.45rem);
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
                @include text-style(1, var(--fw-400-500), 1.35rem);
            }
        }
        &__flavor-options {
            background-color: #1a1a1a;
        }
        &__arrow {
            opacity: 0.4;
            margin-left: 10px;
            transform: rotate(0deg);
        }
        &__color-circle {
            @include circle(14px);
            margin-right: 8px
        }
    }
    .dmenu {
        border-radius: 13px;
    }
</style>
