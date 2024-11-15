<script lang="ts">
	import { ModalType } from "$lib/enums"
    import { capitalize } from "$lib/utils-general"
	import { globalContext, mediaEmbedStore, ytPlayerStore } from "$lib/store"

	import BounceFade from "../components/BounceFade.svelte"
	import RangeInput from "../components/RangeInput.svelte"
	import DropdownBtn from "../components/DropdownBtn.svelte"
    import DropdownList from "../components/DropdownList.svelte"
	import { openModal, updateAmbience } from "$lib/utils-home"

    export let onClickOutside: () => void
    export let open: boolean

    let bgOpacity = 0.5
    let elementStyling: "solid" | "blur" | "clear" = "blur"
    let stylingOpen = false

    $: context = $globalContext
    $: ambience = $globalContext.ambience!
    $: showYt = !$mediaEmbedStore?.hidden
    $: volume = $ytPlayerStore?.volume ?? 0.5

    $: {
        elementStyling = ambience?.styling ?? "blur"
        bgOpacity = ambience?.opacity ?? 0.5
    }

    function onElemStylingOptnClicked(optn: string) {
        elementStyling = optn as "solid" | "blur" | "clear"
        stylingOpen = false

        _updateAmbience({ styling: elementStyling })
    }
    function _updateAmbience(data: Partial<AmbientOptions>) {
        updateAmbience(data)
    }
    function toggleYtMiniPlayer(on: boolean) {
        mediaEmbedStore.update(data => ({ ...data!, hidden: !on }))
    }
    function updateVolume(volume: number) {
        $ytPlayerStore!.setVolume(volume * 100)
    }
</script>

<BounceFade
    id={"ambient-header--dmenu"}
    isHidden={!open}
    zIndex={9999}
    position={{ left: "-10px", top: "37px" }}
    {onClickOutside}
>
    <div class="ambient">
        <div class="ambient__setting">
            <div class="ambient__setting-name">
                Element Styling
            </div>
            <div class="ambient__setting-right">
                <!-- svelte-ignore missing-declaration -->
                <DropdownBtn 
                    id={"ambient"}
                    isActive={stylingOpen}
                    options={{
                        pickedOptionName: capitalize(elementStyling),
                        styles: { 
                            fontSize: "1.24rem",
                            backgroundColor: "rgba(255, 255, 255, 0.025)",
                            margin: "0px 0px 0px -5px",
                            width: "50px",
                            borderRadius: "10px",
                            padding: "4px 7px 4px 11px" 
                        },
                        onClick: () => {
                            stylingOpen = !stylingOpen
                        }
                    }} 
                />

                <DropdownList 
                    id={"ambient"}
                    isHidden={!stylingOpen} 
                    options={{
                        listItems: [
                            { name: "Solid" }, { name: "Blur" }, { name: "Clear" } 
                        ],
                        position: { 
                            top: "40px", right: "10px"
                        },
                        styling:  {
                            width: "70px",
                            fontSize: "1.2rem",
                            zIndex: 500
                        },
                        pickedItem: capitalize(elementStyling),
                        onListItemClicked: (context) => {
                            onElemStylingOptnClicked(context.name.toLocaleLowerCase())
                        },
                        onClickOutside: () => {
                            stylingOpen = false
                        }
                    }}
                />        
            </div>
        </div>
        <div class="ambient__setting">
            <div class="ambient__setting-name">
                Background Opacity
            </div>
            <div class="ambient__setting-right">
                <RangeInput 
                    value={bgOpacity} 
                    onUpdate={(opacity) => {
                        _updateAmbience({ opacity })
                        bgOpacity = opacity
                    }}
                />
            </div>
        </div>
        <div class="ambient__setting">
            <div class="ambient__setting-name">
                Volume
            </div>
            <div class="ambient__setting-right">
                <RangeInput 
                    value={volume / 100} 
                    onUpdate={(volume) => {
                        updateVolume(volume)
                    }}
                    options={{
                        updateOnSeek: false
                    }}
                />
            </div>
        </div>
        <div class="divider"></div>
        <div 
            class="ambient__setting"
            class:hidden={ambience.space.type === "video"}
        >
            <div class="ambient__setting-name">
                Youtube Player
            </div>
            <div class="ambient__setting-right">
                <div 
                    class="ambient__setting-toggle"
                    class:ambient__setting-toggle--off={!showYt}
                >
                    <button 
                        on:click={() => toggleYtMiniPlayer(true)}
                        class="ambient__setting-toggle-on"
                    >
                        On
                    </button>
                    <button 
                        on:click={() => toggleYtMiniPlayer(false)}
                        class="ambient__setting-toggle-off"
                    >
                        Off
                    </button>
                    <div class="ambient__setting-toggle-highlight"></div>
                </div>
            </div>
        </div>
        <div 
            class="ambient__setting"
            style:display={ambience.space.type === "video" && !$ytPlayerStore?.isPlaying ? "flex" : "none"}
        >
            <div class="ambient__setting-name">
                Video
            </div>
            <div class="ambient__setting-right">
                <button
                    on:click={() => {
                        $ytPlayerStore?.togglePlayback(true)
                    }} 
                    class="ambient__setting-open-space-btn"
                >
                    Play
                </button>
            </div>
        </div>
        <div class="ambient__setting">
            <div class="ambient__setting-name">
                Space Settings
            </div>
            <div class="ambient__setting-right">
                <button 
                    on:click={() => {
                        openModal(ModalType.Spaces)
                        onClickOutside()
                    }}
                    class="ambient__setting-open-space-btn"
                >
                    Open
                </button>
            </div>
        </div>
    </div>
</BounceFade>

<style lang="scss">
    .ambient {
        background: var(--bg-2);
        padding: 12px 15px 6px 15px;
        border-radius: 12px;
        width: 225px;
        position: relative;

        .divider {
            @include divider(0.1, 0.5px, 100%);
            margin: 16px 0px 14px 0px
        }

        &__setting {
            @include flex(center);
            height: 20px;
            margin-bottom: 12px;

            &:nth-child(5) {
                margin-bottom: 14px;
            }

            &-open-space-btn {
                @include center;
                background-color: rgba(white, 0.025);
                @include text-style(1, 500, 1.24rem);
                width: 100%;
                padding: 4px 4px 6px 4px;
                height: 16.5px;
                border-radius: 10px;
                margin-left: -7px;
            }
        }
        &__setting-name {
            @include text-style(0.45, 500, 1.2rem);
            flex: 1;
        }
        &__setting-right {
            width: 60px;
        }
        &__setting-toggle {
            position: relative;
            @include flex(center, space-between);
            @include text-style(1, 500, 1.24rem);
            background-color: rgba(white, 0.025);
            width: calc(100% + 9px);
            padding: 5px 9px 6px 9px;
            border-radius: 10px;
            margin-left: -7px;


            &--off &-highlight {
                left: unset;
                right: 3px;
            }
            &--off &-on {
                opacity: 0.2;
            }
            &--off &-off {
                opacity: 1;
            }
        }
        &__setting-toggle-on {
            opacity: 1;
        }
        &__setting-toggle-off {
            opacity: 0.2;
            margin-left: 12px;
        }
        &__setting-toggle-highlight {
            transition: 0.15s ease-in-out;
            height: 80%;
            width: 30px;
            border-radius: 8px;
            background-color: rgba(white, 0.035); 
            @include abs-top-left(3px, 3px);
        }
        &__setting-toggle button {
            transition: 0.05s ease-in-out;
            @include text-style(1, 500, 1.2rem);
        }
        &__setting-toggle button:hover {
            opacity: 0.6 !important;
        }
    }
</style>