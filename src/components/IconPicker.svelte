<script lang="ts">
    import { iconPicker } from "../lib/utils-home"
	import { randomArrayElem } from "../lib/utils-general"

    import BounceFade from "./BounceFade.svelte"

    const { onChooseType, state: picker } = iconPicker

    $: position = $picker.position
    $: isOpen   = $picker.isOpen
    $: id   = $picker.id

</script>

<BounceFade 
    id={`${id}--dmenu`}
    zIndex={300}
    isHidden={!isOpen}
    position={{
        top: `${position.top}px`,
        left: `${position.left}px`
    }}
    onClickOutside={() => onChooseType(null)}
>
    <div class="icon-picker">
        <button 
            class="icon-picker__emoji"
            on:click={() => onChooseType("emoji")}
        >
            <div class="icon-picker__icon" style="opacity: 0.2; filter: saturate(0);">
                {randomArrayElem(["👏", "🌞", "🎈", "🙌", "🌙", "🤙"])}
            </div>
            <span>Emoji</span>
        </button>
        <button 
            class="icon-picker__img"
            on:click={() => onChooseType("img")}
        >
            <div class="icon-picker__icon">
                <svg 
                    viewBox="0 0 19 16" class="photo" 
                    style="width: 19px; height: 19px; display: block; fill: inherit; flex-shrink: 0; margin-right: 8px; color: rgba(255, 255, 255, 0.443);"
                >
                    <path 
                        d="M17.938 12.18c.03.755-.146 1.33-.532 1.726-.385.396-.971.594-1.758.594H2.992c-.65 0-1.143-.185-1.476-.555-.334-.37-.51-.916-.532-1.64l2.946-2.64a1.66 1.66 0 01.484-.33 1.292 1.292 0 011.063.009c.182.073.354.182.515.328l1.446 1.305L10.96 7.82c.182-.156.37-.273.562-.351a1.607 1.607 0 011.22.008c.202.078.39.197.562.359l4.633 4.344zM6.296 8.008a1.85 1.85 0 01-.945-.25 1.93 1.93 0 01-.68-.68 1.846 1.846 0 01-.25-.945c0-.339.083-.651.25-.938a1.93 1.93 0 01.68-.68c.286-.171.601-.257.945-.257s.656.086.937.258c.282.166.506.393.672.68.172.286.258.598.258.937a1.8 1.8 0 01-.258.945c-.166.287-.39.513-.672.68-.28.166-.593.25-.937.25zm-3.492 7.148c-.844 0-1.482-.213-1.914-.64-.433-.428-.649-1.058-.649-1.891V3.109c0-.833.216-1.463.649-1.89C1.323.786 1.96.57 2.805.57H16.18c.849 0 1.49.216 1.922.649.432.427.648 1.057.648 1.89v9.516c0 .833-.216 1.463-.648 1.89-.433.428-1.073.641-1.922.641H2.805zm.093-1.531h13.196c.36 0 .635-.094.828-.281.193-.193.289-.477.289-.852v-9.25c0-.375-.096-.656-.29-.844-.192-.192-.468-.289-.827-.289H2.898c-.364 0-.643.097-.836.29-.187.187-.28.468-.28.843v9.25c0 .375.093.659.28.852.193.187.472.281.836.281z"
                    >
                    </path>
                </svg>
            </div>
            <span>Image</span>
        </button>
    </div>
</BounceFade>

<style lang="scss">
    .icon-picker {
        background-color: var(--navMenuBgColor);
        border: 1px solid rgba(var(--textColor1), 0.05);
        padding: 7px 8px;
        border-radius: 13px;
        @include flex(center, space-between);

        button {
            border-radius: 11px;
            width: 80px;
            height: 80px;
            background: rgba(var(--textColor1), 0.02);
            text-align: center;

            &:hover {
                background: rgba(var(--textColor1), 0.05);
                box-shadow: rgba(var(--textColor1), 0.06) 0px 0px 0px 1.5px inset,
                            rgba(var(--textColor1), 0.04) 0px 0px 0px 2.5px;
            }
            &:first-child {
                margin-right: 7px;
            }
            &:hover span {
                opacity: 1;
            }
            &:hover svg {
                opacity: 0.6;
            }
        }
        span {
            margin-top: 8px;
            display: block;
            opacity: 0.5;
            @include text-style(0.5, 500, 1.25rem, "Manrope");
        }
        &__icon {
            @include center;
            height: 35px;
            font-size: 2.8rem;
            transition: 0.1s ease-in-out;
        }
        &__emoji:hover &__icon {
            opacity: 1 !important;
            filter: saturate(1) !important; 
        }
        &__img {
            fill: rgba(var(--textColor1), 1);  
            
            svg {
                opacity: 0.15;
                transform: scale(1.4);
                margin: 3px 0px 0px 7px;
            }
        }
    }
</style>