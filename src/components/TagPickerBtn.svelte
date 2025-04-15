<script lang="ts">
    import { Icon } from "$lib/enums"
    import { themeState } from "$lib/store"
	import { tagPicker } from "$lib/pop-ups"
    import { getColorTrio } from "$lib/utils-colors"
    import { inlineStyling } from "$lib/utils-general"
    
    import SvgIcon from "./SVGIcon.svelte"

    export let tag: Tag | null
    export let onChoose: (newTag: Tag | null) => void
    export let styling: StylingOptions | undefined = undefined

    let { fontSize = "1.285rem" } = styling || {}
    let pickerOpen = false

    $: empty = !tag
    $: isDarkTheme = $themeState.isDarkTheme
    $: tagColor = tag ? getColorTrio(tag.symbol.color, !isDarkTheme) : null


    function onTagClicked(newTag: Tag | null) {
        if (newTag) {
            onChoose(newTag)
        } 
        tagPicker.close()
        pickerOpen = false
    }
    function toggleTagPicker() {
        pickerOpen = !pickerOpen
        pickerOpen ? initTagPicker() : tagPicker.close()
    }

    function initTagPicker() {
        tagPicker.init({
            onClose: () => {
                pickerOpen = false
            },
            props: {
                tag,
                onTagClicked
            }
        })
    }
</script>

<div class="tag-picker-btn" class:tag-picker-btn--light={!isDarkTheme}>
    <button 
        data-dmenu-id="tag-picker"
        class="tag-picker-btn__dbtn dbtn"
        class:tag-picker-btn__dbtn--empty={empty}
        class:tag-picker-btn__dbtn--colored={!empty}
        class:dbtn--no-bg={false}
        class:dbtn--empty={empty}
        style:--tag-color-primary={tag?.symbol.color.primary}
        style:--tag-color-1={tagColor ? tagColor[0] : ""}
        style:--tag-color-2={tagColor ? tagColor[1] : ""}
        style:--tag-color-3={tagColor ? tagColor[2] : ""}
        style={inlineStyling(styling)}
        on:click={() => toggleTagPicker()}
    >
        {#if tag}
            <div class="flx-center">
                <span 
                    class="tag__symbol"
                    style:font-size={fontSize}
                >
                    {tag.symbol.emoji}
                </span>
                <div 
                    class="tag__title dbtn__title"
                    style:font-size={fontSize}
                >
                    {tag.name}
                </div>
            </div>
        {:else}
            <div class="dbtn__title">
                None
            </div>
        {/if}
        {#if empty || (!empty && !pickerOpen)}
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
                on:click|stopPropagation={() => {
                    onChoose(null)
                    tagPicker.close()
                    pickerOpen = false
                }}
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
</div>

<style lang="scss">
    @import "../scss/dropdown.scss";

    .tag-picker-btn {
        position: relative;
        width: 100%;

        --tag-hov-brightness: 1.1;
        
        &--light {
            --tag-hov-brightness: 1.015;
        }
        &__dbtn {
            padding: 6.5px 10px 7.5px 10px;
            height: 15px;
            border-radius: 7px !important;
            @include flex(center, space-between);
            
            &--colored {
                background-color: rgba(var(--tag-color-2), 1) !important;
                color: rgba(var(--tag-color-1), 1);
            }
            &--colored:hover {
                background-color: rgba(var(--tag-color-2), 1) !important;
                filter: brightness(var(--tag-hov-brightness));
            }
        }
    }
    .tag {
        border-radius: 12px !important;

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
    .dbtn__title {
        font-size: 1.285rem;
    }
</style>
