<script lang="ts">
	import quotes from "$lib/data-quotes";
	import { clickOutside, getCurrentTime, isNightTime } from "$lib/helper";
	import { colorThemeState, homePanelData, sessionData } from "$lib/store";
	import { onDestroy, onMount } from "svelte";
	import ActiveSessionView from "./ActiveSessionView.svelte";

    let quote: Quote | null = null
    let isQuoteModalOpen = false
    let isCreateNewSessionModalOpen = false
    let isSessionModalOpen = false
    let session: Session | null = null
    let isLightTheme = false
    let isHeaderElementTextLight = false
    let isTaskMenuExpanded = true
    let isNavMenuExpanded = true
    let interval: any;
    let isDropDownOpen = false
    let is12HourTime = true
    let currentTime = ""
    let isEvening = false
    let baseColor = "248, 177, 187"

    const options = ["A", "B"]

    homePanelData.subscribe((data) => {
        isNavMenuExpanded = data.isNavMenuOpen
        isTaskMenuExpanded = data.isTaskMenuOpen
    })
    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
        isHeaderElementTextLight = theme.isHeaderElementTextLight
        baseColor = theme.fgColor1
    })
    sessionData.subscribe((data) => {
        if (data) session = data
    })

    const handleDropdownOptionClicked = (index: number) => {
        isDropDownOpen = false

        if (index === 0) {
        } 
        else if (index === 1) {
        }
    }
    const handleTimeBtnClicked = () => {
        is12HourTime = !is12HourTime
        currentTime = getCurrentTime(is12HourTime)
    }
    const startTimer = () => {
        interval = setInterval(() => {
            currentTime = getCurrentTime(is12HourTime)
            isEvening = isNightTime()
        }, 1000);
    }

    onDestroy(() => clearInterval(interval))
    onMount(() => {
        startTimer()

        // const quoteData = localStorage.getItem("quoteData")
        
        // if (!quoteData || isQuoteOutDated(new Date(JSON.parse(quoteData!).createdAt))) {
        //     const randomQuoteId = Math.floor(Math.random() * quotes.length)
            
        //     localStorage.setItem("quoteData", JSON.stringify({
        //         quoteId: randomQuoteId,
        //         createdAt: new Date()
        //     }))
        //     quote = quotes[Math.floor(Math.random() * quotes.length)]
        // }
        // else {
        //     quote = quotes[JSON.parse(quoteData).quoteId]
        // }
    })
</script>

