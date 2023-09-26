<script lang="ts">
	import { getCurrentTime, isNightTime } from "$lib/utils-date"
	import { colorThemeState, globalSessionObj, globalSessionState, homeViewLaout, musicDataStore, ytUserData } from "$lib/store"
	import { onDestroy, onMount } from "svelte"
	import ActiveSessionView from "./SessionActiveModal.svelte"
	import QuoteModal from "./ModalQuote.svelte"
	import NewSessionModal from "./SessionNewModal.svelte"
	import type { Session } from "$lib/pom-session"
	import { updateUI } from "$lib/utils-general";
	import { get } from "svelte/store";

    enum CurrentModal { Quote, NewSession, ActiveSession }

    let currModalOpen : CurrentModal | null = null
    let isLightTheme = false
    let interval:  NodeJS.Timer
    let is12HourTime = true
    let currentTime = ""
    let isEvening = false
    let headerTimeColor = "#8D907C"

    let dropdownMenu: HTMLElement

    let isDropdownOpen = false
    let isVideoViewOpen = false
    let isMusicPlayerOpen = false
    let isYoutubeAvailable = false
    let isMusicAvailable = false

    let isSessionActive = false
    let sessionObj: Session | null = null
    let activeSession: ActiveSessionState | null = null

    globalSessionObj.subscribe((sess: any) => {
        if (sess) {
            isSessionActive = true
            sessionObj = sess
        }
        else { 
            isSessionActive = false
        }

    })
    ytUserData.subscribe((data: any) => {
        isYoutubeAvailable = data.username != '' ? true : false
    })
    musicDataStore.subscribe((data: any) => {
        isMusicAvailable = data != null
    })

    globalSessionState.subscribe((sessionState: any) => {
        activeSession = sessionState
    })
    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
        headerTimeColor = theme.headerTimeColor
    })
    homeViewLaout.subscribe((data) => {
        if (!isVideoViewOpen && data.isVideoViewOpen) {
            currModalOpen = null
        } 

        isVideoViewOpen = data.isVideoViewOpen
        isMusicPlayerOpen = data.isMusicPlayerOpen
    })


    const toggleModal = (modal: CurrentModal | null): void => {
        currModalOpen = modal
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && currModalOpen === CurrentModal.NewSession) {
            currModalOpen = null
        }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
        if (!isSessionActive && event.key.toLocaleLowerCase() === "n") {
            currModalOpen = CurrentModal.NewSession
        }
    }

    /* Dropdown Menu */
    const handleOptionClicked = (event: MouseEvent, idx: number) => {
        if (idx === 0) {
            console.log("LOGGING OUT USER")
        }
        else if (idx === 1) {
            const homeViewLaoutObj = get(homeViewLaout)
            updateUI({ ...homeViewLaoutObj, isVideoViewOpen: !homeViewLaoutObj.isVideoViewOpen})
        }
        else if (idx === 2) {
            const homeViewLaoutObj = get(homeViewLaout)
            updateUI({ ...homeViewLaoutObj, isMusicPlayerOpen: !homeViewLaoutObj.isMusicPlayerOpen})
        }
        dropdownMenu.style.display = "none"
    }
    /* Time Stuff */
    const handleTimeBtnClicked = () => {
        is12HourTime = !is12HourTime
        currentTime = getCurrentTime(is12HourTime)
    }
    const startTimer = () => {
        interval = setInterval(() => {
            currentTime = getCurrentTime(is12HourTime)
            isEvening = isNightTime()

        }, 1000)
    }

    onDestroy(() => clearInterval(interval))
    onMount(() => startTimer())
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class={`header header${isLightTheme ? "--light" : "--dark"}`}>
    {#if currModalOpen === CurrentModal.Quote}
        <QuoteModal toggleModal={toggleModal} />
    {:else if currModalOpen === CurrentModal.NewSession}
        <NewSessionModal toggleModal={toggleModal} />
    {:else if isVideoViewOpen && currModalOpen === CurrentModal.ActiveSession}
        <ActiveSessionView toggleModal={toggleModal} />
    {/if}         

    <!-- Left Side -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="user-panel" 
        on:mouseover={() => dropdownMenu.style.display = "block"} 
        on:mouseleave={() => dropdownMenu.style.display = "none"}
    >
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="">
        <div class="user-panel__user-details">
            <div class="user-panel__user-details-user">Kyle Arcilla</div>
            <div class="user-panel__user-details-subheading">
                {#if isVideoViewOpen}
                    <div class="user-panel__user-details-session-stat" title="4 sessions done.">
                        <i class="fa-regular fa-hourglass-half"></i>
                        <span>4</span>
                    </div>
                    <div class="user-panel__user-details-session-stat" title="2h 32m of focus time today.">
                        <i class="fa-brands fa-readme"></i>
                        <span>2h 32m</span>
                    </div>
                    <div class="user-panel__user-details-session-stat" title="1h 3m of break time today.">
                        <i class="fa-solid fa-seedling"></i>
                        <span>1h 3m</span>
                    </div>
                {:else}
                    <div class="user-panel__user-details-email">
                        kylearcilla09@gmail.com
                    </div>
                {/if}
            </div>
        </div>
        <div class="dropdown-container" bind:this={dropdownMenu}>
            <ul class="dropdown-menu">
                <li class="dropdown-menu__option">
                    <button class="dropdown-element" on:click={(event) => handleOptionClicked(event, 0)}>
                        <p>Log Out</p>
                    </button>
                </li>
                {#if isYoutubeAvailable || isMusicAvailable}
                    <div class="divider"></div>
                {/if}
                {#if isYoutubeAvailable}
                    <li class="dropdown-menu__option">
                        <button class="dropdown-element" on:click={(event) => handleOptionClicked(event, 1)}>
                            <p>{`${isVideoViewOpen ? "Hide": "Show"} Video View`}</p>
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-brands fa-youtube"></i>
                            </div>
                        </button>
                    </li>
                {/if}
                {#if isMusicAvailable}
                    <li class="dropdown-menu__option">
                        <button class="dropdown-element" on:click={(event) => handleOptionClicked(event, 2)}>
                            <p>{`${isVideoViewOpen ? "Hide": "Show"} Music Player`}</p>
                            <div class="dropdown-menu__option-icon">
                                <i class="fa-solid fa-music"></i>
                            </div>
                        </button>
                    </li>
                {/if}
            </ul>
        </div>
    </div>

    <!-- Right Side -->
    {#if isVideoViewOpen}
        <button 
            class={`header-session-btn header__section ${isLightTheme ? "header-session-btn--light-mode" : ""}`}
            on:click={() => {
                if (activeSession) toggleModal(CurrentModal.ActiveSession)
                else toggleModal(CurrentModal.NewSession)
            }}
        >
            {#if !activeSession}
                <div class="header-session-btn__new-session-title">New Session</div>
                <div class="header-session-btn__new-session-icon">+</div>
            {:else}
                <div title={activeSession?.tag.name} class="header-session-btn__session-tag">
                    {activeSession?.tag.name[0].toLocaleUpperCase()}
                </div>
                <div class="header-session-btn__session-name">{activeSession?.name}</div>
                {#if activeSession.todos.length > 0}
                    <div title={`${activeSession.todosCheckedCount} completed`} class="header-session-btn__session-todos">
                        {`${activeSession.todosCheckedCount} / ${activeSession.todos.length}`}
                    </div>
                {/if}
                <div 
                    title={sessionObj?.iCurrentlyFocusTime() ? "Focus Time" : "Break Time"} 
                    class="header-session-btn__session-mode"
                >
                    {#if sessionObj?.iCurrentlyFocusTime()}
                        <i class="fa-brands fa-readme"></i>
                    {:else}
                        <i class="fa-solid fa-seedling"></i>
                    {/if}
                </div>
                <div class="header-session-btn__session-time">
                    {`${activeSession?.currentTime?.minutes}:${String(activeSession?.currentTime?.seconds).padStart(2, '0')}`}
                </div>
                <div class="header-session-btn__session-cycles">
                    {`${activeSession?.currentPomPeriod} / ${activeSession?.pomPeriods}`}
                </div>
            {/if}
        </button>
    {:else}
        <div class="user-stats">
            <div class="user-stats__stat" title={`${"4"} sessions finished today 👏.`}>
                <i class="fa-regular fa-hourglass-half"></i>
                4
            </div>
            <div class="user-stats__stat" title={`${"1h 3m"} of focus time today.`}>
                <i class="fa-brands fa-readme"></i>
                1h 3m
            </div>
            <div class="user-stats__stat" title={`${"1h 3m"} of break time today.`}>
                <i class="fa-solid fa-seedling"></i>
                1h 3m
            </div>
        </div>
    {/if}
   <!-- <button class="header__time" on:click={() => handleTimeBtnClicked()}>
        {#if isEvening}
            <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 36 36" fill="none" style={`${!isLightTheme ? "margin-right: -4px;" : ""}`}>
                <g filter="url(#filter0_d_2981_19936)">
                    <path 
                        d="M19.1896 12.5381C15.6431 12.5381 12.7715 14.9938 12.7715 18.0225C12.7715 21.0511 15.6431 23.5068 19.1896 23.5068C20.9298 23.5068 22.5063 22.9143 23.6636 21.9546C23.8072 21.8346 23.8445 21.6485 23.7526 21.4967C23.6607 21.3449 23.4626 21.2592 23.2645 21.2886C22.983 21.3302 22.6959 21.3523 22.4001 21.3523C19.6175 21.3523 17.3604 19.4229 17.3604 17.0431C17.3604 15.4321 18.3942 14.0292 19.9247 13.2897C20.0999 13.204 20.1889 13.0327 20.1459 12.8662C20.1028 12.6997 19.9362 12.5748 19.7352 12.5601C19.5543 12.5479 19.3734 12.5405 19.1896 12.5405V12.5381Z" 
                        fill={`${!isLightTheme ? "url(#paint0_linear_3051_27118)" : headerTimeColor}`}
                    />
                </g>
                <defs>
                    {#if !isLightTheme}
                        <filter id="filter0_d_2981_19936" x="0.771484" y="0.538086" width="41.0312" height="40.9688" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                            <feOffset/>
                            <feGaussianBlur stdDeviation="7.5"/>
                            <feComposite in2="hardAlpha" operator="out"/>
                            <feColorMatrix type="matrix" values="0 0 0 0 0.945098 0 0 0 0 0.8 0 0 0 0 0.643137 0 0 0 0.55 0"/>
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2981_19936"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2981_19936" result="shape"/>
                        </filter>
                        <linearGradient id="paint0_linear_3051_27118" x1="6.9292" y1="-2.89459" x2="6.9292" y2="9.06261" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#FAEEE3"/>
                            <stop offset="1" stop-color="#F2C59C"/>
                        </linearGradient>
                    {/if}
                </defs>
            </svg>
        {:else}
            {#if isLightTheme}
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none" style="margin: 3px 5px 0px 0px;">
                    <path d="M8.16841 11.1703C9.95724 11.1703 11.4074 9.72017 11.4074 7.93135C11.4074 6.14252 9.95724 4.69238 8.16841 4.69238C6.37958 4.69238 4.92944 6.14252 4.92944 7.93135C4.92944 9.72017 6.37958 11.1703 8.16841 11.1703Z" fill={headerTimeColor}/>
                    <path d="M8.16823 11.6983C6.09025 11.6983 4.39966 10.0077 4.39966 7.92971C4.39966 5.85172 6.09025 4.16113 8.16823 4.16113C10.2462 4.16113 11.9368 5.85172 11.9368 7.92971C11.9368 10.0077 10.2462 11.6983 8.16823 11.6983ZM8.16823 5.22029C6.6743 5.22029 5.45888 6.43571 5.45888 7.92964C5.45888 9.42357 6.6743 10.639 8.16823 10.639C9.66216 10.639 10.8776 9.42357 10.8776 7.92964C10.8776 6.43571 9.66216 5.22029 8.16823 5.22029Z" fill={headerTimeColor}/>
                    <path d="M8.16828 3.3798C7.8758 3.3798 7.63867 3.14268 7.63867 2.85019V1.12824C7.63867 0.835758 7.8758 0.598633 8.16828 0.598633C8.46077 0.598633 8.6979 0.835758 8.6979 1.12824V2.85019C8.6979 3.14268 8.46077 3.3798 8.16828 3.3798Z" fill={headerTimeColor}/>
                    <path d="M8.16828 15.2607C7.8758 15.2607 7.63867 15.0235 7.63867 14.731V13.0091C7.63867 12.7166 7.8758 12.4795 8.16828 12.4795C8.46077 12.4795 8.6979 12.7166 8.6979 13.0091V14.731C8.6979 15.0236 8.46077 15.2607 8.16828 15.2607Z" fill={headerTimeColor}/>
                    <path d="M14.9696 8.45864H13.2476C12.9551 8.45864 12.718 8.22151 12.718 7.92903C12.718 7.63654 12.9551 7.39941 13.2476 7.39941H14.9696C15.2621 7.39941 15.4992 7.63654 15.4992 7.92903C15.4992 8.22151 15.2621 8.45864 14.9696 8.45864Z" fill={headerTimeColor}/>
                    <path d="M3.08896 8.45864H1.36701C1.07453 8.45864 0.837402 8.22151 0.837402 7.92903C0.837402 7.63654 1.07453 7.39941 1.36701 7.39941H3.08896C3.38144 7.39941 3.61857 7.63654 3.61857 7.92903C3.61857 8.22151 3.38144 8.45864 3.08896 8.45864Z" fill={headerTimeColor}/>
                    <path d="M11.7603 4.86662C11.6248 4.86662 11.4892 4.81493 11.3858 4.71148C11.179 4.50465 11.179 4.1693 11.3858 3.96254L12.6034 2.74499C12.8103 2.53816 13.1456 2.53809 13.3524 2.74499C13.5592 2.95182 13.5592 3.28717 13.3524 3.49394L12.1348 4.71148C12.0314 4.81493 11.8958 4.86662 11.7603 4.86662Z" fill={headerTimeColor}/>
                    <path d="M3.35943 13.269C3.22392 13.269 3.08834 13.2173 2.98496 13.1139C2.77813 12.907 2.77813 12.5717 2.98496 12.3649L4.20257 11.1473C4.4094 10.9405 4.74475 10.9405 4.95151 11.1473C5.15834 11.3541 5.15834 11.6895 4.95151 11.8963L3.7339 13.1139C3.63052 13.2173 3.49501 13.269 3.35943 13.269Z" fill={headerTimeColor}/>
                    <path d="M12.9777 13.269C12.8422 13.269 12.7066 13.2173 12.6032 13.1139L11.3856 11.8963C11.1788 11.6894 11.1788 11.3541 11.3856 11.1473C11.5924 10.9405 11.9278 10.9405 12.1345 11.1473L13.3521 12.3649C13.559 12.5718 13.559 12.9071 13.3521 13.1139C13.2488 13.2173 13.1133 13.269 12.9777 13.269Z" fill={headerTimeColor}/>
                    <path d="M4.57704 4.86662C4.44153 4.86662 4.30595 4.81493 4.20257 4.71148L2.98496 3.49394C2.77813 3.2871 2.77813 2.95182 2.98496 2.74499C3.19179 2.53816 3.52714 2.53809 3.7339 2.74499L4.95151 3.96254C5.15834 4.16937 5.15834 4.50465 4.95151 4.71148C4.84813 4.81493 4.71262 4.86662 4.57704 4.86662Z" fill={headerTimeColor}/>
                </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none" style="margin-right: 7px;">
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
    </button> -->
</div>

<style global lang="scss">
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

            h2 {
                font-size: 1.45rem;
                font-weight: 300;
                color: var(--headerTimeColor);
            }

            &:active {
                transform: scale(0.99);
            }
        }

        &--light &__time h2 {
            font-weight: 400;
        }
        &--light .user-panel {
            &__user-details-user {
                font-weight: 600;
            }
            &__user-details-email {
                font-weight: 500;
            }
            &__user-details-session-stat {
                i {
                    color: rgba(var(--textColor1), 0.38);
                }
                span {
                    color: rgba(var(--textColor1), 0.35);
                    font-weight: 500;
                }
            }
        }
        &--light .user-stats {
            i {
                color: rgba(var(--textColor1), 0.6);
            }
            &__stat {
                font-weight: 500;
                color: rgba(var(--textColor1), 0.6);
            }
        }
        &--dark .user-panel .dropdown-menu {
            @include dropdown-menu-dark;
            i {
                color: rgba(var(--textColor1), 0.85);
            }
        }

        /* Styling for when Header Element Bg Color is Dark */
        &--light-text &-user-details p {
            color: rgba(var(--headerElementTextColor), 1) !important;
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
        &--light-text &-settings__settings-btn svg {
            color: rgba(var(--headerElementTextColor), 1) !important;
        }
    } 

    .user-panel {
        @include flex-container(center, _);
        position: relative;
        height: 37px;

        img {
            @include circle(32px);
            object-fit: cover;
            border: 1.5px solid white;
            margin-right: 12px;
            -webkit-user-drag: none;
        }
        &__user-details {
            height: 36px;
        }
        &__user-details-user {
            font-size: 1.3rem;
            color: rgba(var(--textColor1), 1);
        }
        &__user-details-subheading {
            margin-top: 3px;
            @include flex-container(center, _);
            color: rgba(var(--textColor1), 0.35);
        }
        &__user-details-session-stat {
            @include flex-container(center, _);

            i {
                color: rgba(var(--textColor1), 0.45);
                font-size: 0.94rem;
                padding: 0px;
            }
            span {
                color: rgba(var(--textColor1), 0.3);
                font-size: 1.1rem;
                font-weight: 300;
                margin: 0px 8px 0px 5px;
            }
        }
        &__user-details-email {
            font-size: 1.1rem;
            font-weight: 200;
        }
        .dropdown-container {
            @include pos-abs-bottom-left-corner(-120px, 0px);
            height: 120px;
            width: 135px;
            display: none;
        }
        .divider {
            background-color: rgba(var(--textColor1), 0.14);
            height: 0.5px;
            width: 90%;
            margin: 5px 0px 9px 5px;
        }
        .dropdown-menu {
            margin-top: 10px;
            width: 100%;

            &__option {
                width: 100%;
            }
            i, .fa-youtube {
                color: rgba(var(--textColor1), 1);
                font-size: 1rem;
            }
        }
    }
    
    /* Right Side */
    .user-stats {
        @include flex-container(center, _);
        &__stat {
            background-color: var(--midPanelAccentColor3);
            margin-right: 4px;
            padding: 8px 13px;
            border-radius: 15px;
            font-size: 1.1rem;
            color: rgba(var(--textColor1), 0.7);
            font-weight: 200;
            
            i {
                color: rgba(var(--textColor1), 1);
                font-size: 1rem;
                margin-right: 5px;
            }
            &:last-child {
                margin-right: 0px;
            }
        }
    }

    /* Active Session Btn */
    .header-session-btn {
        overflow: hidden;
        padding: 0px 12px 0px 15px;
        margin-right: 10px;
        color: rgba(var(--headerElementTextColor), 1);
        align-items: center;
        transition: 0.1s ease-in-out;

        &--light-mode {
            &:focus {
                filter: brightness(1.03);
            }
            &:hover {
                filter: brightness(1.02) !important;
            }
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

        &:focus {
            filter: brightness(1);
            box-shadow: 0px 0px 7px 0px rgba(255, 255, 255, 0.3);

            &:before {
                content: " ";
                position: absolute;
                z-index: -3;
                top: 0px;
                left: 0px;
                right: 0px;
                bottom: 0px;
                border-radius: 15px;
                border: 3px solid rgba(255, 255, 255, 0.2);
            }
        }
        &:hover {
            filter: brightness(1.07);
        }
        &:active {
            transform: scale(0.992);
            box-shadow: none;

            &:before {
                content: " " !important;
                border-width: 0px;
            }
        }
        
        span {
            font-weight: 500;
            margin-left: 4px;
            font-size: 1.2rem;
        }
        &__new-session-title {
            font-size: 1.2rem;
            margin-left: 2px;
        }
        &__new-session-icon {
            font-size: 1.5rem;
            font-weight: 400;
            margin: 0px 2px 0px 10px;
        }
        /* Active Session Component */
        &__session-tag {
            @include circle(17px);
            @include center;
            background-color: rgba(var(--fgColor1), 1);
            margin: 0px 8px 0px -5px;
            color: white;
        }
        &__session-name {
            font-size: 1.1rem;
        }
        &__session-todos {
            width: 30px;
            margin-right: -5px;
            @include center;
        }
        &__session-todos, &__session-cycles {
            color: rgba(var(--headerElementTextColor), 0.5);
            font-weight: 500;
            font-size: 0.95rem;
            margin-top: 2px;
        }
        &__session-mode {
            i {
                color: rgba(var(--headerElementTextColor), 0.85);
                margin: 2px -1px 0px 15px;
                font-size: 1.2rem;
            }
        }
        &__session-time {
            color: rgba(var(--headerElementTextColor), 0.85);
            font-size: 1.27rem;
            font-weight: 500;
            margin-left: 9px;
            width: 37px;
        }
    }
    /* Modals */
    .modal-bg__content {
        border-radius: 0px;
    }
</style>