<script lang="ts">
	import { themeState } from "$lib/store"
	import { TEST_TAGS, clickOutside, getColorTrio, inlineStyling } from "$lib/utils-general"
	import { onMount } from "svelte"
	import SvgIcon from "./SVGIcon.svelte"
	import { Icon } from "$lib/enums"
	import BounceFade from "./BounceFade.svelte";
    
    $: isDarkTheme = $themeState.isDarkTheme

    export let tag: Tag | null
    export let isActive: boolean
    export let onTagOptionClicked: (newTag: Tag | null) => void
    export let onClickOutside: FunctionParam
    export let onClick: FunctionParam
    export let styling: StylingOptions | undefined = undefined

    let isPickerMounted = true
    let _isActive = true
    let removeTimeout: NodeJS.Timeout | null = null

    const TRANSITION_DURATIONS_MS = 200

    $: isEmpty = !tag
    $: toggleMenu(isActive)

    $: tagColor = tag ? getColorTrio(tag.symbol.color, !isDarkTheme) : null

    function toggleMenu(isActive: boolean) {
        // mount if active, mount on DOM, then toggle aniamtion
        if (isActive) {
            isPickerMounted = true
            requestAnimationFrame(() => _isActive = true)
        }
        // if timeout has been set but user quickly toggles active agin, remove the timeout
        if (isActive && removeTimeout) {
            clearTimeout(removeTimeout)
            removeTimeout = null    
        }
        // if inactive, allow the animation, then dismount
        if (!isActive) {
            _isActive = false
            removeTimeout = setTimeout(() => isPickerMounted = false, TRANSITION_DURATIONS_MS)
            removeTimeout = null
        }
    }
    function onClickNewTagBtn() {
    }

    onMount(() => console.log(inlineStyling(styling)))
</script>

