<script lang="ts">
    import { Icon } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { inlineStyling } from "$lib/utils-general"
	import { TAGS } from "../tests/routines/routines.data"
    import { getColorTrio, getSwatchColors } from "$lib/utils-colors"
    
	import SvgIcon from "./SVGIcon.svelte"
	import BounceFade from "./BounceFade.svelte"

    export let tag: Tag | null
    export let onTagClicked: (newTag: Tag | null) => void
    export let styling: StylingOptions | undefined = undefined

    let menu = false

    $: empty = !tag
    $: isDarkTheme = $themeState.isDarkTheme
    $: tagColor = tag ? getColorTrio(tag.symbol.color, !isDarkTheme) : null

    function onSettingsClicked() {

    }
    function onNewTagClicked() {

    }
    function onClick() {
        menu = !menu
    }
</script>

<div class="tag-picker" class:tag-picker--light={!isDarkTheme}>
    <button 
        id="tag-picker--dbtn"
        class="tag-picker__dbtn dbtn"
        class:tag-picker__dbtn--empty={empty}
        class:tag-picker__dbtn--colored={!empty}
        class:dbtn--no-bg={false}
        class:dbtn--empty={empty}
        style:--tag-color-primary={tag?.symbol.color.primary}
        style:--tag-color-1={tagColor ? tagColor[0] : ""}
        style:--tag-color-2={tagColor ? tagColor[1] : ""}
        style:--tag-color-3={tagColor ? tagColor[2] : ""}
        style={inlineStyling(styling)}
        on:click={onClick}
    >
        {#if tag}
            <span class="tag__symbol">
                {tag.symbol.emoji}
            </span>
            <div class="tag__title dbtn__title">
                {tag.name}
            </div>
        {:else}
            <div class="dbtn__title">
                None
            </div>
        {/if}
        {#if empty || (!empty && !menu)}
            <div class="dbtn__icon dbtn__icon--arrow">
                <SvgIcon 
                    icon={Icon.Dropdown}
                    options={{ 
                        scale: 1.3,
                        color: tagColor ? `rgba(${tagColor[0] ?? ""}, 1)` : undefined
                    }}
                />
            </div>
        {:else}
            <button
                class="dbtn__icon dbtn__icon--close"
                on:click={() => onTagClicked(null)}
            >
                <SvgIcon 
                    icon={Icon.Close} 
                    options={{ 
                        scale: 0.96, 
                        strokeWidth: 2, 
                        height: 11, 
                        width: 11,
                        color: tagColor ? `rgba(${tagColor[0] ?? ""}, 1)` : undefined
                    }}
                />
            </button>
        {/if}
    </button>
    <BounceFade 
        id="tag-picker--dmenu"
        isHidden={!menu}
        onClickOutside={() => menu = false}
        position={{ 
            top: "0px", left: "0px" 
        }}
    >
        <div class="tag-picker__dmenu-container">
            <ul class="tag-picker__dmenu">
                {#each TAGS as tagOption}
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
                                <div class="tag__title">
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
                    <span>Create New Tag</span>
                    <div style:opacity={0.45}>
                        <SvgIcon 
                            icon={Icon.Add} 
                            options={{ scale: 0.98, strokeWidth: 1.7 }} 
                        />
                    </div>
                </button>
            </div>
        </div>
    </BounceFade>
</div>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .tag-picker {
        position: relative;

        --tag-hov-brightness: 1.1;
        --optn-hov-opacity: 0.02;
        
        &--light {
            --tag-hov-brightness: 1.015;
            --optn-hov-opacity: 0.03;
        }
        &__dbtn {
            padding: 5px 10px 7px 9px;
            border-radius: 7px !important;
            
            &--colored {
                background-color: rgba(var(--tag-color-2), 1) !important;
                color: rgba(var(--tag-color-1), 1);
            }
            &--colored:hover {
                background-color: rgba(var(--tag-color-2), 1) !important;
                filter: brightness(var(--tag-hov-brightness));
            }
        }

        &__dmenu-container {
            @include abs-top-left(28px);
            @include contrast-bg("bg-3");
            padding: 0px 0px 6.5px 0px;
            z-index: 1000;
            border-radius: 12px;
        }
        &__dmenu .tag {
            border-radius: 7px !important;
            transition: 0.1s ease-in-out;
            padding: 4px 5px 4.5px 7px !important;
        }
        &__dmenu .tag__symbol {
            font-size: 0.95rem;
        }
        &__dmenu .tag__title {
            font-weight: 500 !important;
            font-size: 1.2rem !important;
        }
        &__dmenu {
            max-height: 290px;
            overflow-y: scroll;
            padding: 4px 0px 8px 0px;
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
            width: calc(100% - 18px);
            margin: 0px 10px 1px 4px;
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
                font-size: 1.25rem;
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
            border-top: 1.5px dashed rgba(var(--textColor1), 0.065);
            padding: 6px 0px 0px 0px;
        }
        &__dmenu-add button {
            @include flex(center, space-between);
            width: calc(100% - 31px);
            padding: 7px 8px 9px 10px;
            border-radius: 8px;
            margin: 0px 0px 0px 6px;
            opacity: 0.9;
            background-color: rgba(var(--textColor1), 0.045);
            
            &:hover {
                opacity: 1;
                background-color: rgba(var(--textColor1), 0.07);
            }
            &:active {
                transition: 0.14s ease-in-out;
            }
            span {
                @include text-style(1, var(--fw-400-500), 1.25rem);
            }
        }
    }
    .tag {
        border-radius: 12px !important;

        &__symbol {
            cursor: pointer;
        }
        &__title {
            font-weight: var(--fw-400-500);
            font-size: 1.285rem;
            margin-right: 9px;
            color: rgba(var(--tag-color-1), 1);
            cursor: pointer;
        }
    }
    .dbtn__title {
        font-size: 1.285rem;
    }
</style>