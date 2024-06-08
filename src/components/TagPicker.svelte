<script lang="ts">
	import { themeState } from "$lib/store"
	import { TEST_TAGS, clickOutside, getColorTrio, inlineStyling } from "$lib/utils-general"
	import SvgIcon from "./SVGIcon.svelte"
	import { Icon } from "$lib/enums"
	import BounceFade from "./BounceFade.svelte";
	import { TAGS } from "../tests/routines/routines.data";


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
    $: isDarkTheme = $themeState.isDarkTheme
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
</script>

<div 
    class="tag-picker"
    class:tag-picker--light={!isDarkTheme}
>
    <button 
        id="tag-picker--dropdown-btn"
        class="tag-picker__dropdown-btn dropdown-btn tag"
        class:tag--is-light={tag?.symbol.color.isLight && !isDarkTheme}
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
                <SvgIcon 
                    icon={Icon.Close} 
                    options={{ 
                        scale: 0.9, height: 12, width: 12, strokeWidth: 1.6
                    }} 
                />
            </button>
        {/if}
    </button>
    <!-- Tag Dropdown Menu -->
    <BounceFade 
        isHidden={!isActive}
        position={{ top: "0px", left: "0px" }}
    >
        <div 
            id="tag-picker--dropdown-menu"
            class="tag-picker__dropdown-menu-container"
            class:tag-picker__dropdown-menu-container--shown={_isActive}
            style:--trans-duration={`${TRANSITION_DURATIONS_MS}ms`}
            use:clickOutside on:click_outside={() => onClickOutside()}
        >
            <ul class="tag-picker__dropdown-menu">
                {#each TAGS as tagOption}
                    {@const tagOptColor = getColorTrio(tagOption.symbol.color, !isDarkTheme)}
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
                                class:tag--is-light={tagOption.symbol.color.isLight && !isDarkTheme}
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
                        <!-- <button 
                            class="tag-picker__dropdown-option-settings-btn dropdown-btn dropdown-btn--settings"
                        >
                            <SvgIcon icon={Icon.Settings} />
                        </button> -->
                    </li>
                {/each}
            </ul>
            <div class="tag-picker__dropdown-menu-add">
                <div class="divider"></div>
                <button 
                    class="tag-picker__dropdown-menu-add-btn"
                    on:click={onClickNewTagBtn}
                >
                    <span>Add New</span>
                    <div class="tag-picker__dropdown-menu-add-icon">
                        <SvgIcon icon={Icon.Add} options={{ scale: 0.92, strokeWidth: 1.7 }} />
                    </div>
                </button>
            </div>
        </div>
    </BounceFade>
</div>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .tag {
        border-radius: 12px !important;

        &__symbol {
            cursor: pointer;
        }
        &__title {
            font-weight: 500;
            font-size: 1.25rem;
            margin-right: 9px;
            cursor: pointer;
            color: rgba(var(--tag-color-1), 1);
        }
    }

    .tag-picker {
        position: relative;
        transition: 0.12s ease-in-out;

        &--light &__dropdown-menu-container {
            border: 1px solid rgba(var(--textColor1), 0.075);
        }
        &--light &__dropdown-menu-container h3 {
            @include text-style(1, 600);
        }
        &--light &__dropdown-menu-add {
            border-top: 1px solid rgba(var(--textColor1), 0.1);
        }
        &--light &__dropdown-option:hover {
            @include txt-color(0.05, "bg");
        }
        &--light &__dropdown-menu-add-btn {
            opacity: 0.8;
            &:hover {
                opacity: 1 !important;
            }
            span {
                @include text-style(1, 600);   
            }
        }
        &--light h3 {
            @include text-style(1, 500);
        }
        &--light &__dropdown-option:hover {
            filter: brightness(1);
        }
        
        &__dropdown-btn.tag {
            background-color: rgba(var(--tag-color-2), 1);
            padding: 4px 12px 4px 11px;
        }
        &__dropdown-btn--empty {
            .tag__title {
                opacity: 0.6;
            }
            &:hover {
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
        &__dropdown-btn-close:hover {
            opacity: 0.5;
        }
        &__dropdown-menu-container {
            @include abs-top-left(28px);
            background-color: var(--bg-2);
            padding: 2px 0px 8px 0px;
            border-radius: 10px;
            z-index: 1000;
            width: 150px;
            transition: var(--trans-duration) opacity cubic-bezier(.2, .45, 0, 1),
                        var(--trans-duration) visibility cubic-bezier(.2, .45, 0, 1),
                        var(--trans-duration) transform cubic-bezier(.2, .45, 0, 1);
            transform: scale(0.9);
            border: 1px solid rgba(var(--textColor1), 0.04);
            @include not-visible;

            &--shown {
                transform: scale(1);
                @include visible;
            }
        }
        &__dropdown-menu .tag {
            border-radius: 6px !important;
            transition: 0.1s ease-in-out;
            margin-right: 7px;
            min-width: 0px;
        }
        &__dropdown-menu .tag__symbol {
            font-size: 0.85rem;
        }
        &__dropdown-menu .tag__title {
            font-size: 1.05rem;
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
            border-radius: 9px;
            padding: 3px 9px 3px 4px;
            user-select: text;
            position: relative;
            width: calc(100% - 9px);
            margin-left: 4px;
            cursor: pointer;
            
            &:hover {
                @include txt-color(0.01, "bg");
                filter: brightness(1.2);
            }
            // &:hover &-check {
            //     display: none;
            // }
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
            
            &__title {
                font-weight: 600;
            }
        }
        &__dropdown-menu-add {
            width: 100%;
            border-top: 1px solid rgba(var(--textColor1), 0.05);

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
            width: calc(100% - 22px);
            padding: 2px 0px 0px 10px;
            border-radius: 12px;
            margin-left: 0px;
            transition: 0.02s ease-in-out;

            &:active {
                transition: 0.14s ease-in-out;
            }
            span {
                @include text-style(1, 400, 1.1rem);
            }
        }
    }
</style>