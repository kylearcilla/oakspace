<script lang="ts">
	import { onMount } from "svelte"
    import { capitalize } from "$lib/utils-general"
	import { updateAmbience } from "$lib/utils-home"
	import { globalContext, ytPlayerStore } from "$lib/store"

	import ToggleBtn from "$components/ToggleBtn.svelte"
	import RangeInput from "$components/RangeInput.svelte"
	import BounceFade from "$components/BounceFade.svelte"
	import DropdownBtn from "$components/DropdownBtn.svelte"
    import DropdownList from "$components/DropdownList.svelte"

    export let onClickOutside: () => void
    export let open: boolean

    let bgOpacity = 0.5
    let elementStyling: "solid" | "blur" | "clear" = "blur"
    let stylingOpen = false

    let timeStyleOpen = false

    $: ambience = $globalContext.ambience!
    $: player = $ytPlayerStore!
    $: volume = $ytPlayerStore?.volume ?? 0.5
    $: showTime = ambience?.showTime ?? false
    $: isWallpaper = ambience?.space.type === "wallpaper"
    $: fontStyle = ambience?.fontStyle ?? "default"

    $: {
        elementStyling = ambience?.styling ?? "blur"
        bgOpacity = ambience?.opacity ?? 0.5
    }

    function onElemStylingOptnClicked(optn: string) {
        elementStyling = optn as "solid" | "blur" | "clear"
        stylingOpen = false

        updateAmbience({ styling: elementStyling })
    }
    function setClockStyle(fontStyle: string) {
        updateAmbience({ fontStyle: fontStyle.toLowerCase() as FontStyle })
        timeStyleOpen = false
    }
    function updateVolume(volume: number) {
        $ytPlayerStore!.setVolume(volume * 100)
    }

    onMount(() => {
        player!.calibrateVolume()
    })
</script>

<BounceFade
    id={"ambient-header--dmenu"}
    isHidden={!open}
    zIndex={9999}
    position={{ left: "10px", top: "34px" }}
    {onClickOutside}