<div class="tag-picker">
    <button 
        id="tag-picker--dropdown-btn"
        class="tag-picker__dropdown-btn dropdown-btn tag"
        class:tag-picker__dropdown-btn--active={_isActive}
        class:tag-picker__dropdown-btn--empty={!tag}
        style:--tag-color-primary={tag?.symbol.color.primary}
        style:--tag-color-1={tagColor ? tagColor[0] : ""}
        style:--tag-color-2={tagColor ? tagColor[1] : ""}
        style:--tag-color-3={tagColor ? tagColor[2] : ""}
        style={inlineStyling(styling)}
        on:click={onClick}
    >
        <!-- Tag Content -->
        {#if tag}
            <span class="tag__symbol">
                {tag.symbol.emoji}
            </span>
            <div class="tag__title dropdown-btn__title">
                {tag.name}
            </div>
        {:else}
            <div class="tag__title">
                None
            </div>
        {/if}
        <!-- Tag Dropdown Arrow -->
        {#if isEmpty || (!isEmpty && !isActive)}
            <div class="tag-picker__dropdown-btn-arrow">
                <SvgIcon 
                    icon={Icon.Dropdown}
                    options={{
                        scale: 1.1, height: 12, width: 12, strokeWidth: 1.4
                    }}
                />
            </div>
        {:else}
            <button 
                class="tag-picker__dropdown-btn-close"
                on:click|stopPropagation={() => onTagOptionClicked(null)}
            >
                <SvgIcon icon={Icon.Close} options={{ scale: 0.9, strokeWidth: 1.5 }} />
            </button>
        {/if}
    </button>
    <!-- Tag Dropdown Menu -->
    <BounceFade isHidden={!isActive}>
        <div 
            id="tag-picker--dropdown-menu"
            class="tag-picker__dropdown-menu-container"
            class:tag-picker__dropdown-menu-container--shown={_isActive}
            style:--trans-duration={`${TRANSITION_DURATIONS_MS}ms`}
            use:clickOutside on:click_outside={() => onClickOutside()}
        >
            <div class="tag-picker__dropdown-menu-title">
                <h3>Pick a Tag</h3>
                <div class="divider"></div>
            </div>
            <ul 
                class="tag-picker__dropdown-menu"
            >
                {#each TEST_TAGS as tagOption}
                    {@const tagOptColor = getColorTrio(tagOption.symbol.color, isDarkTheme)}
                    <li 
                        class="tag-picker__dropdown-option"
                        class:tag-picker__dropdown-option--picked={tag?.name === tagOption.name}
                    >
                        <button
                            class="tag-picker__dropdown-option-btn"
                            on:click={() => onTagOptionClicked(tagOption)}
                        >
                            <div 
                                class="tag"
                                style:--tag-color-primary={tagOption.symbol.color.primary}
                                style:--tag-color-1={tagOptColor[0]}
                                style:--tag-color-2={tagOptColor[1]}
                                style:--tag-color-3={tagOptColor[2]}
                            >
                                <span class="tag__symbol">
                                    {tagOption.symbol.emoji}
                                </span>
                                <div class="tag__title">
                                    {tagOption.name}
                                </div>
                            </div>
                            <div class="tag-picker__dropdown-option-check">
                                <i class="fa-solid fa-check"></i>
                            </div>
                        </button>
                        <button 
                            class="tag-picker__dropdown-option-settings-btn dropdown-btn dropdown-btn--settings"
                        >
                            <SvgIcon icon={Icon.Settings} />
                        </button>
                    </li>
                {/each}
            </ul>
            <div class="tag-picker__dropdown-menu-add">
                <div class="divider"></div>
                <button 
                    class="tag-picker__dropdown-menu-add-btn"
                    on:click={onClickNewTagBtn}
                >
                    <span>Create</span>
                    <div class="tag-picker__dropdown-menu-add-icon">
                        <SvgIcon icon={Icon.Add} options={{ scale: 0.7, strokeWidth: 1.7 }} />
                    </div>
                </button>
            </div>
        </div>
    </BounceFade>
</div>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .tag {
        &__symbol {
            cursor: pointer;
        }
        &__title {
            font-weight: 500;
            margin-right: 9px;
            cursor: pointer;
        }
    }

    .tag-picker {
        position: relative;
        transition: 0.12s ease-in-out;

        .divider {
        }
        &__dropdown-btn.tag {
            background-color: rgba(var(--tag-color-2), 1);
            padding: 4px 12px 4px 11px;
        }
        &__dropdown-btn {
            &--empty .tag__title {
                opacity: 0.45;
            }
            &--empty:hover {
                @include txt-color(0.04, "bg");
            }
        }
        &__dropdown-btn--active &__dropdown-btn-arrow {
            transform: rotate(-180deg);
        }
        &__dropdown-btn-arrow, &__dropdown-btn-close {
            opacity: 0.2;
            transition: 0.1s ease-in-out;
        }
        &__dropdown-btn-arrow {
            transition: 0.1s ease-in-out;
            transform: rotate(0deg);
            transform-origin: center;

            &--active {
                transform: rotate(-180deg);
            }
        }
        &__dropdown-btn-close {
            &:hover {
                opacity: 0.5;
            }
        }
        &__dropdown-menu-container {
            @include abs-top-left(28px);
            background-color: var(--dropdownMenuBgColor1);
            border: 1px solid rgba(white, 0.03);
            padding: 8px 4px 8px 8px;
            border-radius: 18px;
            z-index: 1000;
            width: 200px;
            transition: var(--trans-duration) opacity cubic-bezier(.2, .45, 0, 1),
                        var(--trans-duration) visibility cubic-bezier(.2, .45, 0, 1),
                        var(--trans-duration) transform cubic-bezier(.2, .45, 0, 1);
            transform: scale(0.9);
            @include not-visible;

            &--shown {
                transform: scale(1);
                @include visible;
            }
        }
        &__dropdown-menu {
            max-height: 200px;
            overflow-y: scroll;
            padding: 4px 0px 8px 0px;
        }
        &__dropdown-menu-title {
            h3 {
                padding: 0px 0px 0px 7px;
                @include text-style(1, 500, 1.3rem);
            }
            .divider {
                margin: 3px 0px 2px 0px;
            }
        }
        &__dropdown-option {
            transition: 0s ease-in-out;
            border-radius: 12px;
            padding: 4.5px 8px 4.5px 6px;
            user-select: text;
            width: calc(100% - 9px);
            position: relative;
            cursor: pointer;
            
            &:hover {
                @include txt-color(0.05, "bg");
            }
            &:hover &-check {
                display: none;
            }
            &:hover &-settings-btn {
                @include visible(0.2);
                @include txt-color(0, "bg");

                &:hover {
                    @include txt-color(0.05, "bg");
                    opacity: 0.6;
                }
            }
            &--picked &-check {
                @include visible(0.5);
            }
            &-check {
                @include not-visible;
            }
            &-settings-btn {
                @include not-visible;
                @include abs-top-right(5px, 5px);   
            }
        }
        &__dropdown-option-btn {
            @include flex(center, space-between);
            width: 100%;
        }
        &__dropdown-option .tag {
            border-radius: 8px;
            background-color: rgba(var(--tag-color-2), 1);
            padding: 2.5px 5px 2.5px 9px;
            // border: 1px solid rgba(var(--tag-color-1), 0.03);
            
            &__title {
                font-weight: 600;
            }
        }
        &__dropdown-menu-add {
            width: 100%;

            &:hover &-btn {
                opacity: 0.8;
            }
            &-btn {
                opacity: 0.5;
            }
            &-icon {
                opacity: 0.8;
            }
        }
        &__dropdown-menu-add .divider {
            margin: 2px 0px 5px 0px;
        }
        &__dropdown-menu-add-btn {
            @include flex(center, space-between);
            width: calc(100% - 14px);
            padding: 6px 8px 6px 8px;
            border-radius: 12px;
            margin-left: -3px;
            transition: 0.02s ease-in-out;

            &:hover {
                @include txt-color(0.014, "bg");
            }
            &:active {
                transition: 0.14s ease-in-out;
            }

            span {
                @include text-style(1, 400, 1.28rem);
            }
        }
    }
</style>