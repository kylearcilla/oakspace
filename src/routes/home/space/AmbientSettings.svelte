<script lang="ts">
    import { capitalize } from "$lib/utils-general"
	import { updateAmbience } from "$lib/utils-home"
	import { globalContext, ytPlayerStore } from "$lib/store"

	import ToggleBtn from "../../../components/ToggleBtn.svelte"
	import RangeInput from "../../../components/RangeInput.svelte"
	import BounceFade from "../../../components/BounceFade.svelte"
	import DropdownBtn from "../../../components/DropdownBtn.svelte"
    import DropdownList from "../../../components/DropdownList.svelte"

    export let onClickOutside: () => void
    export let open: boolean

    let bgOpacity = 0.5
    let elementStyling: "solid" | "blur" | "clear" = "blur"
    let stylingOpen = false

    let timeStyle = "Basic"
    let timeStyleOpen = false

    $: ambience = $globalContext.ambience!
    $: clockFont = ambience?.clockFont ?? "DM Sans"
    $: player = $ytPlayerStore!
    $: volume = $ytPlayerStore?.volume ?? 0.5
    $: showTime = ambience?.showTime ?? false
    $: isWallpaper = ambience?.space.type === "wallpaper"

    $: {
        elementStyling = ambience?.styling ?? "blur"
        bgOpacity = ambience?.opacity ?? 0.5
    }
    $: if (clockFont === "DM Sans") {
        timeStyle = "Basic"
    }
    else if (clockFont === "Zodiak-Bold") {
        timeStyle = "Stylish"
    }
    else if (clockFont === "Melodrama-Bold") {
        timeStyle = "Fancy"
    }
    else if (clockFont === "Bagel Fat One") {
        timeStyle = "Cute"
    }

    function onElemStylingOptnClicked(optn: string) {
        elementStyling = optn as "solid" | "blur" | "clear"
        stylingOpen = false

        _updateAmbience({ styling: elementStyling })
    }
    function setClockStyle(style: string) {
        let clockFont: "DM Sans" | "Zodiak-Bold" | "Melodrama-Bold" | "Bagel Fat One" = "DM Sans"

        if (style === "Stylish") {
            clockFont = "Zodiak-Bold"
        } 
        else if (style === "Fancy") {
            clockFont = "Melodrama-Bold"
        }
        else if (style === "Cute") {
            clockFont = "Bagel Fat One"
        }

        _updateAmbience({ clockFont })
        timeStyleOpen = false
    }
    function _updateAmbience(data: Partial<AmbientOptions>) {
        updateAmbience(data)
    }
    function updateVolume(volume: number) {
        $ytPlayerStore!.setVolume(volume * 100)
    }
</script>

<BounceFade
    id={"ambient-header--dmenu"}
    isHidden={!open}
    zIndex={9999}
    position={{ left: "10px", top: "34px" }}
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
                            width: "64px",
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
                            width: "75px",
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
        <div class="ambient__setting" style:margin-bottom="9px">
            <div class="ambient__setting-name">
                Show Clock
            </div>
            <div class="ambient__setting-right">
                <div class="ambient__setting-toggle">
                    {showTime ? "Yes" : "No"}
                    <ToggleBtn 
                        active={showTime}
                        onToggle={() => {
                            _updateAmbience({ showTime: !showTime })
                        }}
                    />
                </div>
            </div>
        </div>
        <div 
            class="ambient__setting"
            class:ambient__setting--hidden={!showTime}
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
                        pickedOptionName: timeStyle,
                        styles: { 
                            fontSize: "1.24rem",
                            backgroundColor: "rgba(255, 255, 255, 0.025)",
                            margin: "0px 0px 0px -5px",
                            width: "64px",
                            borderRadius: "10px",
                            padding: "4px 7px 4px 11px" 
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
                            { name: "Basic" }, { name: "Cute" }, { name: "Stylish" }, { name: "Fancy" }
                        ],
                        position: { 
                            top: "96px", right: "10px"
                        },
                        styling:  {
                            width: "90px",
                            fontSize: "1.2rem",
                            zIndex: 500
                        },
                        pickedItem: timeStyle,
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
        <div class="ambient__setting" style:margin-bottom="9px">
            <div class="ambient__setting-name">
                Opacity
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
        {#if !isWallpaper}
            {@const isVid = ambience?.space.type === "video"}

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
            <div class="ambient__controls">
                <button 
                    class:active-control={player.isShuffled}
                    style:font-size="1.1rem"
                    disabled={isVid}
                    on:click={() => player.toggleShuffle()}
                >
                    <i class="fa-solid fa-shuffle"></i>
                </button>
                <div class="flx">
                    <button
                        disabled={isVid}
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
                        disabled={isVid}
                        on:click={() => player.skipToNextTrack()}
                    >
                        <i class="fa-solid fa-forward"></i>
                    </button>
                </div>
                <button 
                    class:active-control={player.isRepeating}
                    style:font-size="1.1rem"
                    disabled={isVid}
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
        padding: 12px 14px 6px 14px;
        border-radius: 15px;
        width: 220px;
        position: relative;

        .divider {
            // @include divider(0.1, 0.5px, 100%);
            margin: 12px 0px 9px 0px;
            border-top: 1.5px dashed rgba(var(--textColor1), 0.08);
        }

        &__setting {
            @include flex(center);
            height: 20px;
            margin-bottom: 9px;

            &:nth-child(5) {
                margin-bottom: 14px;
            }
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

            &:hover{
                display: none;
            }

        }
        &__setting-toggle {
            @include flex(center, space-between);
            @include text-style(0.6, 400, 1.15rem, "DM Mono");
        }
        &__setting-name {
            @include text-style(0.45, 500, 1.2rem);
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

            button {
                position: relative;
                @include center;
                // @include square(8px, 4px);
                // background: rgba(var(--textColor1), 0.04);
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
