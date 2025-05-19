<script lang="ts">
	import { onDestroy } from "svelte"
	import { themeState } from "$lib/store"

	import { imageUpload } from "$lib/pop-ups"
    import { Icon, ModalType } from "$lib/enums"
	import { formatNumber } from "$lib/utils-general"
	import { setDefaultFont } from "$lib/utils-appearance"
	import { formatDateLong, formatSecs } from "$lib/utils-date"
	import { FONT_COPY, MAX_USER_NAME_LENGTH, USER_DESCRIPTIONS } from "$lib/constants"
	import { closeModal, updateGlobalContext } from "$lib/utils-home"

	import Modal from "$components/Modal.svelte"
	import SvgIcon from "$components/SVGIcon.svelte"
	import SettingsBtn from "$components/SettingsBtn.svelte"
	import DropdownList from "$components/DropdownList.svelte"
	import { updateUiOptions, updateUser } from "$lib/api-general";

    export let user: User
    export let globalContext: GlobalContext

    $: light = !$themeState.isDarkTheme

    let { fontStyle, showStats } = globalContext
    let { name, description } = user
    
    let focused = false
    let options = false
    let descriptions = false
    let loading = false

    function optnClicked(optn: string) {
        if (optn === "Logout") {
        }
        else if (optn === "Delete Account") {

        }
    }
    async function updateDescription(desc: string) {
        if (desc === description) return

        updateUser({ description: desc })

        description = desc
        user.description = desc
    }
    async function onInputBlur() {
        if (!name.trim() || name === user.name) {
            name = user.name
            return
        }
        
        updateUser({ name })

        user.name = name
        updateGlobalContext({  user: { ...user, name } })
    }
    async function onSubmitImg(src: string) {
        if (src === user.profileImg) return
        loading = true

        updateUser({ profileImg: src })
            .then(() => {
                user.profileImg = src
                updateGlobalContext({ user: { ...user, profileImg: src } })
            })
            .finally(() => {
                loading = false
            })
    }
    function setFontStyle(style: "system" | "mono") {
        fontStyle = style
        updateGlobalContext({ fontStyle })
        setDefaultFont(style)

        updateUiOptions({ fontStyle: style })
    }

    function close() {
        closeModal(ModalType.Settings)
    }
    onDestroy(() => imageUpload.close())
</script>

<Modal 
    options={{ borderRadius: "20px", scaleUp: true }} 
    onClickOutSide={close}
