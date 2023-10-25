<script lang="ts">
	import { clickOutside } from '$lib/utils-general';
	import { formatDateToMMDD } from '$lib/utils-date';
	import { onMount } from 'svelte';

    enum ModalType { Settings, Youtube, Music, Stats, Appearance }
    enum Tab { PROFILE, PLAN_DETAILS, CARDS, LANGUAGE }

    let isAddNewCardModalOpen = false

    let userDetails = {
        firstName: "Kyle",
        lastName: "Arcilla",
        username: "kylearcilla09",
        profileImageSrc: "https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg",
        isUserPremium: false,
        logInInfo: {
            email: "kylearcilla09@gmail.com",
            password: "pokemon12",
            loginProvider: null
        },
        currentPaymentCard: 0,
        paymentCards: [
            {
                paymentNetwork: {
                    name: "Mastercard",
                    imgLogoSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/2560px-Mastercard_2019_logo.svg.png"
                },
                lastFourDigits: "2762",
                cardHolderName: "Tupac Shakur",
                expDate: new Date(2023, 6, 24)
            },
            {
                paymentNetwork: {
                    name: "Visa",
                    imgLogoSrc: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg"
                },
                lastFourDigits: "9274",
                cardHolderName: "Tupac Shakur",
                expDate: new Date(2023, 6, 24)
            }
        ]
    }
    let planDetails = {
        basic: {
            price: 0,
            details: [
                "Full Access to Music & Video Features",
                "Sessions are only tracked for 1 week at a time",
                "Limited User Analytics",
                "Limited access to color themes",
                "No access to theatre mode"
            ]
        },
        premium: {
            price: 1,
            details: []
        }
    }
    let languages = [
        {
            flag: "🇬🇧",
            name: "English"
        },
        {
            flag: "🇪🇸",
            name: "Español"
        },
        {
            flag: "🇰🇵",
            name: "Protuguês"
        },
        {
            flag: "🇫🇷",
            name: "Français"
        },
        {
            flag: "🇮🇹",
            name: "Italiano"
        },
        {
            flag: "🇰🇷",
            name: "한국인"
        },
        {
            flag: "🇯🇵",
            name: "日本"
        },
        {
            flag: "🇨🇳",
            name: "中国人"
        },
    ]

    let selectedTab = Tab.PROFILE
    let isLangDropdownListOpen = false

    const langs = [
        {
            flag: "🇬🇧",
            name: "English"
        },
        {
            flag: "🇫🇷",
            name: "French"
        },
        {
            flag: "🇪🇸",
            name: "Spanish"
        }
    ]

    let currentLang = langs[0]


    /* User Info Handlers */
    const handleLogOut = () => {
        
    }
    const handleEditUserInfo = (userInfo: string) => { 

    }
    const handleChangeProfilePic = () => { 

    }
	const handleUpgradeToPremium = () => {
	}

	const handleEditPaymentMethod = () => {
	}
    const handleNewCardModalCancelBtn = () => {
        isAddNewCardModalOpen = false
    }
    const handleNewCardModalSubmitBtn = () => {

    }


	function handleRemovePaymentCard(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		throw new Error('Function not implemented.');
	}


	const handleAddNewCardBtn = () => {
        isAddNewCardModalOpen = true
	}


	function handleDeleteBtn(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		throw new Error('Function not implemented.');
	}


	const handleNewFlagClicked = (idx: number): any => {
        currentLang = langs[idx]
        isLangDropdownListOpen = false
	}
</script>

