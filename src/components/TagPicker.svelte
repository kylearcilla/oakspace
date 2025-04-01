<script lang="ts">
    import { Icon } from "$lib/enums"
    import { themeState } from "$lib/store"
	import { TEST_TAGS } from "$lib/mock-data";
    import { getSwatchColors } from "$lib/utils-colors"
    
    import SvgIcon from "./SVGIcon.svelte"
	import BounceFade from "./BounceFade.svelte"

    export let isOpen: boolean
    export let tag: Tag | null
    export let position: CSSAbsPos
    export let onTagClicked: (newTag: Tag | null) => void
    export let useBounceFade = true
    

    $: isDarkTheme = $themeState.isDarkTheme

    function onSettingsClicked() {
    }
    function onNewTagClicked() {
    }
</script>

{#if useBounceFade}
    <BounceFade 
        id="tag-picker--dmenu"
        isHidden={!isOpen}
        onClickOutside={() => onTagClicked(null)}
        {position}
    >
        <div class="tag-picker" class:tag-picker--light={!isDarkTheme}>
            <div class="tag-picker__dmenu-container">
                <ul class="tag-picker__dmenu">
                    {#each TEST_TAGS as tagOption}
                        {@const colors = getSwatchColors({ color: tagOption.symbol.color, light: !isDarkTheme })}
                        {@const picked = tag?.name === tagOption.name}
                        <li 
                            class="tag-picker__dropdown-opt"
                            class:tag-picker__dropdown-opt--picked={picked}
                        >
                            <button
                                class="tag-picker__dropdown-opt-btn"
                                on:click={() => onTagClicked(tagOption)}
                            >
                                <div 
                                    class="tag"
                                    style:--tag-color-primary={tagOption.symbol.color.primary}
                                    style:--tag-color-1={colors[0]}
                                    style:--tag-color-2={colors[1]}
                                    style:--tag-color-3={colors[2]}
                                >
                                    <span class="tag__symbol">
                                        {tagOption.symbol.emoji}
                                    </span>
                                    <div class="tag__title" style:font-size="1.25rem">
                                        {tagOption.name}
                                    </div>
                                </div>
                                <div class="tag-picker__dropdown-opt-check">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            </button>
                            <button 
                                class="tag-picker__settings-btn"
                                on:click={onSettingsClicked}
                            >
                                <SvgIcon icon={Icon.Settings} />
                            </button>
                        </li>
                    {/each}
                </ul>
                <div class="tag-picker__dmenu-add">
                    <button on:click={onNewTagClicked}>
                        <span>New Tag</span>
                        <div style:opacity={0.45}>
                            <SvgIcon 
                                icon={Icon.Add} 
                                options={{ scale: 1.05, strokeWidth: 1.7 }} 
                            />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </BounceFade>
{:else}
    <div class="tag-picker" class:tag-picker--light={!isDarkTheme} class:hidden={!isOpen}>
        <div class="tag-picker__dmenu-container">
            <ul class="tag-picker__dmenu">
                {#each TEST_TAGS as tagOption}
                    {@const colors = getSwatchColors({ color: tagOption.symbol.color, light: !isDarkTheme })}
                    {@const picked = tag?.name === tagOption.name}
                    <li 
                        class="tag-picker__dropdown-opt"
                        class:tag-picker__dropdown-opt--picked={picked}
                    >
                        <button
                            class="tag-picker__dropdown-opt-btn"
                            on:click={() => onTagClicked(tagOption)}
                        >
                            <div 
                                class="tag"
                                style:--tag-color-primary={tagOption.symbol.color.primary}
                                style:--tag-color-1={colors[0]}
                                style:--tag-color-2={colors[1]}
                                style:--tag-color-3={colors[2]}
                            >
                                <span class="tag__symbol">
                                    {tagOption.symbol.emoji}
                                </span>
                                <div class="tag__title" style:font-size="1.25rem">
                                    {tagOption.name}
                                </div>
                            </div>
                            <div class="tag-picker__dropdown-opt-check">
                                <i class="fa-solid fa-check"></i>
                            </div>
                        </button>
                        <button 
                            class="tag-picker__settings-btn"
                            on:click={onSettingsClicked}
                        >
                            <SvgIcon icon={Icon.Settings} />
                        </button>
                    </li>
                {/each}
            </ul>
            <div class="tag-picker__dmenu-add">
                <button on:click={onNewTagClicked}>
                    <span>New Tag</span>
                    <div style:opacity={0.45}>
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 1.05, strokeWidth: 1.7 }} 
                        />
                    </div>
                </button>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    @import "../scss/dropdown.scss";

    .tag-picker {
        --tag-hov-brightness: 1.1;
        --optn-hov-opacity: 0.02;
        
        &--light {
            --tag-hov-brightness: 1.015;
            --optn-hov-opacity: 0.03;
        }
        
        &__dmenu-container {
            max-width: 210px;
            background-color: #151414;
            padding: 0px 0px 6.5px 0px;
            border-radius: 8px;
            width: 100%;
        }
        &__dmenu .tag {
            border-radius: 5px !important;
            transition: 0.1s ease-in-out;
            padding: 3px 5px 3.5px 7px !important;
        }
        &__dmenu .tag__symbol {
            font-size: 0.95rem;
        }
        &__dmenu {
            max-height: 230px;
            overflow-y: scroll;
            padding: 4px 0px 8px 0px;

            &::-webkit-scrollbar {
                display: none;
            }
        }
        &__settings-btn {
            @include abs-top-right(5px, 8px);
            @include not-visible;
            opacity: 0.25;
            transition: 0s ease-in-out;
        }
        &__dropdown-opt {
            border-radius: 6px;
            padding: 3.5px 8px 3.5px 4px;
            user-select: text;
            position: relative;
            width: calc(100% - 8px);
            margin: 0px 0px 1px 4px;
            cursor: pointer;

            &:hover {
                background-color: rgba(var(--textColor1), var(--optn-hov-opacity));
            }
            &:hover &-check {
                @include not-visible;
            }
            &--picked {
                background-color: rgba(var(--textColor1), 0.02);
            }
            &--picked &-check {
                @include visible(0.5);
            }
            &-check {
                @include not-visible;
            }
            i {
                font-size: 1.05rem;
                color: rgba(var(--textColor1), 1);
            }
        }
        &__dropdown-opt:hover &__settings-btn {
            @include visible(0.2);

            &:hover {
                opacity: 0.8 !important;
            }
        }
        &__dropdown-opt-btn {
            @include flex(center, space-between);
            width: 100%;
            margin-right: 20px;

            &:hover {
                filter: brightness(var(--tag-hov-brightness));
            }
        }
        &__dmenu-add {
            width: 100%;
            padding: 2px 0px 0px 0px;
            border-top: 1px solid rgba(var(--textColor1), 0.05);
        }
        &__dmenu-add button {
            @include flex(center, space-between);
            width: calc(100% - 25px);
            padding: 6px 3px 5px 6px;
            border-radius: 8px;
            margin: 0px 0px 0px 6px;
            opacity: 0.5;
            
            &:hover {
                opacity: 1;
            }
            &:active {
                transition: 0.14s ease-in-out;
            }
            span {
                @include text-style(1, var(--fw-400-500), 1.2rem);
            }
        }
    }
    .tag {
        margin-right: 10px;

        &__symbol {
            cursor: pointer;
            margin-right: 10px;
        }
        &__title {
            font-weight: var(--fw-400-500);
            margin-right: 9px;
            color: rgba(var(--tag-color-1), 1);
            cursor: pointer;
        }
    }
    .hidden {
        display: none;
    }
</style>