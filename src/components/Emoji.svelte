<script lang="ts">
    import SearchIndex from "$lib/emojis-search-idx";
    import { EMOJI_BUTTON_SIZE } from "$lib/emojis"
  
    export let id: string
    export let emoji: any
    export let skin: number = 0
    export let focused: boolean
    
    export let onPointerOver : (pe: PointerEvent, name: string) => void
    export let onClick : (data: EmojiData) => void
    export let onPointerLeave: () => void
    export let onBlur: (e: FocusEvent) => void

    $: emoji = emoji || SearchIndex.get(emoji.id)
    $: emojiSkin = emoji?.skins[skin] || emoji?.skins[0]
    $: _focused = focused
</script>
  
  <button 
    {id}
    class="emoji"
    class:emoji--focused={_focused}
    style:width={`${EMOJI_BUTTON_SIZE}px`}
    style:height={`${EMOJI_BUTTON_SIZE}px`}
    data-name={emoji.name}
    on:pointerover={(pe) => onPointerOver(pe, emoji.name)}
    on:pointerleave={onPointerLeave}
    on:click={() => onClick(emoji)}
    on:blur={onBlur}
>
    <div class="emoji__bg">
        <span>
            {emojiSkin?.native}
        </span>
    </div>
  </button>

<style lang="scss">
    .emoji {
        opacity: 1 !important;

        &:focus {
            box-shadow: none;
        }
        &--focused &__bg,
        &:focus &__bg,
        &:hover &__bg {
            background-color: rgba(var(--textColor1), 0.1);
        }
        &__bg {
            @include center;
            transition: 0.1s ease-in-out;
            width: 100%;
            height: 100%;
            border-radius: 20px;
        }
        span {
            font-size: 20px;
            color: white !important;
        }
    }
</style>