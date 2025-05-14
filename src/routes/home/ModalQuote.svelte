<script lang="ts">
    import { ModalType } from "$lib/enums"
	import { themeState } from "$lib/store"
	import { QUOTE_KEY } from "$lib/constants"
	import { closeModal } from "$lib/utils-home"

	import Modal from "$components/Modal.svelte"
	import SkeletonElem from "$components/SkeletonElem.svelte"

    export let _quote: Promise<Quote>
        
    const SKELETON_HEIGHT = "18px"

    let loading = true
    let quote: Quote | null = null
    let error = false
    
    $: light = !$themeState.isDarkTheme

    _quote
        .then(q => {
            quote = q
        })
        .catch(error => {
            error = true
        })
        .finally(() => {
            loading = false
        })

    async function toggleLike() {
        let { liked, likes } = quote!

        liked = !liked
        likes = liked ? likes + 1 : likes - 1

        quote!.liked = liked
        quote!.likes = likes

        const res = await fetch(`/home/quotes/likes?quoteId=${quote!.id}`, {
            method: "POST",
            body: JSON.stringify({ quoteId: quote!.id })
        })
        if (!res.ok) {
            error = true
        }

        localStorage.setItem(QUOTE_KEY, JSON.stringify(quote!))
    }
</script>

<Modal 
    options={{ borderRadius: "0px", scaleUp: true }} 
    onClickOutSide={() => closeModal(ModalType.Quote)}
>
    {@const { artCredit, quoteCredit, text, portrait, bgImgSrc, dark, liked, likes } = quote || {}}
    <div 
        class="quote-modal" 
        class:quote-modal--portrait={portrait}
        class:quote-modal--liked={liked}
        class:quote-modal--loading={loading}
        style={`background-image: url(${bgImgSrc})`}
        style:--opacity={dark ? 0.7 : 0.825}
    >
        <div class="quote-modal__content">
            <div class="quote-modal__content-container">
                <div class="quote-modal__content-top">
                    {#if loading}
                        <SkeletonElem 
                            {light} 
                            width="400px" 
                            height={SKELETON_HEIGHT}
                            margin="0px 0px 4px 0px"
                        />
                        <SkeletonElem 
                            {light} 
                            width="200px" 
                            height={SKELETON_HEIGHT}
                        />
                    {:else}
                        <div class="flx">
                            <span class="quote-modal__quote">"</span>
                            <p class="quote-modal__quote">
                                {@html text}"
                            </p>
                        </div>
                    {/if}
                </div>
                <div class="quote-modal__content-bottom">
                    <div class="quote-modal__content-bottom-left">
                        <div class="quote-modal__likes">
                            <button 
                                title="Hell yeah"
                                disabled={loading}
                                on:click={toggleLike}
                            >
                                {#if liked}
                                    <i class="fa-solid fa-heart"></i>
                                {:else}
                                    <i class="fa-regular fa-heart"></i>
                                {/if}
                            </button>
                            <span>
                                {loading ? "--" : likes}
                            </span>
                        </div>
                        <div class="divider divider--vertical"></div>
                        {#if loading}
                            <SkeletonElem 
                                {light} 
                                width="100px" 
                                height={SKELETON_HEIGHT}
                                margin="0px 0px 0px 0px"
                            />
                        {:else}
                            <div class="quote-modal__artist-credit">
                                {@html (artCredit || quoteCredit)}
                            </div>
                        {/if}
                    </div>
                    {#if quoteCredit && artCredit && !loading}
                        <span class="quote-modal__quote-credit">
                            - {@html quoteCredit}
                        </span>
                    {:else}
                        <SkeletonElem 
                            {light} 
                            width="100px" 
                            height={SKELETON_HEIGHT}
                            margin="0px 0px 0px 0px"
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
</Modal>

<style global lang="scss">
    .quote-modal {
        padding: 0px;
        width: 79vw;
        height: 550px;
        position: relative;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        max-width: 700px;
        min-width: 340px;

        --heart-fill: #c85959;

        &--portrait {
            height: 650px;
            width: 550px;
        }
        &--loading {
            background-image: none !important;
        }

        &__content {
            height: 100%;
            width: 100%;
            background-color: rgba(0, 0, 0, var(--opacity)); 
            color: white;
            @include flex(_, flex-end);
            flex-direction: column;
            padding: 18px 19px 17px 19px;

            &-top {
                margin-bottom: 15px;
            }
            &-bottom {
                @include flex(center);
            }
            &-bottom-left {
                @include flex(center);
                flex: 1;
                min-width: 0;
                margin-right: 10px;
            }
            &-bottom-left .divider {
                height: 11px;
                width: 1.5px;
                margin: 0px 9px 0px 10px;
                background-color: rgba(179, 179, 179, 0.3);
            }
        }
        &__quote {
            font-size: 1.45rem;
            font-weight: 400;
            opacity: 0.85;
            color: rgba(215, 215, 215, 0.92);
            margin-bottom: 0px;
        }
        &__likes {
            white-space: nowrap;
            button:active {
                transform: scale(0.9);
            }
            button i {
                color: rgba(241, 241, 241, 0.3);
                margin-right: 4px;
                font-size: 1.3rem;
            }
            span {
                font-size: 1.3rem;
                font-weight: 500;
                color: rgba(179, 179, 179, 0.5);
            }
            .fa-solid.fa-heart {
                color: var(--heart-fill);
            }
        }
        &__artist-credit {
            font-size: 1.4rem;
            font-weight: 400;
            color: rgba(179, 179, 179, 0.5);
            @include elipses-overflow;

            a, span {
                color: rgba(179, 179, 179, 0.5);
                text-decoration: none;
            }
            i {
                color: rgba(179, 179, 179, 0.6);
                margin-right: 3px;
            }
        }
        &__quote-credit {
            font-size: 1.4rem;
            font-weight: 400;
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