>
    <div class="ambient">
        <div class="ambient__setting ambient__divider">
            <div class="ambient__setting-name">
                Element Styling
            </div>
            <div class="ambient__setting-right">
                <DropdownBtn 
                    id={"ambient"}
                    isActive={stylingOpen}
                    options={{
                        title: capitalize(elementStyling),
                        noBg: false,
                        styles: { 
                            backgroundColor: "rgba(255, 255, 255, 0.025)",
                            margin: "0px 0px 0px -5px",
                            width: "64px",
                            borderRadius: "10px"
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
                            width: "75px",
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
        <div class="ambient__setting" style:margin-bottom="9px">
            <div class="ambient__setting-name">
                Toggle Clock
            </div>
            <div class="ambient__setting-right">
                <div class="ambient__setting-toggle">
                    {showTime ? "Yes" : "No"}
                    <ToggleBtn 
                        active={showTime}
                        onToggle={() => {
                            updateAmbience({ showTime: !showTime })
                        }}
                    />
                </div>
            </div>
        </div>
        <div 
            class="ambient__setting ambient__divider"
            class:ambient__setting--hidden={!showTime}
            style:margin-bottom="9px"
            style:padding-bottom="11px"
        >
            <div class="ambient__setting-name">
                Clock Style
            </div>
            <div class="ambient__setting-right">
                <!-- svelte-ignore missing-declaration -->
                <DropdownBtn 
                    id={"ambient-clock-style"}
                    isActive={timeStyleOpen}
                    options={{
                        title: capitalize(fontStyle),
                        noBg: false,
                        styles: { 
                            backgroundColor: "rgba(255, 255, 255, 0.025)",
                            margin: "0px 0px 0px -5px",
                            width: "64px",
                            borderRadius: "10px",
                        },
                        onClick: () => {
                            timeStyleOpen = !timeStyleOpen
                        }
                    }} 
                />

                <DropdownList 
                    id={"ambient-clock-style"}
                    isHidden={!timeStyleOpen} 
                    options={{
                        listItems: [
                            { name: "Default" },
                            { name: "Stylish" },
                            { name: "Fancy" },
                            { name: "Cute" },
                        ],
                        position: { 
                            top: "105px", right: "10px"
                        },
                        styling:  {
                            width: "90px",
                            zIndex: 500
                        },
                        pickedItem: capitalize(fontStyle),
                        onListItemClicked: ({ name }) => {
                            setClockStyle(name)
                        },
                        onClickOutside: () => {
                            timeStyleOpen = false
                        }
                    }}
                />        
            </div>
        </div>
        <div class="ambient__setting" style:margin-bottom="12px">
            <div class="ambient__setting-name">
                Opacity
            </div>
            <div class="ambient__setting-right">
                <RangeInput 
                    value={bgOpacity} 
                    onUpdate={(opacity) => {
                        updateAmbience({ opacity })
                        bgOpacity = opacity
                    }}
                />
            </div>
        </div>
        {#if !isWallpaper}
            {@const vid = ambience?.space.type === "video"}
            <div class="ambient__setting" style:margin-bottom="10px">
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
            <div class="ambient__controls">
                <button 
                    class:active-control={player.isShuffled}
                    style:font-size="1.1rem"
                    disabled={vid}
                    on:click={() => player.toggleShuffle()}
                >
                    <i class="fa-solid fa-shuffle"></i>
                </button>
                <div class="flx">
                    <button
                        disabled={vid}
                        on:click={() => player.skipToPrevTrack()}
                    >
                        <i class="fa-solid fa-backward"></i>
                    </button>
                    <button 
                        class="ambient__playback-btn"
                        on:click={() => player.togglePlayback()}
                    >
                        {#if player?.isPlaying}  
                            <i class="fa-solid fa-pause"></i>
                        {:else}
                            <i class="fa-solid fa-play"></i>
                        {/if}
                    </button>
                    <button
                        disabled={vid}
                        on:click={() => player.skipToNextTrack()}
                    >
                        <i class="fa-solid fa-forward"></i>
                    </button>
                </div>
                <button 
                    class:active-control={player.isRepeating}
                    style:font-size="1.1rem"
                    disabled={vid}
                    on:click={() => player.toggleRepeat()}
                >
                    <i class="fa-solid fa-repeat"></i>
                </button>
            </div>
        {/if}
    </div>
</BounceFade>

<style lang="scss">
    @import "../../../scss/dropdown.scss";

    .ambient {
        background: var(--bg-2);
        padding: 10px 14px 6px 14px;
        border-radius: 15px;
        width: 220px;
        position: relative;

        &__divider {
            padding-bottom: 7px;
            border-bottom: 1px solid rgba(var(--textColor1), 0.08);
        }
        &__setting {
            @include flex(center);
            margin-bottom: 9px;
        }
        &__seeting-open-space-btn {
            @include center;
            background-color: rgba(white, 0.025);
            @include text-style(1, 500, 1.24rem);
            width: 100%;
            padding: 4px 4px 6px 4px;
            height: 16.5px;
            border-radius: 10px;
            margin-left: -7px;

            &:hover {
                display: none;
            }
        }
        &__setting-toggle {
            @include flex(center, space-between);
            @include text-style(0.6, 400, 1.15rem, "Geist Mono");
        }
        &__setting-name {
            @include text-style(0.45, 400, 1.28rem);
            flex: 1;
        }
        &__setting-right {
            width: 70px;
        }
        &__controls {
            background: rgba(var(--textColor1), 0.04);
            border-radius: 10px;
            padding: 7px 10px;
            margin: 0px 0px 6px -2px;
            width: calc(100% + 2px);
            @include flex(center, space-between);
            color: white;

            button {
                position: relative;
                @include center;
                padding: 4px;
                opacity: 0.75;
                font-size: 1.2rem;
            }
            button:hover {
                opacity: 1;
            }
            button:disabled {
                opacity: 0.3;
            }
        }
        &__playback-btn {
            @include circle(16px);
            font-size: 1.67rem !important;
            margin: 0px 5px;

            i {
                margin: -1px 0px 0px 0px;
            }
        }
    }
    .active-control::after {
        content: "";
        position: absolute;
        bottom: -3px;
        left: 50%;
        transform: translateX(-50%);
        @include circle(2.5px);
        background-color: white;
    }
</style>
