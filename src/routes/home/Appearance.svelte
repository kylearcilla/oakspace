<script lang="ts">
	import { ModalType } from "$lib/enums"
	import { Icon } from "../../lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { themePreviews } from "../../lib/data-themes"
	import { capitalize } from "../../lib/utils-general"
	import { globalContext, themeState } from "$lib/store"
	import { findThemeFromName, setNewTheme } from "../../lib/utils-appearance"

	import ThemeItem from "./ThemeItem.svelte"
	import Modal from "../../components/Modal.svelte"
	import SvgIcon from "../../components/SVGIcon.svelte"
	import BounceFade from "../../components/BounceFade.svelte"

    $: hasAmbience = $globalContext.ambience.active
    $: isDark = $themeState.isDarkTheme
    $: state = $themeState

    $: clickedType   = isDark ? "dark" : "light"
    $: clickedFlavor = clickedType === "dark" ? state.darkTheme : state.lightTheme

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
        setNewTheme(findThemeFromName(clickedFlavor))
    }
    function onFlavorSelected(name: string) {
        clickedFlavor = name
        flavorOptionsOpen = false
    }
</script>

<Modal 
    options={{ 
        borderRadius: "17px",
        overflowY: "visible",
        overflowX: "visible"
    }}
    onClickOutSide={() => closeModal(ModalType.Themes)}
>
    <div 
        class="themes" 
        class:themes--light={!isDark}
    >
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
                    {@const { name, signaturecolor } = flavor}
                    {@const title = (name === "dark" || name === "light") ? "Basic" : capitalize(name)}
                    <div 
                        class="themes__color-circle"
                        style:margin-right="12px"
                        style:background-color={signaturecolor}
                    >
                    </div>
                    <span>{title}</span>
                    <div class="themes__arrow smooth-bounce">
                        <SvgIcon 
                            icon={Icon.Dropdown}
                            options={{
                                scale: 1.1, height: 12, width: 12, strokeWidth: 1.2
                            }}
                        />
                    </div>
                {/if}
            </button>
            <BounceFade
                id="flavors--dmenu"
                isHidden={!flavorOptionsOpen}
                position={{
                    top: "62px",
                    right: "-10px"
                }}
                onClickOutside={() => {
                    flavorOptionsOpen = false
                }}
            >
                <div 
                    class="dmenu" 
                    class:dmenu--light={!isDark}
                >
                    {#each flavorOptions as flavor}
                        {@const { name, signaturecolor } = flavor}
                        {@const title = (name === "dark" || name === "light") ? "Basic" : capitalize(name)}
                        {@const picked = name === "basic"}

                        <div 
                            class="dmenu__option"
                            class:dmenu__option--selected={picked}
                        >
                            <button 
                                class="dmenu__option-btn"
                                on:click={() => onFlavorSelected(name)}
                            >
                                <div class="flx-algn-center">
                                    <div 
                                        class="themes__color-circle"
                                        style:background-color={signaturecolor}
                                    >
                                    </div>
                                    <span class="dmenu__option-text" style:margin-right="12px">
                                        {title}
                                    </span>
                                </div>
                                <div class="dmenu__option-icon dmenu__option-icon--check">
                                    <i class="fa-solid fa-check"></i> 
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            </BounceFade>
        </div>
        <div class="themes__btns">
            <button on:click={() => closeModal(ModalType.Themes)}>
                Close
            </button>
            <button 
                title={hasAmbience ? "Cannot change when you're in your workspace." : ""}
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
        width: 510px;
        padding: 19px 27px 22px 24px;
        overflow: visible;
        h1 {
            @include text-style(1, 400, 1.8rem, "DM Mono");
        }
        h2 {
            @include text-style(1, 400, 1.55rem, "DM Mono");
        }
        p {
            margin: 5px 0px 0px 0px;
            @include text-style(0.4, 400, 1.5rem);
        }
        &__flavor {
            border-top: 0.5px solid rgba(var(--textColor1), 0.08);
            margin-top: 27px;
            padding-top: 15px;
            position: relative;
            @include flex(center, space-between);
        }
        &__flavor-dropdown-btn {
            @include flex(center, space-between);
            padding: 7px 12px 8px 12px;
            border-radius: 20px;
            margin-right: -12px;

            &--active .themes__arrow {
                transform: rotate(-180deg);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.035);
            }
            &:hover .themes__arrow {
                @include visible(0.4);
            }
            span {
                @include text-style(1, 400, 1.5rem, "DM Mono");
            }
        }
        &__flavor-options {
            background-color: #1a1a1a;
        }
        &__arrow {
            opacity: 0.4;
            margin-left: 10px;
            transform: rotate(0deg);
            @include not-visible;
        }
        &__color-circle {
            @include circle(14px);
            margin-right: 8px
        }
        &__btns {
            @include flex(center, space-between);
            margin-top: 35px;

            button {
                @include text-style(1, 500, 1.5rem);
                background-color: rgba(var(--textColor1), 0.035);
                padding: 11px 12px 13px 15px;
                border-radius: 8px;
                width: calc(100% - 150px);
                text-align: center;
            }
            button:hover {
                background-color: rgba(var(--textColor1), 0.05);
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
            @include text-style(1, 400, 1.4rem, "DM Mono");
        }
        &__option-btn {
            @include flex(center, space-between);
        }
    }
</style>