>
    <div class="settings" class:settings--light={light}>
        <div class="flx">
            <div class="settings__left">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="settings__profile-img-container">
                    <img src={user.profileImg} alt="profile img" />
                    <div class="settings__img-overlay">
                        <button 
                            class="hov-underline"
                            on:click={() => imageUpload.init({ onSubmitImg })}
                        >
                            Replace
                        </button>
                    </div>
                </div>
                <div class="settings__membership">
                    <div class="settings__membership-title">
                        {user.pro ? "Pro Member" : "Free Member"}
                    </div>
                    <p class="settings__membership-date">
                        Member since {formatDateLong(new Date(user.created))}
                    </p>
                    <div class="settings__stats" class:hidden={!showStats}>
                        <div class="settings__stat">
                            <span>
                                {formatNumber(user.stats.goalsReached)} 
                            </span>
                            goals reached
                        </div>
                        <div class="settings__stat">
                            <span>
                                {formatNumber(user.stats.habitsDone)} 
                            </span>
                            habits done
                        </div>
                        <div class="settings__stat">
                            <span>
                                {formatSecs(user.stats.focusTime)} 
                            </span>
                            focused
                        </div>
                        <div class="settings__stat">
                            <span>
                                {formatNumber(user.stats.sessions)} 
                            </span>
                            sessions done
                        </div>
                    </div>
                </div>
            </div>
            <div class="settings__right">
                <div style:width="100%" style:margin-bottom="16px">
                    <div class="settings__field">
                        <div class="settings__field-title">Name</div>
                        <input 
                            bind:value={name} 
                            class="settings__field-val box-shadow-focus"
                            class:box-shadow-focus--light={light}
                            class:box-shadow-focus--focus={focused}
                            placeholder="type your name here..."
                            maxlength={MAX_USER_NAME_LENGTH}
                            on:blur={() => {
                                focused = false
                                onInputBlur()
                            }}
                            on:focus={() => {
                                focused = true
                            }}
                        />
                    </div>
                    <div class="settings__field">
                        <div class="settings__field-title">Email</div>
                        <div class="settings__field-val">{user.email}</div>
                    </div>
                    <div class="settings__field" style:margin-top="18px">
                        <div 
                            class="settings__field-title"
                            style:margin-bottom="12px"
                        >
                            What Best Describes You?
                        </div>
                        <button 
                            data-dmenu-id="descriptions"
                            class="settings__field-val settings__description-btn"
                            class:settings__description-btn--open={descriptions}
                            on:click={() => descriptions = !descriptions}
                        >
                            {description}
                            <div class="settings__arrow smooth-bounce">
                                <SvgIcon 
                                    icon={Icon.ChevronRight} 
                                    options={{ scale: 1.2, strokeWidth: 0.4 }} 
                                />
                            </div>
                        </button>
                    </div>
                </div>
                <div 
                    class="settings__field-title" 
                    style:margin="25px 0px 14px 0px"
                >
                    Font Style
                </div>
                <div style:display="flex" style:gap="6px" style:margin-bottom="30px">
                    <div 
                        class="settings__font-option"
                        class:font-chosen={fontStyle === "system"}
                    >
                        <button 
                            on:click={() => setFontStyle("system")}
                            class:font-chosen={fontStyle === "system"}
                        >
                            {FONT_COPY}
                        </button>
                        <span class="settings__font-label">System</span>
                    </div>
                    <div 
                        class="settings__font-option box-shadow-focus"
                        class:font-chosen={fontStyle === "mono"}
                    >
                        <button 
                            on:click={() => setFontStyle("mono")}
                            class:font-chosen={fontStyle === "mono"}
                        >
                            {FONT_COPY}
                        </button>
                        <span class="settings__font-label">Monospace</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="settings__settings-btn">
            <SettingsBtn 
                id="dropdown"
                options={{
                    opacity: { fg: 0.15 }
                }}
                onClick={() => options = !options}
            />
        </div>
        <DropdownList 
            id={"descriptions"}
            isHidden={!descriptions}
            options={{
                listItems: USER_DESCRIPTIONS.map(desc => ({ name: desc })),
                pickedItem: description,
                onListItemClicked: ({ name }) => {
                    descriptions = false
                    updateDescription(name)
                },
                onClickOutside: () => {
                    descriptions = false
                },
                styling: { 
                    zIndex: 100,
                    minWidth: "150px",
                },
                position: { 
                    top: fontStyle === "system" ? "242px" : "254px",
                    right: "25px",
                }
            }}
        />
        <DropdownList 
            id={"dropdown"}
            isHidden={!options}
            options={{
                listItems: [
                    { 
                        name: "Show Stats",
                        active: showStats,
                        onToggle: () => {
                            showStats = !showStats
                            updateGlobalContext({ showStats })
                        }
                    },
                    { 
                        name: "Logout",
                        divider: true
                    },
                    { 
                        name: "Delete Account"
                    }
                ],
                onListItemClicked: ({ name }) => {
                    optnClicked(name)
                },
                onClickOutside: () => {
                    options = false
                },
                styling: { 
                    zIndex: 100,
                    minWidth: "130px",
                },
                position: { 
                    top: "28px",
                    right: "10px",
                }
            }}
        />
    </div>
</Modal>

