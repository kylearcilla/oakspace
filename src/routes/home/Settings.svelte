<script lang="ts">
	import { clickOutside, formatDateToMMDD } from '$lib/helper';
	import { onMount } from 'svelte';

    export let onNavButtonClicked: any;

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

    const closeModal = () => onNavButtonClicked("")

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


	function handleLanguageBtn(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		throw new Error('Function not implemented.');
	}


	function handleDeleteBtn(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
		throw new Error('Function not implemented.');
	}
</script>

<div class="modal-bg">
    <div use:clickOutside on:click_outside={closeModal} class="modal-bg__content modal-bg__content--main-modal modal-bg__content--overflow-y-scroll">
        <div class="settings">
            <h1 class="modal-bg__content-title">Settings</h1>
            <p class="modal-bg__content-copy">View and update your account and profile details.</p>
            <!-- User Info -->
            <div class="user-info grid-section">
                <h2>User Info</h2>
                <div class="flx">
                    <div class="user-info__img-container">
                        <img src={userDetails.profileImageSrc} alt="">
                        <button on:click={handleChangeProfilePic}>Edit</button>
                    </div>
                    <div class="user-info__info-container">
                        <div class="user-info__info-row info-row">
                            <h3>First Name</h3>
                            <p>{userDetails.firstName}</p>
                            <button on:click={() => handleEditUserInfo("firstName")}>
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <div class="divider divider--thin"></div>
                        </div>
                        <div class="user-info__info-row info-row">
                            <h3>Last Name</h3>
                            <p>{userDetails.lastName}</p>
                            <button on:click={() => handleEditUserInfo("lastName")}>
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <div class="divider divider--thin"></div>
                        </div>
                        <div class="user-info__info-row info-row">
                            <h3>Account Name</h3>
                            <p>{userDetails.username}</p>
                            <button on:click={() => handleEditUserInfo("username")}>
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button on:click={handleLogOut} class="user-info__logout-btn btn-line">
                    Log Out
                </button>
            </div>
            <!-- Login Info -->
            <div class="login-info grid-section">
                <h2>Login Info</h2>
                <div class="login-info__info-row info-row">
                    <h3>Email</h3>
                    <p>{userDetails.logInInfo.email}</p>
                    <button on:click={() => handleEditUserInfo("email")}>
                        Change Email
                    </button>
                    <div class="divider divider--thin"></div>
                </div>
                <div class="login-info__info-row info-row">
                    <h3>Password</h3>
                    <p class="password-text">{userDetails.logInInfo.password}</p>
                    <button on:click={() => handleEditUserInfo("passwprd")}>
                        Change Password
                    </button>
                    <div class="divider divider--thin"></div>
                </div>
                <div class="login-info__info-row info-row">
                    <h3>Login Provider</h3>
                    <p>{userDetails.logInInfo?.loginProvider ?? "None"}</p>
                    <button on:click={() => handleEditUserInfo("loginProvider")}>
                        {userDetails.logInInfo.loginProvider ? "Change Login Provider" : "Add Login Provider"}
                    </button>
                </div>
            </div>
            <!-- App Language -->
            <div class="language grid-section">
                <h2>Language & Region</h2>
                <div class="flx flx--space-between flx--algn-center">
                    <h3>Chosen Language</h3>
                    <div class="lang-dropdown dropdown-container">
                        <button on:click={handleLanguageBtn} class="lang-dropdown__dropdown-btn dropdown-btn">
                            <div class="lang-dropdown__icon">🇰🇷</div>
                            <div class="dropdown-btn__title">
                                Korean
                            </div>
                            <div class="dropdown-btn__icon">
                                <div class="dropdown-btn__icon-triangle-up">
                                    <i class="fa-solid fa-chevron-up"></i>
                                </div>
                                <div class="dropdown-btn__icon-triangle-down">
                                    <i class="fa-solid fa-chevron-down"></i>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Subscription Stuff -->
            <div class="user-plan-container grid-section">
                <!-- Plan Details -->
                <div class="plan-details">
                    <h2>Plan Details</h2>
                    <div class="plan-details__header">
                        <h4>{userDetails.isUserPremium ? "Premium" : "Basic"}</h4>
                        <h5>${userDetails.isUserPremium ? planDetails.premium.price : planDetails.basic.price} / month</h5>
                    </div>
                    <div class="plan-details__subheader">My Plan</div>
                    <ul class="plan-details__details-list">
                        {#each userDetails.isUserPremium ? planDetails.premium.details : planDetails.basic.details as planDetail}
                            <li><span>•</span>{planDetail}</li>
                        {/each}
                    </ul>
                    <button on:click={handleUpgradeToPremium} class="plan-details__upgrade-btn btn-line">
                        Upgrade to Premium
                    </button>
                </div>
                <div class="divider divider--vertical divider--thin"></div>
                <!-- Payment Method -->
                <div class="payment-method">
                    <h2>Payment Method</h2>
                    <p class="payment-method__next-payment">Your next bill is for $9.99 + tax on 7/11/23.</p>
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
                    <button on:click={handleEditPaymentMethod} class="payment-method__edit-payment-method-btn btn-line">
                        Change Card
                    </button>
                </div>
            </div>
            <!-- User Payment Cards -->
            <div class="payment-cards grid-section">
                <h2>Payment Cards</h2>
                <ul>
                    {#each userDetails.paymentCards as card}                            
                        <li class="payment-cards__card-item">
                            <div class="payment-cards__card-main-details">
                                <div class="payment-cards__card-logo-container">
                                    <img src={card.paymentNetwork.imgLogoSrc} alt="">
                                </div>
                                <h4>{card.paymentNetwork.name}</h4>
                            </div>
                                <p class="payment-cards__card-digits">**** **** **** **** {card.lastFourDigits}</p>
                                <p class="payment-cards__card-exp-date">{formatDateToMMDD(card.expDate)}</p>
                            <button on:click={handleRemovePaymentCard} class="payment-method__remove-card-btn">
                                Remove Card
                            </button>
                        </li>
                    {/each}
                </ul>
                <button on:click={handleAddNewCardBtn} class="payment-cards__add-new-card-btn btn-line">
                    Add New Card +
                </button>
            </div>
            <!-- Close Account -->
            <div class="close-account grid-section">
                <h2>Close Account</h2>
                <button on:click={handleDeleteBtn} class="close-account__delete-btn btn-line">
                    Delete My Account
                </button>
            </div>
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
                                <h4 class="new-card-modal__card-details-title">Details</h4>
                                <form class="new-card-modal__card-details-container grid-section">
                                    <!-- <h3>Card Info</h3> -->
                                    <div class="new-card-modal__card-number">
                                        <h4>Card Number</h4>
                                        <input 
                                        type="text" 
                                        placeholder="0000 0000 0000 0000"
                                        />
                                    </div>
                                    <div class="new-card-modal__bottom-details">
                                        <div class="new-card-modal__exp-date">
                                            <h4>Exp. Date</h4>
                                            <input 
                                                type="text" 
                                                placeholder="MM / YYYY"
                                            />
                                        </div>
                                        <div class="new-card-modal__cvv-num">
                                            <h4>CVV</h4>
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
                width: 80vw;
                height: 700px;
                max-width: 800px;
                min-width: 450px;
            }
            &--settings-new-card-modal {
            }
        }
    }
    .settings {        
        &__description {
            margin: 8px 0px 20px 0px;
            font-size: 1.1rem;
        }
        h2 {
            font-size: 1.15rem;
            margin-bottom: 10px;
        }
        h3 {
            font-size: 1rem;
            opacity: 0.85;
        }
    }
    .info-row {
        width: 100%;
        position: relative;
        padding-bottom: 10px;
        margin-bottom: 10px;
        @include flex-container(center, space-between);
        h3 {
            width: 100px;
        }
        p {
            font-size: 1.02rem;
        }

        .divider {
            @include pos-abs-bottom-right-corner(0px, 0px);
        }
    }
    .grid-section {
        margin-bottom: $section-spacing;
    }

    /* Sections */
    .user-info {
        height: 200px;
        position: relative;
        h2 {
            margin-bottom: 15px;
        }
        img {
            border-radius: 100%;
            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: cover;
            margin: 0px 10px 0px 0px;
            transition: 0.15s ease-in-out;
            -webkit-user-drag: none;
        }
        &__img-container {
            transition: 0.15s ease-in-out;
            width: 110px;
            position: relative;

            button {
                transition: 0.2s ease-in-out;
                opacity: 0;
                visibility: hidden;
                color: rgba(var(--textColor2), 0.7);
                @include pos-abs-bottom-right-corner(40%, 10px);
                @include center;
                
                &:hover {
                    color: rgba(var(--textColor2), 1);
                }
                &:active {
                    transform: scale(0.98);
                }
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
        &__info-container {
            width: 80%;
            margin-top: 12px;
        }
        &__info-row {
            padding-left: 20px;

            &:hover > button {
                opacity: 100;
                visibility: visible;
            }

            button {
                transition: 0.15s ease-in-out;
                color: rgba(var(--textColor1), 0.7);
                padding: 0px 5px 0px 5px;
                opacity: 0;
                visibility: hidden;

                &:hover {
                    color: rgba(var(--textColor1), 0.5);
                }
                &:active {
                    transform: scale(0.9);
                }
            }
            .divider {
                width: 96%;
            }
        }
        &__logout-btn {
            @include pos-abs-bottom-right-corner(20px, 15px);
        }
    }
    .login-info {
        h2 {
            margin-bottom: 12px;
        }
        button {
            transition: 0.15s ease-in-out;
            width: 110px;
            text-align: end;
            opacity: 0.7;

            &:active {
                transform: scale(0.98);
            }
            &:hover {
                opacity: 1;
            }
        }
    }
    .user-plan-container {
        display: flex;
        position: relative;

        .divider {
            @include abs-center;
            width: 0.1px;
            height: 70%;
            margin-top: -5px;
        }
    }
    .plan-details {
        width: 47%;
        position: relative;
        padding-bottom: 80px;

        &__header {
            @include flex-container(flex-end, space-between);
            h4 {
                margin-top: -2px;
                font-size: 2rem;
            }
            h5 {
                font-weight: 400;
                font-size: 1em;
                color: rgba(var(--textColor1), 0.9);
            }
        }
        &__details-list {
            margin-top: 15px;
            li {
                color: rgba(var(--textColor1), 0.9);
                font-weight: 400;
                font-size: 1.05rem;
                @include elipses-overflow;
                span {
                    margin-right: 7px;
                }
            }
        }
        &__upgrade-btn {
            transition: 0.15s ease-in-out;
            @include pos-abs-bottom-right-corner(0px, 5px);

            &:hover {
                color: rgba(var(--textColor2), 1);
            }
            &:active {
                transform: scale(0.98);
            }
        }
    }
    .payment-method {
        width: 50%;
        margin-left: 5%;
        padding-left: 3%;
        position: relative;

        &__next-payment {
            margin: -5px 0px 10px 0px;
            color: rgba(var(--textColor1), 0.8);
        }

        &__edit-payment-method-btn {
            transition: 0.15s ease-in-out;
            @include pos-abs-bottom-right-corner(0px, 5px);

            &:hover {
                color: rgba(var(--textColor2), 1);
            }
            &:active {
                transform: scale(0.98);
            }
        }
        .payment-card {
            width: 65%;
            max-width: 200px;
        }
    }
    .payment-cards {
        position: relative;
        width: 100%;
        padding-bottom: 60px;
        h3 {
            margin: 3px 0px 8px 0px;
            font-size: 1.1rem;
        }
        &__card-item {
            @include flex-container(center, space-between);
            text-align: center;
            width: 100%;
            padding: 5px 0px;

            button {
                transition: 0.15s ease-in-out;
                color: rgba(var(--textColor1), 0.7);
                padding: 0px 0px 0px 10px;
                font-weight: 600;

                &:hover {
                    color: rgba(var(--textColor1), 0.5);
                }
                &:active {
                    transform: scale(0.98);
                }
            }
        }
        &__card-main-details {
            display: flex;
            width: 80px;
        }
        &__card-logo-container {
            @include center;
            width: 20px;
            background-color: var(--hoverColor);
            border-radius: 4px;
            margin-right: 5px;
            img {
                width: 10px;
            }
        }
        &__card-digits, &__card-exp-date {
            opacity: 0.7;
        }
        &__add-new-card-btn {
            @include pos-abs-bottom-right-corner(15px, 15px);
        }
    }
    .language {
        .lang-dropdown {
            &__icon {
                font-size: 1.3rem;
                margin-right: 5px;
            }
        }
        .dropdown-btn {
            &__title {
                margin-right: 0px;
            }
        }
    }
    .close-account { 
        position: relative;
        padding-bottom: 30px;
        button {
            border: solid 1px #BE7A7A;
            color: #BE7A7A;
            @include pos-abs-bottom-right-corner(15px, 15px);
    
            &:hover {
                background-color: #BE7A7A;
                color: rgb(var(--textColor2));
            }
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
            h4 {
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
                transition: 0.15s ease-in-out;
                padding: 8px 0px;
                border-radius: 5px;
                width: 50%;
                font-weight: 700;
                @include center;

                &:active {
                    transform: scale(0.98);
                }
            }
        }
        &__cancel-btn {
            border: 1.45px solid rgba(var(--textColor1), 0.1);
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
        border-radius: 5px;
        padding: 10px;
        background-color: #131314;
        position: relative;
        
        &__header {
            font-weight: 300;
            font-size: 0.8rem;
            color: rgba(var(--textColor2), 0.9);
            img {
                width: 10px;
                aspect-ratio: 1.618;
                margin-right: 4px;
            }
            @include flex-container(center, _);
        }
        &__number {
            display: flex;
            color: rgba(var(--textColor2), 1);
            font-family: "Apercu";
            margin-top: 15%;
            font-size: 1.6em;
            span {
                margin-right: 5px;
            }
        }
        &__bottom-details {
            display: flex;
            width: 100%;
            @include pos-abs-bottom-left-corner(12px, 12px);
            
            h6 {
                font-weight: 400;
                color: rgba(var(--textColor2), 0.6);
                @include elipses-overflow;
            }
            h5 {
                color: rgba(var(--textColor2), 1);
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