<div class="modal-bg">
    <div use:clickOutside on:click_outside={() => console.log("")} class="modal-bg__content modal-bg__content--main-modal modal-bg__content--overflow-y-scroll">
        <div class="settings">
            <h1 class="modal-bg__content-title">Settings</h1>
            <p class="modal-bg__content-copy paragraph-1">View and update your account and profile details.</p>
            <div class="settings-tabs">
                <div class="settings-tabs__container">
                    <button on:click={() => selectedTab = Tab.PROFILE} class={`settings-tabs__tab settings-tabs__tab--profile settings-tabs__tab--${selectedTab == Tab.PROFILE ? "selected" : ""}`}>
                        Profile
                    </button>
                    <button on:click={() => selectedTab = Tab.PLAN_DETAILS}  class={`settings-tabs__tab settings-tabs__tab--plan-details settings-tabs__tab--${selectedTab == Tab.PLAN_DETAILS ? "selected" : ""}`}>
                        Plan Details
                    </button>
                    <button on:click={() => selectedTab = Tab.LANGUAGE}  class={`settings-tabs__tab settings-tabs__tab--lang settings-tabs__tab--${selectedTab == Tab.LANGUAGE ? "selected" : ""}`}>
                        Language 
                    </button>
                </div>
                <div class="settings-tabs__divider"></div>
                <div class={`settings-tabs__highlighter settings-tabs__highlighter--${selectedTab === Tab.PROFILE ? "profile" : selectedTab === Tab.PLAN_DETAILS ? "plan" : "lang"}`}>
                </div>
            </div>

            {#if selectedTab === Tab.PROFILE}
                <!-- User Info -->
                <div class="user-info bento-box">
                    <h3>User Info</h3>
                    <div class="user-info__main-details">
                        <div class="user-info__img-container">
                            <img src={userDetails.profileImageSrc} alt="">
                            <button 
                                class="text-only text-only--reverse-hover-styling text-only--thin" 
                                on:click={handleChangeProfilePic}
                            >
                                Edit
                            </button>
                        </div>
                        <div class="user-info__details-container">
                            <div class="user-info__top-row">
                                <div class="user-info__input-container">
                                    <span>First Name</span>
                                    <input 
                                        class="user-info__first-name-input"
                                        type="text"
                                        placeholder="Kyle" 
                                    >
                                </div>
                                <div class="user-info__input-container">
                                    <span>Last Name</span>
                                    <input 
                                        class="user-info__last-name-input"
                                        type="text"
                                        placeholder="Arcilla" 
                                    >
                                </div>
                            </div>
                            <div class="user-info__bottom-row">
                                <div class="user-info__input-container">
                                    <span>Username</span>
                                    <input 
                                        class="user-info__username-name-input"
                                        type="text"
                                        placeholder="kyle_arcilla09" 
                                    >
                                </div>
                            </div>
                        </div>
                        <button on:click={handleLogOut} class="user-info__logout-btn settings__msg-btn">
                            Save Changes
                        </button>
                    </div>
                </div>
                <!-- Log In Information -->
                <div class="login-info bento-box">
                    <h3>Login Information</h3>
                    <div class="login-info__info-row-section">
                        <h4>Email / Login Provider</h4>
                        <div class="login-info__logo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                                <path d="M11.954 6.91125C11.954 6.40966 11.9144 6.04364 11.8286 5.66406H6.25293V7.92797H9.52573C9.45977 8.49058 9.10346 9.33786 8.31163 9.90721L8.30053 9.983L10.0635 11.3859L10.1856 11.3985C11.3073 10.3343 11.954 8.76848 11.954 6.91125Z" fill="#4285F4"/>
                                <path d="M6.25536 12.8783C7.85876 12.8783 9.20483 12.336 10.188 11.4006L8.31406 9.90936C7.81259 10.2686 7.13953 10.5194 6.25536 10.5194C4.68494 10.5194 3.35207 9.45525 2.87693 7.98438L2.80729 7.99045L0.974168 9.44777L0.950195 9.51623C1.92676 11.509 3.93269 12.8783 6.25536 12.8783Z" fill="#34A853"/>
                                <path d="M2.87267 7.98245C2.7473 7.60288 2.67475 7.19615 2.67475 6.77592C2.67475 6.35565 2.7473 5.94897 2.86608 5.56939L2.86276 5.48855L1.00666 4.00781L0.945936 4.03749C0.543448 4.86444 0.3125 5.79308 0.3125 6.77592C0.3125 7.75877 0.543448 8.68736 0.945936 9.51431L2.87267 7.98245Z" fill="#FBBC05"/>
                                <path d="M6.25536 3.03459C7.37048 3.03459 8.12269 3.5294 8.55161 3.94291L10.2276 2.26189C9.19828 1.27905 7.85876 0.675781 6.25536 0.675781C3.93269 0.675781 1.92676 2.04498 0.950195 4.03776L2.87034 5.56967C3.35207 4.09879 4.68494 3.03459 6.25536 3.03459Z" fill="#EB4335"/>
                            </svg>
                            <p>kylearcilla09@gmail.com</p>
                        </div>
                    </div>
                    <button on:click={handleLogOut} class="login-info__edit-btn settings__msg-btn">
                        Change Log In
                    </button>
                </div>
                <!-- Close Account -->
                <div class="close-account bento-box">
                    <h3>Account Deactivation</h3>
                    <button on:click={handleDeleteBtn} class="settings__msg-btn">
                        Delete My Account
                    </button>
                </div>
            {:else if selectedTab === Tab.PLAN_DETAILS}
                <!-- Plan Details -->
                <div class="plan-details bento-box">
                    <h3>Plan Details</h3>
                    <h4>Basic</h4>
                    <div class="plan-details__list-container">
                        <ul class="plan-details__list-details plan-details__list-details--left">
                            <li>Full Access to Music & Video Features</li>  
                            <li>Limited Session Tracking (1 Week)</li>
                            <li>No access to theatre mode</li>
                        </ul>
                        <ul class="plan-details__list-details">
                            <li>Limited User Analytics</li>
                            <li>Limited access to color themes</li>
                        </ul>
                    </div>
                    <button on:click={handleDeleteBtn} class="plan-details__upgrade-btn unfill unfill--padded unfill--oval">
                        Upgrade to Premium
                    </button>
                </div>
                <!-- Payment Method -->
                <div class="payment-method bento-box">
                    <h3>Payment Method</h3>
                    <div class="flx">
                        <div class="payment-card">
                            <div class="payment-card__header">
                                <img src={userDetails.paymentCards[userDetails.currentPaymentCard].paymentNetwork.imgLogoSrc} alt="">
                                <p>{userDetails.paymentCards[userDetails.currentPaymentCard].paymentNetwork.name}</p>
                            </div>
                            <div class="payment-card__number">
                                <span class="payment-card__four-digit-group">****</span>
                                <span class="payment-card__four-digit-group">****</span>
                                <span class="payment-card__four-digit-group">****</span>
                                <span class="payment-card__four-digit-group">{userDetails.paymentCards[userDetails.currentPaymentCard].lastFourDigits}</span>
                            </div>
                            <div class="payment-card__bottom-details">
                                <div class="payment-card__card-holder">
                                    <h6>Name</h6>
                                    <h5>{userDetails.paymentCards[userDetails.currentPaymentCard].cardHolderName}</h5>
                                </div>
                                <div class="payment-card__exp-date">
                                    <h6>Exp Date</h6>
                                    <h5>{formatDateToMMDD(userDetails.paymentCards[userDetails.currentPaymentCard].expDate)}</h5>
                                </div>
                            </div>
                        </div>
                        <div class="payment-method__right-section">
                            <p class="payment-method__next-payment">
                                Your next bill is for $9.99 + tax on 7/11/23.
                            </p>
                        </div>
                    </div>
                    <button on:click={handleEditPaymentMethod} class="payment-method__edit-payment-method-btn unfill unfill--padded unfill--oval">
                        Change Card
                    </button>
                </div>
            {:else}
                <!-- App Language -->
                <div class="lang bento-box">
                    <h3>Language & Region</h3>
                    <div class="flx flx--space-between flx--algn-center">
                        <h4>Chosen Language</h4>
                        <div class="lang__dropdown-btn-container dropdown-container">
                            <button 
                                on:click={() => isLangDropdownListOpen = true}
                                class="lang__dropdown-btn dropdown-btn dropdown-btn--icon-text"
                            >
                                <div class="lang__dropdown-btn-icon">{currentLang.flag}</div>
                                <div class="dropdown-btn__title">
                                    {currentLang.name}
                                </div>
                                <div class="dropdown-btn__arrows">
                                    <div class="dropdown-btn__arrows-triangle-up">
                                        <i class="fa-solid fa-chevron-up"></i>
                                    </div>
                                    <div class="dropdown-btn__arrows-triangle-down">
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </div>
                                </div>
                            </button>
                            {#if isLangDropdownListOpen}
                                <ul use:clickOutside on:click_outside={() => isLangDropdownListOpen = false} class="dropdown-menu">
                                    {#each langs as lang, idx} 
                                        <li class={`dropdown-menu__option ${lang.name === currentLang.name ? "dropdown-menu__option--selected" : ""}`}>
                                            <button class="dropdown-element" on:click={() => handleNewFlagClicked(idx)}>
                                                <div class="dropdown-menu__option-icon">{lang.flag}</div>
                                                <p>{lang.name}</p>
                                                <i class="fa-solid fa-check"></i>
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </div>
                </div>   
            {/if}

            <!-- Modals -->
            <div class={`modal-bg ${isAddNewCardModalOpen ? "" : "modal-bg--hidden"}`}>
                <div 
                    use:clickOutside on:click_outside={() => isAddNewCardModalOpen = false} 
                    class="modal-bg__content modal-bg__content--small modal-bg__content--settings-new-card-modal"
                >
                    <div class="new-card-modal">
                        <h1>Your New Card</h1>
                        <div class="new-card-modal__content">
                            <div class="new-card-modal__top-section">
                                <div class="payment-card">
                                    <div class="payment-card__header">
                                        <img src={userDetails.paymentCards[userDetails.currentPaymentCard].paymentNetwork.imgLogoSrc} alt="">
                                        <p>{userDetails.paymentCards[userDetails.currentPaymentCard].paymentNetwork.name}</p>
                                    </div>
                                    <div class="payment-card__number">
                                        <span class="payment-card__four-digit-group">****</span>
                                        <span class="payment-card__four-digit-group">****</span>
                                        <span class="payment-card__four-digit-group">****</span>
                                        <span class="payment-card__ four-digit-group">{userDetails.paymentCards[userDetails.currentPaymentCard].lastFourDigits}</span>
                                    </div>
                                    <div class="payment-card__bottom-details">
                                        <div class="payment-card__card-holder">
                                            <h6>Name</h6>
                                            <h5>Tupac Shakur</h5>
                                        </div>
                                        <div class="payment-card__exp-date">
                                            <h6>Exp Date</h6>
                                            <h5>{formatDateToMMDD(userDetails.paymentCards[userDetails.currentPaymentCard].expDate)}</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="new-card-modal__bottom-section">
                                <h5 class="new-card-modal__card-details-title">Details</h5>
                                <form class="new-card-modal__card-details-container bento-box">
                                    <!-- <h3>Card Info</h3> -->
                                    <div class="new-card-modal__card-number">
                                        <h5>Card Number</h5>
                                        <input 
                                        type="text" 
                                        placeholder="0000 0000 0000 0000"
                                        />
                                    </div>
                                    <div class="new-card-modal__bottom-details">
                                        <div class="new-card-modal__exp-date">
                                            <h5>Exp. Date</h5>
                                            <input 
                                                type="text" 
                                                placeholder="MM / YYYY"
                                            />
                                        </div>
                                        <div class="new-card-modal__cvv-num">
                                            <h5>CVV</h5>
                                            <input 
                                                type="text" 
                                                placeholder="000"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="new-card-modal__buttons-container">
                                <button class="new-card-modal__cancel-btn" on:click={handleNewCardModalCancelBtn}> Cancel</button>
                                <button class="new-card-modal__submit-btn" on:click={handleNewCardModalSubmitBtn}> Submit Card Info</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>        
</div>        

<style lang="scss">
    $section-spacing: 8px;

    .modal-bg {
        &__content {
            &--main-modal {
                width: 55vw;
                height: 630px;
                max-width: 650px;
                min-width: 450px;
             }
            &--settings-new-card-modal {
            }
        }
    }
    .settings {
        padding: $settings-modal-padding;

        &__description {
            margin: 8px 0px 20px 0px;
            font-size: 1.1rem;
        }
        h3 {
            margin-bottom: 12px;
            opacity: 0.65;
        }
        h4 {
            font-weight: 500;
            font-size: 1.2rem;
        }
        h5 {
            color: rgba(var(--textColor1), 0.8);
        }

        &__msg-btn {
            color: rgba(var(--textColor1), 0.6);
            transition: 0.12s ease-in-out;
            padding: 12px;
            font-size: 1.14rem;
            font-weight: 400;
            border-radius: 25px;
            
            &:active {
                transform: scale(0.99);
            }
            &:hover {
                color: rgba(var(--textColor1), 1);
            }
        }
    }
    .bento-box {
        padding-top: 12px;
        margin-bottom: $section-spacing;
    }
    .settings-tabs {
        position: relative;
        margin: 30px 0px 25px 0px;
        &__container {
            @include flex-container(center, _);
            margin-bottom: 12px;
            transition: 0.15s ease-in-out;
        }
        &__tab {
            font-size: 1.3rem;
            font-weight: 300;
            color: rgba(var(--textColor1), 0.4);
            transition: 0.2s ease-in-out;
            margin-right: 10px;
            @include center;
            
            &--selected {
                color: rgba(var(--textColor1), 1);
                font-weight: 500;
            }
            &--profile {
                min-width: 58px;
            }
            &--plan-details {
                min-width: 87px;
            }
            &--lang {
                min-width: 80px;
            }
            &:hover {
                color: rgba(var(--textColor1), 1);
            }
            &:active {
                transform: scale(0.99);
            }
            &:focus {
                color: rgba(var(--textColor1), 0.8);
            }
        }
        &__divider {
            width: 100%;
            height: 0.5px;
            background-color: rgba(var(--textColor1), 0.12);
            margin-top: 3px;
        }
        &__highlighter {
            position: absolute;
            height: 1px;
            background-color: rgba(var(--textColor1), 1);
            transition: 0.24s ease-in-out;
            bottom: 0px;
            
            &--profile {
                width: 57px;
                left: 0px;
            }
            &--plan {
                width: 79px;
                left: 73px;
            }
            &--lang {
                width: 75px;
                left: 167px;
            }
        }
    }

    /* Profile Section */
    .user-info {
        position: relative;
        h3 {
            margin-bottom: 18px;
        }
        &__main-details {
            display: flex;
            margin-bottom: 50px;
            width: auto;
            height: 110px;
        }
        &__img-container {
            transition: 0.15s ease-in-out;
            height: 110px;
            position: relative;
            margin-right: 10px;
            @include center;

            img {
                border-radius: 35px;
                height: 100%;
                aspect-ratio: 1 / 1;
                object-fit: cover;
                margin: 0px 10px 0px 0px;
                transition: 0.15s ease-in-out;
                -webkit-user-drag: none;
            }
            button {
                opacity: 0;
                visibility: hidden;
                font-weight: 600;
                @include pos-abs-bottom-right-corner(45%, 10px);
                @include center;
            }
            &:hover > button {
                opacity: 100;
                visibility: visible;
                display: block;
            }
            &:hover > img {
                cursor: pointer;
                filter: brightness(0.8);
            }
        }
        &__details-container {
            width: 90%;
        }
        &__top-row {
            width: 100%;
            margin-bottom: 8px;
        }
        &__top-row  &__input-container { 
            width: 46%;
            &:first-child {
                padding-right: 30px;
            }
            input {
                width: 100%;
            }
        }
        &__bottom-row  &__input-container { 
            width: 92%;
        }
        &__bottom-row {
            width: 100%;
            input {
                width: 100%;
            }
        }
        &__input-container {
            position: relative;
            span {
                @include pos-abs-top-left-corner(8px, 13px);
                color: rgba(var(--textColor1), 0.3);
                font-weight: 300;
            }
            input {
                background-color: var(--hoverColor);
                transition: 0.12s ease-in-out;
                padding: 22px 8px 11px 12px;
                font-size: 1.3rem;
                font-weight: 300;
                border-radius: 12px;
                border: 1px solid rgba(211, 211, 211, 0);

                &:focus {
                    border-color: rgba(211, 211, 211, 0.1);
                }
                &::placeholder {
                    opacity: 0.2
                }
            }
        }
        &__logout-btn {
            @include pos-abs-bottom-right-corner(13px, 10px);
        }
        &__top-row {
            @include flex-container(_, _); 
        }
    }
    .login-info {
        position: relative;
        height: 120px;
        &__info-row-section {
            @include flex-container(baseline, _);
            margin-top: 5px;
            width: 100%;
            position: relative;;

            h4 {
                margin-right: 20px;
            }
            p {
                font-weight: 200;
                font-size: 1.2rem;
                opacity: 0.8;
            }
        }
        &__logo {
            @include pos-abs-bottom-right-corner(0px, 0px);
            @include flex-container(center, _);

            svg {
                margin-right: 12px;
            }
            p {
                opacity: 0.7;
                font-weight: 300;
            }
        }
        &__edit-btn {
            @include pos-abs-bottom-right-corner(13px, 6px);
        }
    }
    .close-account { 
        position: relative;
        padding-bottom: 30px;
        button {
            color: #BE7A7A;
            opacity: 0.6;                
            @include pos-abs-bottom-right-corner(15px, 10px);
            
            &:hover {
                color: #BE7A7A;
                opacity: 1;                
            }
        }
    }

    /* Plan Details */
    .plan-details {
        height: 200px;
        position: relative;
        h4 {
            margin: -6px 0px 12px 0px;
            font-size: 2.2rem;
        }
        &__list-container {
            margin-left: 12px;
            display: flex;
        }
        &__list-details {
            margin-right: 40px;
            li {
                list-style-type: disc;
                font-size: 1.2rem;
                font-weight: 200;
                opacity: 0.5;
                margin-bottom: 2px;
            }
        }
        &__upgrade-btn {
            @include pos-abs-bottom-right-corner(28px, 23px);
        }
    }

    /* Payment Method */
    .payment-method {
        height: 220px;
        position: relative;
        h3 {
            margin-bottom: 20px;
        }

        &__next-payment {
            margin: -5px 0px 10px 0px;
            color: rgba(var(--textColor1), 0.8);
        }
        &__edit-payment-method-btn {
            @include pos-abs-bottom-right-corner(25px, 25px);
        }
        .payment-card {
            width: 65%;
            max-width: 250px;
        }
        &__right-section {
            position: relative;
            width: 100%;
            p {
                @include pos-abs-top-right-corner(40px, 0px);
                font-size: 1.7em;
                font-weight: 400;
                width: 180px;
                opacity: 0.8;
                text-align: right;
            }
        }
    }

    /* Language */
    .lang {
        &__dropdown-btn {
            background-color: var(--hoverColor2);
        }
        &__dropdown-btn-icon {
            font-size: 1.3rem;
            margin-right: 7px;
        }
        .dropdown-menu {
            width: 95px;
            left: 2px;
        }
    }

    /* Modals */
    .new-card-modal {
        padding-bottom: 4px;
        h1 {
            font-size: 1.6rem;
            margin-bottom: 20px;
        }
        &__content {
        }
        &__top-section {
            @include flex-container(center, center);
        }
        &__bottom-section {
            width: 300px;
            margin-top: 15px;
        }
        &__card-details-title {
            font-size: 1.25rem;
            margin: 5px 0px 11px 0px;
        }
        &__card-details-container {
            padding: 15px 12px 20px 12px;
            h5 {
                margin-bottom: 8px;
                font-size: 1.1rem;
            }
            input {
                border: 1px solid rgba(var(--textColor1), 0.15);
                border-radius: 4px;
                font-size: 1.2rem;
                font-weight: 600;
                &::placeholder {
                    font-weight: 100;
                    color: rgba(var(--textColor1), 0.15);
                }
            }
        }
        &__card-number {
            width: 100%;
            margin-bottom: 12px;
            padding-right: 25px;
            input {
                padding: 3px 8px 3px 13px;
                width: 100%;
            }
        }
        &__bottom-details {
            @include flex-container(center, _); 
            width: 100%;
        }
        &__exp-date {
            width: 100px;
            margin-right: 20px;
            input {
                padding: 3px 0px 3px 10px;
                width: 70px;
            }
        }
        &__cvv-num {
            width: 40%;
            padding-right: 10px;
            input {
                width: 25px;
                padding: 3px 5px 3px 6px;
            }
        }
        &__buttons-container {
            width: 100%;
            display: flex;
            margin-top: 30px;

            button {
                padding: 8px 0px;
                border-radius: 5px;
                width: 50%;
                font-weight: 700;
                @include center;
            }
        }
        &__cancel-btn {
            border: 1px solid rgba(var(--textColor1), 0.1);
            margin-right: 7px;
        }
        &__submit-btn {
            background-color: rgba(var(--fgColor3), 0.9);
            color: rgba(var(--textColor2), 1);
            
            &:hover {
                filter: brightness(1.05);
            }
        }

        .payment-card {
            width: 220px;
            height: auto;
            
            &__header {
                font-weight: 600;
                font-size: 1.1rem;
                img {
                    width: 15px;
                    aspect-ratio: 1.618;
                    margin-right: 4px;
                }
            }
            &__number {
                font-size: 1.8rem;
            }
            &__bottom-details {
                h6 {
                    font-size: 1rem;
                    margin-bottom: 2px;
                }
                h5 {
                    font-weight: 100;
                    font-size: 0.95rem;
                }
            }
        }
    }
    .languages-modal {

    }

    .payment-card {
        aspect-ratio: 1.618;
        border-radius: 20px;
        padding: 14px;
        background-color: var(--modalBgColor);
        position: relative;
        
        &__header {
            font-weight: 500;
            font-size: 1.2rem;
            color: rgba(var(--textColor1), 0.7);
            img {
                width: 14px;
                aspect-ratio: 1.618;
                margin-right: 10px;
            }
            @include flex-container(center, _);
        }
        &__number {
            display: flex;
            color: rgba(var(--textColor1), 1);
            font-family: "Apercu";
            margin-top: 10%;
            font-size: 1.6em;
            span {
                margin-right: 5px;
            }
        }
        &__bottom-details {
            display: flex;
            width: 100%;
            @include pos-abs-bottom-left-corner(14px, 14px);
            
            h6 {
                font-weight: 300;
                color: rgba(var(--textColor1), 0.6);
                @include elipses-overflow;
            }
            h5 {
                font-weight: 400;
                color: rgba(var(--textColor1), 1);
                @include elipses-overflow;
            }
        }
        &__card-holder {
            width: 62%;
        }
        &__exp-date {
            width: 30%;
        }
    }
</style>