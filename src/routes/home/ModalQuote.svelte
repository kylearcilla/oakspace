<script lang="ts">
	import { onMount } from "svelte"
    import quotes from "$lib/data-quotes"
	import { ModalType } from "$lib/enums"
	import { closeModal } from "$lib/utils-home"
	import { getWeekNumber } from "$lib/utils-date"
	import Modal from "../../components/Modal.svelte"

    let quote: Quote | null = null

    const isQuoteOutDated = (quoteCreatedDate: Date, currDate: Date) => {
        return quoteCreatedDate.getFullYear() === currDate.getFullYear() && (getWeekNumber(quoteCreatedDate) === getWeekNumber(currDate));
    }

    onMount(() => {
        // const quoteData = localStorage.getItem("quoteData")
        // const isQuoteOutdated = !quoteData || isQuoteOutDated(new Date(JSON.parse(quoteData!).createdAt), new Date())

        // if (!isQuoteOutdated) {
        //     quote = quotes[JSON.parse(quoteData).quoteId]
        //     return
        // }
        
        // const randomQuoteId = Math.floor(Math.random() * quotes.length)
        // localStorage.setItem("quoteData", JSON.stringify({
        //     quoteId: randomQuoteId,
        //     createdAt: new Date()
        // }))
        quote = quotes[Math.floor(Math.random() * quotes.length)]
        // quote = quotes[quotes.length - 1]
    })
</script>

<Modal 
    options={{ borderRadius: "0px" }} 
    onClickOutSide={() => closeModal(ModalType.Quote)}
>
    <div 
        class="quote-modal" 
        style={`background-image: url(${quote?.bgImgSrc})`}
    >
        <div class="quote-modal__content">
            <div></div>
            <div class="quote-modal__content-container">
                <div class="quote-modal__content-top">
                    <!-- <h1 class="quote-modal__title">Weekly Wisdom</h1> -->
                    <div class="flx">
                        <span class="quote-modal__quote quote-modal__quote--left-quotation">"</span>
                        <p class="quote-modal__quote">
                            {@html quote?.text}"
                        </p>
                    </div>
                </div>
                <div class="quote-modal__content-bottom">
                    <div class="quote-modal__content-bottom-left">
                        <div class="quote-modal__likes">
                            <button>
                                <i class="fa-regular fa-heart"></i>
                            </button>
                            <span>
                                1473
                            </span>
                        </div>
                        <div class="divider divider--vertical"></div>
                        <div class="quote-modal__artist-credit" >
                            {@html (quote?.artCredit || quote?.quoteCredit)}
                        </div>
                    </div>
                    {#if quote?.artCredit}
                        <span class="quote-modal__quote-credit">
                            - {@html quote?.quoteCredit}
                        </span>
                    {/if}
                </div>
            </div>
        </div>
    </div>            
</Modal>

<style global lang="scss">
    
    .quote-modal {
        padding: 0px;
        width: 75vw;
        height: 500px;
        position: relative;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        max-width: 650px;
        min-width: 330px;

        &__content {
            height: 100%;
            width: 100%;
            background-color: rgba(0, 0, 0, 0.84); 
            color: white;
            @include flex(_, flex-end);
            flex-direction: column;
            padding: 18px 19px;

            &-top {
                margin-bottom: 15px;
            }
            &-bottom {
                @include flex(center, _);
            }
            &-bottom-left {
                @include flex(center, _);
                flex: 1;
                min-width: 0;
            }
            &-bottom-left .divider {
                height: 8.5px;
                width: 1px;
                margin: 0px 9px;
                background-color: rgba(179, 179, 179, 0.3);
            }
            &-context {
                @include flex(center, _);
            }
        }
        &__title {
            font-size: 1.5rem;
            margin: 2px 0px 7px 0px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9)
        }
        &__quote {
            font-size: 1.4rem;
            font-weight: 400;
            opacity: 0.85;
            color: rgba(215, 215, 215, 0.92);
            margin-bottom: 0px;
        }
        &__likes {
            white-space: nowrap;
            font-family: "DM Sans";
            button {
                &:active {
                    transform: scale(0.8);
                }
            }
            button i {
                color: rgba(241, 241, 241, 0.3);
                margin-right: 4px;
                font-size: 1.14rem;
            }
            span {
                font-size: 1.3rem;
                font-weight: 500;
                color: rgba(179, 179, 179, 0.5);
            }
        }
        &__artist-credit {
            font-size: 1.3rem;
            font-weight: 500;
            color: rgba(179, 179, 179, 0.5);
            @include elipses-overflow;
            
            i {
                color: rgba(179, 179, 179, 0.6);
                margin-right: 3px;
            }
            span {
                @include elipses-overflow;
            }
        }
        &__quote-credit {
            font-size: 1.3rem;
            font-weight: 500;
            color: rgba(179, 179, 179, 0.5);
            min-width: 0;
            float: right;
            white-space: nowrap;
            margin-left: 12px;

            i {
                color: rgba(244, 244, 244, 0.4);
                margin-left: 3px;
            }
        }
    }
</style>