<div class={`header ${isLightTheme ? "header--light" : ""} ${isHeaderElementTextLight ? "header--light-text" : ""}`}>
    <!-- Quote Modal -->
    <div class={`modal-bg ${isQuoteModalOpen ? "" : "modal-bg--hidden"}`}>
        <div 
            use:clickOutside on:click_outside={() => isQuoteModalOpen = false} 
            class="modal-bg__content modal-bg__content--no-padding"
        >
            <div class="quote-modal" style={`background-image: url(${quote?.bgImgSrc})`}>
                <div class={`quote-modal__content
                               ${quote?.artCredit === "" ? "quote-modal__content--no-art-credit" : ""}
                               ${quote?.quoteCredit === "" ? "quote-modal__content--no-quote-credit" : ""}
                `}>
                    <div class="quote-modal__content-container">
                        <div class="pos-relative">
                            <h1>Quote of the Week</h1>
                        </div>
                        <p>"{quote?.text}"</p>
                    </div>
                    <span class="quote-modal__artist-credit">{quote?.artCredit}</span>
                    {#if quote?.quoteCredit !== ""}
                        <h4 class="quote-modal__quote-credit">- {quote?.quoteCredit}</h4>
                    {/if}
                </div>
            </div>            
        </div>            
    </div>            
    <!-- New Session Modal -->
    <div class={`modal-bg ${isCreateNewSessionModalOpen ? "" : "modal-bg--hidden"}`}>
        <div 
            use:clickOutside on:click_outside={() => isCreateNewSessionModalOpen = false} 
            class="modal-bg__content"
        >
            <div class="quote-modal" style={`background-image: url(${quote?.bgImgSrc})`}>
                <div class={`quote-modal__content
                               ${quote?.artCredit === "" ? "quote-modal__content--no-art-credit" : ""}
                               ${quote?.quoteCredit === "" ? "quote-modal__content--no-quote-credit" : ""}
                `}>
                    <div class="quote-modal__content-container">
                        <!-- <span class="quote-modal__current-week">{getCurrentWeek()}</span> -->
                        <div class="pos-relative">
                            <h1>Quote of the Week</h1>
                        </div>
                        <p>"{quote?.text}"</p>
                    </div>
                    <span class="quote-modal__artist-credit">{quote?.artCredit}</span>
                    {#if quote?.quoteCredit !== ""}
                        <h4 class="quote-modal__quote-credit">- {quote?.quoteCredit}</h4>
                    {/if}
                </div>
            </div>            
        </div>            
    </div>            
    <!-- Session Modal -->
    <div class={`modal-bg ${isSessionModalOpen ? "" : "modal-bg--hidden"}`}>
        <div 
            use:clickOutside on:click_outside={() => isSessionModalOpen = false} 
            class="modal-bg__content session-modal-content"
        >
            <div class="session-modal">
                <h1>Active Session</h1>
                <ActiveSessionView/>
            </div>            
        </div>            
    </div>            

    <!-- Header Component -->
    <!-- Left Side -->
    <button 
        class={`header-session-btn header__section ${isLightTheme ? "header-session-btn--light-mode" : ""}`}
        on:click={() => isSessionModalOpen = true}
    >
        {#if session}
            <h5>New Session</h5>
            <p class="header-session-btn__add-icon">+</p>
        {:else}
            <div class="header-session-btn__session-tag">S</div>
            <div class="header-session-btn__session-name">Math Homework</div>
            <div class="header-session-btn__session-todos">4 / 7</div>
            <div class="divider"></div>
            <div class="header-session-btn__session-mode">
                <i class="fa-brands fa-airbnb"></i>
            </div>
            <div class="header-session-btn__session-time">14:34</div>
            <div class="header-session-btn__session-cycles">1 / 3</div>
        {/if}
    </button>
    <!-- Right Side -->
    <button class="header__time" on:click={() => handleTimeBtnClicked()}>
        {#if isEvening}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path 
                    d="M6.8452 0.416992C3.40296 0.416992 0.615723 2.94859 0.615723 6.0708C0.615723 9.19302 3.40296 11.7246 6.8452 11.7246C8.53427 11.7246 10.0645 11.1138 11.1877 10.1244C11.3271 10.0007 11.3633 9.80888 11.2741 9.65239C11.1849 9.4959 10.9926 9.40756 10.8003 9.43785C10.5271 9.48075 10.2484 9.50347 9.96134 9.50347C7.2605 9.50347 5.06973 7.51454 5.06973 5.06119C5.06973 3.40039 6.07314 1.95412 7.55874 1.19187C7.72876 1.10353 7.81516 0.926845 7.77335 0.755211C7.73154 0.583578 7.56988 0.454853 7.37478 0.439708C7.19918 0.427088 7.02359 0.419516 6.8452 0.419516V0.416992Z" 
                    fill={`${!isLightTheme ? "url(#paint0_linear_3051_27118)" : "rgb(" + baseColor + ")"}`}
                />
            {#if !isLightTheme}
                <defs>
                    <linearGradient id="paint0_linear_3051_27118" x1="6.9292" y1="-2.89459" x2="6.9292" y2="9.06261" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FAEEE3"/>
                        <stop offset="1" stop-color="#F2C59C"/>
                    </linearGradient>
                </defs>
            {/if}
            </svg>
        {:else}
            {#if isLightTheme}
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none" style="margin-top: 3px;">
                    <path d="M8.16841 11.1703C9.95724 11.1703 11.4074 9.72017 11.4074 7.93135C11.4074 6.14252 9.95724 4.69238 8.16841 4.69238C6.37958 4.69238 4.92944 6.14252 4.92944 7.93135C4.92944 9.72017 6.37958 11.1703 8.16841 11.1703Z" fill={`rgb(${baseColor})`}/>
                    <path d="M8.16823 11.6983C6.09025 11.6983 4.39966 10.0077 4.39966 7.92971C4.39966 5.85172 6.09025 4.16113 8.16823 4.16113C10.2462 4.16113 11.9368 5.85172 11.9368 7.92971C11.9368 10.0077 10.2462 11.6983 8.16823 11.6983ZM8.16823 5.22029C6.6743 5.22029 5.45888 6.43571 5.45888 7.92964C5.45888 9.42357 6.6743 10.639 8.16823 10.639C9.66216 10.639 10.8776 9.42357 10.8776 7.92964C10.8776 6.43571 9.66216 5.22029 8.16823 5.22029Z" fill={`rgb(${baseColor})`}/>
                    <path d="M8.16828 3.3798C7.8758 3.3798 7.63867 3.14268 7.63867 2.85019V1.12824C7.63867 0.835758 7.8758 0.598633 8.16828 0.598633C8.46077 0.598633 8.6979 0.835758 8.6979 1.12824V2.85019C8.6979 3.14268 8.46077 3.3798 8.16828 3.3798Z" fill={`rgb(${baseColor})`}/>
                    <path d="M8.16828 15.2607C7.8758 15.2607 7.63867 15.0235 7.63867 14.731V13.0091C7.63867 12.7166 7.8758 12.4795 8.16828 12.4795C8.46077 12.4795 8.6979 12.7166 8.6979 13.0091V14.731C8.6979 15.0236 8.46077 15.2607 8.16828 15.2607Z" fill={`rgb(${baseColor})`}/>
                    <path d="M14.9696 8.45864H13.2476C12.9551 8.45864 12.718 8.22151 12.718 7.92903C12.718 7.63654 12.9551 7.39941 13.2476 7.39941H14.9696C15.2621 7.39941 15.4992 7.63654 15.4992 7.92903C15.4992 8.22151 15.2621 8.45864 14.9696 8.45864Z" fill={`rgb(${baseColor})`}/>
                    <path d="M3.08896 8.45864H1.36701C1.07453 8.45864 0.837402 8.22151 0.837402 7.92903C0.837402 7.63654 1.07453 7.39941 1.36701 7.39941H3.08896C3.38144 7.39941 3.61857 7.63654 3.61857 7.92903C3.61857 8.22151 3.38144 8.45864 3.08896 8.45864Z" fill={`rgb(${baseColor})`}/>
                    <path d="M11.7603 4.86662C11.6248 4.86662 11.4892 4.81493 11.3858 4.71148C11.179 4.50465 11.179 4.1693 11.3858 3.96254L12.6034 2.74499C12.8103 2.53816 13.1456 2.53809 13.3524 2.74499C13.5592 2.95182 13.5592 3.28717 13.3524 3.49394L12.1348 4.71148C12.0314 4.81493 11.8958 4.86662 11.7603 4.86662Z" fill={`rgb(${baseColor})`}/>
                    <path d="M3.35943 13.269C3.22392 13.269 3.08834 13.2173 2.98496 13.1139C2.77813 12.907 2.77813 12.5717 2.98496 12.3649L4.20257 11.1473C4.4094 10.9405 4.74475 10.9405 4.95151 11.1473C5.15834 11.3541 5.15834 11.6895 4.95151 11.8963L3.7339 13.1139C3.63052 13.2173 3.49501 13.269 3.35943 13.269Z" fill={`rgb(${baseColor})`}/>
                    <path d="M12.9777 13.269C12.8422 13.269 12.7066 13.2173 12.6032 13.1139L11.3856 11.8963C11.1788 11.6894 11.1788 11.3541 11.3856 11.1473C11.5924 10.9405 11.9278 10.9405 12.1345 11.1473L13.3521 12.3649C13.559 12.5718 13.559 12.9071 13.3521 13.1139C13.2488 13.2173 13.1133 13.269 12.9777 13.269Z" fill={`rgb(${baseColor})`}/>
                    <path d="M4.57704 4.86662C4.44153 4.86662 4.30595 4.81493 4.20257 4.71148L2.98496 3.49394C2.77813 3.2871 2.77813 2.95182 2.98496 2.74499C3.19179 2.53816 3.52714 2.53809 3.7339 2.74499L4.95151 3.96254C5.15834 4.16937 5.15834 4.50465 4.95151 4.71148C4.84813 4.81493 4.71262 4.86662 4.57704 4.86662Z" fill={`rgb(${baseColor})`}/>
                </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
                    <path d="M7.63691 11.4037C9.42574 11.4037 10.8759 9.95357 10.8759 8.16474C10.8759 6.37591 9.42574 4.92578 7.63691 4.92578C5.84808 4.92578 4.39795 6.37591 4.39795 8.16474C4.39795 9.95357 5.84808 11.4037 7.63691 11.4037Z" fill="url(#paint0_linear_3054_27121)"/>
                    <path d="M7.63674 11.9317C5.55876 11.9317 3.86816 10.2411 3.86816 8.16311C3.86816 6.08512 5.55876 4.39453 7.63674 4.39453C9.71472 4.39453 11.4053 6.08512 11.4053 8.16311C11.4053 10.2411 9.71472 11.9317 7.63674 11.9317ZM7.63674 5.45368C6.14281 5.45368 4.92739 6.66911 4.92739 8.16304C4.92739 9.65696 6.14281 10.8724 7.63674 10.8724C9.13067 10.8724 10.3461 9.65696 10.3461 8.16304C10.3461 6.66911 9.13067 5.45368 7.63674 5.45368Z" fill="url(#paint1_linear_3054_27121)"/>
                    <path d="M7.63679 3.6132C7.3443 3.6132 7.10718 3.37607 7.10718 3.08359V1.36164C7.10718 1.06916 7.3443 0.832031 7.63679 0.832031C7.92928 0.832031 8.1664 1.06916 8.1664 1.36164V3.08359C8.1664 3.37607 7.92928 3.6132 7.63679 3.6132Z" fill="url(#paint2_linear_3054_27121)"/>
                    <path d="M7.63679 15.4941C7.3443 15.4941 7.10718 15.2569 7.10718 14.9644V13.2425C7.10718 12.95 7.3443 12.7129 7.63679 12.7129C7.92928 12.7129 8.1664 12.95 8.1664 13.2425V14.9644C8.1664 15.257 7.92928 15.4941 7.63679 15.4941Z" fill="url(#paint3_linear_3054_27121)"/>
                    <path d="M14.4381 8.69204H12.7161C12.4236 8.69204 12.1865 8.45491 12.1865 8.16242C12.1865 7.86994 12.4236 7.63281 12.7161 7.63281H14.4381C14.7306 7.63281 14.9677 7.86994 14.9677 8.16242C14.9677 8.45491 14.7306 8.69204 14.4381 8.69204Z" fill="url(#paint4_linear_3054_27121)"/>
                    <path d="M2.55746 8.69204H0.83552C0.543033 8.69204 0.305908 8.45491 0.305908 8.16242C0.305908 7.86994 0.543033 7.63281 0.83552 7.63281H2.55746C2.84995 7.63281 3.08708 7.86994 3.08708 8.16242C3.08708 8.45491 2.84995 8.69204 2.55746 8.69204Z" fill="url(#paint5_linear_3054_27121)"/>
                    <path d="M11.2288 5.10002C11.0933 5.10002 10.9577 5.04833 10.8543 4.94488C10.6475 4.73804 10.6475 4.40269 10.8543 4.19593L12.072 2.97839C12.2788 2.77156 12.6141 2.77149 12.8209 2.97839C13.0277 3.18522 13.0277 3.52057 12.8209 3.72733L11.6033 4.94488C11.4999 5.04833 11.3643 5.10002 11.2288 5.10002Z" fill="url(#paint6_linear_3054_27121)"/>
                    <path d="M2.82793 13.5024C2.69242 13.5024 2.55684 13.4507 2.45346 13.3473C2.24663 13.1404 2.24663 12.8051 2.45346 12.5983L3.67108 11.3807C3.87791 11.1739 4.21326 11.1739 4.42002 11.3807C4.62685 11.5875 4.62685 11.9229 4.42002 12.1297L3.2024 13.3473C3.09902 13.4507 2.96351 13.5024 2.82793 13.5024Z" fill="url(#paint7_linear_3054_27121)"/>
                    <path d="M12.4462 13.5024C12.3107 13.5024 12.1751 13.4507 12.0717 13.3473L10.8541 12.1297C10.6473 11.9228 10.6473 11.5875 10.8541 11.3807C11.0609 11.1739 11.3963 11.1739 11.603 11.3807L12.8207 12.5983C13.0275 12.8052 13.0275 13.1405 12.8207 13.3473C12.7173 13.4507 12.5818 13.5024 12.4462 13.5024Z" fill="url(#paint8_linear_3054_27121)"/>
                    <path d="M4.04555 5.10002C3.91004 5.10002 3.77446 5.04833 3.67108 4.94488L2.45346 3.72733C2.24663 3.5205 2.24663 3.18522 2.45346 2.97839C2.66029 2.77156 2.99564 2.77149 3.2024 2.97839L4.42002 4.19593C4.62685 4.40276 4.62685 4.73804 4.42002 4.94488C4.31664 5.04833 4.18113 5.10002 4.04555 5.10002Z" fill="url(#paint9_linear_3054_27121)"/>
                    <defs>
                    <linearGradient id="paint0_linear_3054_27121" x1="7.63691" y1="6.0344" x2="7.63691" y2="11.4037" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_3054_27121" x1="7.63674" y1="5.68442" x2="7.63674" y2="11.9317" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint2_linear_3054_27121" x1="7.63679" y1="1.30799" x2="7.63679" y2="3.6132" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint3_linear_3054_27121" x1="7.63679" y1="13.1889" x2="7.63679" y2="15.4941" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint4_linear_3054_27121" x1="13.5771" y1="7.81408" x2="13.5771" y2="8.69204" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint5_linear_3054_27121" x1="1.69649" y1="7.81408" x2="1.69649" y2="8.69204" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint6_linear_3054_27121" x1="11.8376" y1="3.21288" x2="11.8376" y2="5.10002" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint7_linear_3054_27121" x1="3.43674" y1="11.6152" x2="3.43674" y2="13.5024" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint8_linear_3054_27121" x1="11.8374" y1="11.6152" x2="11.8374" y2="13.5024" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    <linearGradient id="paint9_linear_3054_27121" x1="3.43674" y1="3.21288" x2="3.43674" y2="5.10002" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F4D3A2"/>
                        <stop offset="1" stop-color="#F8E8CF"/>
                    </linearGradient>
                    </defs>
                </svg>
            {/if}
        {/if}
        <h2>{currentTime}</h2>
        </button>
</div>

<style lang="scss">
    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);
        
        &__section {
            border-radius: 20px;
            height: 35px;
            @include flex-container(center, _);
            padding: 11px 15px 11px 12px;
            background: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            box-shadow: var(--headerElementShadow);
            white-space: nowrap;
        }
        &__time {
            @include flex-container(center, _);
            transition: 0.1s ease-in-out;
            cursor: pointer;

            svg {
                margin: 0px 7px 0px 0px;
            }
            h2 {
                font-size: 1.45rem;
                font-weight: 300;
                color: rgba(var(--fgColor1), 1);
            }

            &:active {
                transform: scale(0.99);
            }
        }

        &--light &__time h2 {
            font-weight: 400;
        }

        /* Styling for when Header Element Bg Color is Dark */
        &--light-text &-user-details {
            p {
                color: rgba(var(--headerElementTextColor), 1) !important;
            }
        }
        &--light-text &-settings__user-stats {
            color: rgba(var(--headerElementTextColor), 0.75) !important;
        }
        &--light-text &-settings__time {
            color: rgba(var(--headerElementTextColor), 0.9) !important;

            span {
                font-family: 400 !important;
            }
        }
        &--light-text &-settings__settings-btn {
            svg {
                color: rgba(var(--headerElementTextColor), 1) !important;
            }
        }
    }

    .header-session-btn {
        overflow: hidden;
        padding: 0px 15px;
        margin-right: 10px;
        color: rgba(var(--headerElementTextColor), 1);
        align-items: center;
        transition: 0.1s ease-in-out;

        img {
            @include circle(20px);
        }
        span {
            font-weight: 500;
            margin-left: 4px;
            font-size: 1.2rem;
        }
        &:active {
            transform: scale(0.992);
        }
        &--light-mode p {
            font-weight: 300;
        }
        &--light-mode span {
            font-weight: 500;
        }
        &--light-mode &__session-todos, &--light-mode &__session-cycles {
            font-weight: 400;
            color: rgba(var(--headerElementTextColor), 0.8);
        }
        
        &__add-icon {
            font-size: 1.5rem;
            font-weight: 100;
            margin-left: 10px;
        }
        &__session-tag {
            @include circle(17px);
            @include center;
            background-color: rgba(var(--fgColor1), 1);
            margin: 0px 8px 0px -5px;
            color: white;
        } 
        &__session-name {
            font-size: 1.1rem;
            margin-right: 7px;
        }
        &__session-todos, &__session-cycles {
            color: rgba(var(--headerElementTextColor), 0.5);
            font-weight: 500;
            font-size: 0.95rem;
            margin-top: 2px;
        }
        .divider {
            background-color: rgba(var(--headerElementTextColor), 0);
            margin: 0px 2px 0px 10px;
            width: 0.8px;
            height: 10px;
        }
        &__session-mode {
            i {
                color: rgba(var(--headerElementTextColor), 0.85);
                margin: 2px -3px 0px 5px;
                font-size: 1.2rem;
            }
        }
        &__session-time {
            color: rgba(var(--headerElementTextColor), 0.85);
            font-size: 1.27rem;
            font-weight: 500;
            margin: 0px 8px 0px 9px;
        }
    }

    /* Modals */
    .modal-bg__content {
        border-radius: 0px;
    }
    .quote-modal {
        padding: 0px;
        width: 75vw;
        height: 400px;
        position: relative;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        max-width: 650px;
        min-width: 330px;

        &__content {
            height: 100%;
            background-color: rgba(0, 0, 0, 0.84); 
            color: white;

            &--no-art-credit {
                padding-top: 20px;
            }
            &--no-quote-credit {
                padding-bottom: 35px;
            }

            h1 {
                font-size: 1.4rem;
                margin: 2px 0px 6px 0px;
            }
            p {
                font-size: 1.3rem;
                font-weight: 400;
                opacity: 0.85;
                color: rgb(215, 215, 215);
            }
            i {    
                font-size: 1.2rem;
                opacity: 0.85;
                color: rgb(219, 219, 219);
                @include pos-abs-top-right-corner(0px, 0px);
            } 
        }

        &__content-container {
            width: 90%;
            @include pos-abs-bottom-left-corner(60px, 20px);
        }
        &__artist-credit {
            font-size: 1.15rem;
            @include pos-abs-top-right-corner(15px, 20px);
            color: rgba(197, 197, 197, 0.5);
            font-weight: 300;
        }
        &__quote-credit {
            font-size: 1.25rem;
            font-weight: 500;
            color: rgb(197, 197, 197, 0.9);
            @include pos-abs-bottom-right-corner(30px, 25px);
        }
    }
    .session-modal-content {
        border-radius: 15px;
        padding: 15px 22px 28px 22px;
    }
    .session-modal {
        width: 500px;

        h1 {
            margin-bottom: 15px;
        }

        @include sm(max-width) {
            width: 75vw;
        }
    }

</style>