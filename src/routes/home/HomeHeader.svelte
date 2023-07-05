<script lang="ts">
	import quotes from "$lib/data-quotes";
	import { clickOutside } from "$lib/helper";
	import { colorThemeState } from "$lib/store";
	import { onMount } from "svelte";

    let quote: Quote | null = null
    let isQuoteModalOpen = false

    let isLightTheme = false
    let isHeaderElementTextLight = false
    colorThemeState.subscribe((theme) => {
        isLightTheme = !theme.isDarkTheme
        isHeaderElementTextLight = theme.isHeaderElementTextLight
    })
    
    const isQuoteOutDated = (quoteCreatedDate: Date) => {
        const currDate = new Date()
        return quoteCreatedDate.getFullYear() != currDate.getFullYear() || getWeekNumber(quoteCreatedDate) != getWeekNumber(currDate)
    }

    const getWeekNumber = (currentDate: Date) => {
        const startDate = new Date(currentDate.getFullYear(), 0, 1) // starting point of counting weeks
        const days = Math.floor(((currentDate as any) - (startDate as any)) / (24 * 60 * 60 * 1000)) // count difference in days (ms to days)
        
        const weekNumber = Math.ceil(days / 7) // days / 7
        return weekNumber
    }

    const getCurrentWeek = () => {
        const currentDate = new Date();
        const firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
        const lastDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7));

        return `${firstDayOfWeek.getMonth() + 1}/${firstDayOfWeek.getDate()} - ${lastDayOfWeek.getMonth() + 1}/${lastDayOfWeek.getDate()}`;
    }

    onMount(() => {
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

<div class={`header ${isHeaderElementTextLight ? "header--light-text" : ""}`}>
    <!-- Quote Modal -->
    <div class={`modal-bg ${isQuoteModalOpen ? "" : "modal-bg--hidden"}`}>
        <div 
            use:clickOutside on:click_outside={() => isQuoteModalOpen = false} 
            class="modal-bg__content"
        >
            <div class="quote-modal" style={`background-image: url(${quote?.bgImgSrc})`}>
                <div class={`quote-modal__content
                               ${quote?.artCredit === "" ? "quote-modal__content--no-art-credit" : ""}
                               ${quote?.quoteCredit === "" ? "quote-modal__content--no-quote-credit" : ""}
                `}>
                    <div class="quote-modal__content-container">
                        <span class="quote-modal__current-week">{getCurrentWeek()}</span>
                        <div class="pos-relative">
                            <h1>Quote of the Week</h1>
                            <!-- <i class="fa-solid fa-quote-right"></i> -->
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

    <div class={`header-user-details header__section ${isLightTheme ? "header-user-details--light-mode" : ""}`}>
        <img src="https://i.pinimg.com/564x/43/86/bb/4386bb3d57ddcb0c6ee1ba7a7f171689.jpg" alt="">
        <p>Hello, <span>Kyle Arcilla!</span></p>
    </div>
    <div class={`header-right-section ${isLightTheme ? "header-settings--light-mode" : ""}`}>
        <button on:click={() => {
                quote = quotes[Math.floor(Math.random() * quotes.length)]
                isQuoteModalOpen = true
            }} 
            class="header-settings__quote-btn" title="Quote of the Week"
        >
            <img class="img-bg" src="https://i.pinimg.com/564x/54/d2/44/54d2444a8f9797cedd2db13e076a258e.jpg" alt="quote-img">
            <div class="blur-bg blur-bg--blurred-bg"></div>
            <div class="content-bg">
                <i class="fa-solid fa-quote-left"></i>
                <!-- Weekly Quote -->
            </div>
        </button>
        <div class="header-settings header__section">
            <div class="header-settings__user-stats">
                <div class="header-settings__user-stats-metric">
                    <i class="fa-solid fa-hourglass-end"></i>
                    <span>3</span>
                </div>
                <div class="header-settings__user-stats-metric">
                    <i class="fa-regular fa-clock"></i>
                    <span>4h 40 m</span>
                </div>
                <div class="header-settings__user-stats-metric">
                    <i class="fa-solid fa-mug-hot"></i>
                    <span>1h 30 m</span>
                </div>
            </div>
            <div class="divider"></div>
            <div class="header-settings__time">
                <i class="fa-solid fa-moon"></i>
                <span class="header-settings__time-current-time">11:23</span>
                <span class="header-settings__time-part-day">Mon, Jun 5</span>
            </div>
            <button class="header-settings__settings-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" transform="translate(1 10)">
                        <circle cx="2" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                        <circle cx="8" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                        <circle cx="14" cy="0.8" r="1.2" stroke-width="0.7"></circle>
                    </g>
                </svg>
            </button>
        </div>
    </div>
</div>

<style lang="scss">
    .header {
        margin-top: 15px;
        width: 100%;
        @include flex-container(center, space-between);

        &__section {
            border-radius: 50px;
            height: 35px;
            background-color: var(--headerElementBgColor);
            border: var(--headerElementBorderVal);
            @include flex-container(center, _);
            padding: 11px 15px 11px 12px;
            box-shadow: var(--shadowVal2);
            white-space: nowrap;
        }

        /* Styling for when Header Element Bg Color is Dark */
        &--light-text &-user-details {
            p {
                color: rgba(var(--headerElementTextColor), 1) !important;
            }
        }
        &--light-text &-settings__quote-btn {
            i {
                color: rgba(var(--headerElementTextColor), 1) !important;
            }
        }
        &--light-text &-settings__user-stats {
            color: rgba(var(--headerElementTextColor), 0.75) !important;
        }
        &--light-text &-settings__time {
            color: rgba(var(--headerElementTextColor), 0.9) !important;
        }
        &--light-text &-settings__settings-btn {
            svg {
                color: rgba(var(--headerElementTextColor), 1) !important;
            }
        }
        &--light-text .divider {
            background-color: rgba(var(--headerElementTextColor), 0.7) !important;
        }
    }

    .header-user-details {
        max-width: 200px;
        overflow: hidden;
        margin-right: 20px;
        img {
            @include circle(20px);
        }
        p {
            color: rgba(var(--headerElementTextColor), 0.6);
            font-size: 1.2rem;;
            font-weight: 100;
            margin-left: 10px;
            @include elipses-overflow;
        }
        span {
            font-weight: 500;
            margin-left: 4px;
            font-size: 1.2rem;
        }

        &--light-mode p {
            font-weight: 300;
        }
        &--light-mode span {
            font-weight: 500;
        }

        @include mq-custom(max-width, 650px) {
            p, span {
                display: none;
            }
            padding: 10px 8px 10px 8px;
        }
    }

    .header-right-section {
        display: flex;
        align-items: center;
    }
    .header-settings {
        padding: 11px 11px 11px 19px;
        &__right-section {
        }
        /* Quote Button */
        &__quote-btn {
            position: relative;
            height: 31px;
            width: 31px;
            border-radius: 12px;
            margin-right: 5px;
            overflow: hidden;
            box-shadow: var(--shadowVal2);
            @include center;

            &:hover {
                transform: translateY(-1px);
            }
            &:active {
                transform: translateY(1px);
            }
            i {
                font-size: 1.1rem;
                color: rgba(var(--headerElementTextColor), 0.7);
            }
            .img-bg {
                border-radius: 12px;
                width: 95%;
                height: 95%;
            }
            .blur-bg {
                background: rgba(48, 48, 48, 0.4);
                border-radius: 12px;
                backdrop-filter: blur(11px);
                -webkit-backdrop-filter: blur(11px);
            }
            .content-bg {
                border-radius: 12px;
                @include center;
            }
        }
        /* User Stats */
        &__user-stats {
            display: flex;
            margin-right: -15px;
            color: rgba(var(--headerElementTextColor), 0.6);
            i {
                margin-right: 4px;
            }
            span {
                margin-right: 15px;
                font-weight: 200;
            }
        }
        .divider {
            width: 0.8px;
            height: 75%;
            margin: 0px 14px;
            background-color: rgba(var(--headerElementTextColor), 0.4);
        }
        /* Time / Day Section */
        .fa-moon {
            margin-right: 3px;
            color: #F2C59C;
            filter: drop-shadow(0px 0px 10px rgba(241, 204, 164, 0.81));
        }
        &__time-current-time {
            margin-right: 6px;
            font-weight: 200;
        }
        &__time {
            color: rgba(var(--headerElementTextColor), 0.5);
            font-size: 1.1rem;
        }
        /* Settings Button */
        &__settings-btn {
            margin-left: 10px;
            svg {
                color: rgba(var(--headerElementTextColor), 0.25);
            }
            &:active {
                transform: scale(0.95);
            }
        }


        /* Light Theme Styling */
        &--light-mode &__quote-btn {
            border: var(--headerElementBorderVal);
            i {
                color: rgba(var(--headerElementTextColor), 0.55);
            }
            .img-bg, .blur-bg {
                display: none;
            }
            .content-bg {
                background-color: var(--headerElementBgColor);
            }
        }
        &--light-mode &__time-current-time {
            font-weight: 300;
        }
        &--light-mode &__user-stats {
            span {
                font-weight: 500;
            }
        }
        &--light-mode &__time-part-day {
            font-weight: 700;
        }
    }
    .modal-bg__content {
        padding: 0px;
        border-radius: 0px;
    }
    .quote-modal {
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
                font-size: 1.2.3rem;
                margin: 2px 0px 8px 0px;
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

        &__current-week {
            font-size: 0.95rem;
            opacity: 0.5;
            font-weight: 200;
        }
        &__artist-credit {
            font-size: 0.85rem;
            @include pos-abs-top-right-corner(10px, 15px);
            color: rgb(197, 197, 197);
            font-weight: 600;
            opacity: 0.6;
        }
        &__quote-credit {
            font-size: 1.15rem;
            font-weight: 500;
            opacity: 0.9;
            color: rgb(179, 179, 179);
            @include pos-abs-bottom-right-corner(30px, 20px);
        }
    }
</style>