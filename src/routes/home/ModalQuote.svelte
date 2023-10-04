<script lang="ts">
	import { onMount } from "svelte";
    import quotes from "$lib/data-quotes";
	import { clickOutside } from "$lib/utils-general";
	import type { SessionModal } from "$lib/enums";

    export let toggleModal: (modal: SessionModal | null) => void

    let isQuoteModalOpen = false
    let quote: Quote | null = null

    const isQuoteOutDated = (quoteCreatedDate: Date, currDate: Date) => {
        return quoteCreatedDate.getFullYear() === currDate.getFullYear() && (getWeekNumber(quoteCreatedDate) === getWeekNumber(currDate));
    }
    const getWeekNumber = (currentDate: Date) => {
        const startDate = new Date(currentDate.getFullYear(), 0, 1)
        const days = Math.floor(((currentDate as any) - (startDate as any)) / (24 * 60 * 60 * 1000))
        
        const weekNumber = Math.ceil(days / 7)
        return weekNumber
    }


    onMount(() => {
        const quoteData = localStorage.getItem("quoteData")
        const isQuoteOutdated = !quoteData || isQuoteOutDated(new Date(JSON.parse(quoteData!).createdAt), new Date())

        if (!isQuoteOutdated) {
            quote = quotes[JSON.parse(quoteData).quoteId]
            return
        }
        
        const randomQuoteId = Math.floor(Math.random() * quotes.length)
        localStorage.setItem("quoteData", JSON.stringify({
            quoteId: randomQuoteId,
            createdAt: new Date()
        }))
        quote = quotes[Math.floor(Math.random() * quotes.length)]
    })
</script>
<div class="modal-bg">
    <div 
        use:clickOutside on:click_outside={() => toggleModal(null)} 
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

<style lang="scss">
    
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
</style>