<style lang="scss">
    @use "../../scss/global.scss" as *;
    @use "../../scss/inputs.scss" as *;


    .settings {
        padding: 20px 20px 20px 22px;
        width: 85vw;
        max-width: 570px;
        position: relative;
        @include text-style(0.28, var(--fw-300-500), 1.25rem);

        --field-opacity: 0.03;
        
        &--light {
            --field-opacity: 0.05;
            @include text-style(1);
        }
        &--light &__membership-title {
            opacity: 0.5;
        }
        &--light &__field-title {
            @include text-style(0.45);
        }
        &--light &__stat span {
            @include text-style(0.65);
        }

        input {
            width: calc(100% - 24px);
        }
        &__settings-btn {
            @include abs-top-right(8px, 15px);
            display: flex;
        }
        &__left {
            width: 220px;
            margin-right: 25px;
            height: 100%;
        }
        &__right {
            width: calc(100% - 230px);
            height: 100%;
            overflow: hidden;
            padding: 0px 4px;
        }
        &__profile {
            display: flex;
            gap: 24px;
        }
        &__profile-img-container {
            position: relative;
            width: 100%;
            height: 210px;
            max-height: 210px;
            margin-bottom: 14px;
        }
        &__img-overlay {
            @include abs-top-left;
            background-color: rgba(0, 0, 0, 0.6);
            width: 100%;
            height: 100%;
            border-radius: 10px;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;

            button {
                @include text-style(_, 400, 1.25rem);
                color: white;
            }
        }
        &__profile-img-container:hover &__img-overlay {
            opacity: 1;
        }
        img {
            width: 100%;
            object-fit: cover;
            max-height: 210px;
            border-radius: 10px;
            position: relative;
        }
        &__membership {
            margin-bottom: 32px;
        }
        &__membership-title {
            @include text-style(1, _, 1.25rem);
        }
        &__membership-date {
            margin: 6px 0px 14px 0px;
        }
        &__stats {
            border-top: var(--divider-border);
            padding-top: 12px;
        }
        &__stat {
            margin-bottom: 14px;
            font-size: 1.25rem;

            span {
                @include text-style(0.85);
                margin-right: 2px;
            }
        }
        &__profile {
            width: 100%;
        }
        &__field {
            margin-bottom: 14px;
            width: 100%;
            position: relative;
        }
        &__field-title {
            margin-bottom: 8px;
        }
        &__field-val {
            @include text-style(1, var(--fw-300-400), 1.3rem);
            background-color: rgba(var(--textColor1), var(--field-opacity));
            width: 100%;
            padding: 8px 12px 10px 12px;
            overflow: hidden;
            border-radius: 5px;
        }
        &__description-btn {
            position: relative;
            width: calc(100% - 24px);

            &:active {
                transform: scale(0.996);
            }
            &:hover {
                background-color: rgba(var(--textColor1), 0.03);
            }
        }
        &__description-btn--open &__arrow {
            transform: rotate(-90deg);
        }
        &__description-btn:hover &__arrow {
            opacity: 0.2;
        }
        &__arrow {
            @include abs-top-right(11px, 9px);
            opacity: 0;
            transform: rotate(90deg);
        }
        &__font-option {
            display: flex;
            flex-direction: column;
            gap: 8px;
            @include center;
        }
        &__font-option span {
            @include text-style(1, var(--fw-400-500), 1.2rem);
            opacity: 0.4;
            margin-top: 3px;
        }
        &__font-option button {
            background-color: rgba(var(--textColor1), var(--field-opacity));
            transition: background-color 0.2s ease;
            height: 80px;
            padding-bottom: 4px;
            width: 100px;
            border-radius: 15px;
            @include center;
            @include text-style(1, var(--fw-300-400), 1.7rem, "system");

            &:hover {
                background-color: rgba(var(--textColor1), calc(var(--field-opacity) * 1.5));
            }
        }
        &__font-option:nth-child(2) button {
            @include text-style(1, _, 1.6rem, "Geist Mono");
        }
    }
    .font-chosen {
        color: rgb(var(--fgColor2)) !important;

        button {
            background-color: rgba(var(--textColor1), calc(var(--field-opacity) * 2));
            box-shadow: rgba(var(--fgColor2), 0.5) 0px 0px 0px 3px inset, 
                        rgba(var(--fgColor2), 0.15) 0px 0px 0px 3.5px !important;

            color: rgba(var(--fgColor2));
        }
        span {
            color: rgba(var(--fgColor2));
            opacity: 1;
        }
    }
</style>    