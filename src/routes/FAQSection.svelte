<script lang="ts">
    import { FAQS } from '$lib/landing-page.data'

    let openFaqIdx = -1

    function toggleOpen(idx: number) {
        openFaqIdx = openFaqIdx === idx ? -1 : idx
    }
    function onItemClicked(e: Event, idx: number) {
        const target = e.target as HTMLElement
        const iconBtn = target.closest('.accordion__icon')

        if (!iconBtn) {
            toggleOpen(idx)
        }
    }
</script>

<div>
    <div class="faq">
        <div class="faq__content">
            <h3 class="faq__title">
                Frequently Asked Questions
            </h3>
            <div class="accordion">
                {#each FAQS as faq, idx}
                    <div 
                        class="accordion__item"
                        class:accordion__item--open={openFaqIdx === idx}
                    >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="accordion__item-header"
                            on:click={(e) => onItemClicked(e, idx)}
                        >
                            <button class="accordion__icon" on:click={() => toggleOpen(idx)}>
                                <div 
                                    class="plus-horizontal" 
                                    class:open={openFaqIdx === idx}
                                >
                                </div>
                                <div 
                                    class="plus-vertical" 
                                    class:open={openFaqIdx === idx}
                                >
                                </div>
                            </button>
                            <h4>{faq.q}</h4>
                        </div>
                        <div 
                            class="accordion__item-content" 
                            class:accordion__item-content--open={openFaqIdx === idx}
                        >
                            <div style:min-height="0px">
                                <p class="accordion__item-text">
                                    {@html faq.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .faq {
        max-width: 900px;
        margin: 0px auto;
        padding: 0px 1.5rem;

        h3 {
            @include text-style(0.8, 500, 3rem, 'Gambarino');
            line-height: 1.2;
            margin: 0px auto 60px;
            text-align: center;
        }
        &__content {
            padding: 6.5rem 0px 5.75rem;
        }
    }
    .accordion {
        width: 100%;

        &__item {
            width: 100%;
            padding: 0px 0px 5px 0px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            gap: 10px;
            margin: 0px auto 15px;
            position: relative;
            &--open {
                padding-bottom: 20px;
            }
        }
        &__item:last-child {
            border-bottom: none;
        }
        &__item::after {
            content: '';
            background-color: rgba(black, 0.15);
            height: 0.5px; 
            width: calc(100% - 37px);
            position: absolute;
            bottom: 0px;
            left: 37px;
        }
        &__item-header {
            width: 100%;
            display: flex;
            cursor: pointer;
            user-select: none;
            h4 {
                @include text-style(0.8, 400, 1rem, 'system');
            }
        }
        &__icon {
            width: 20px;
            height: 20px;
            margin-right: 15px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .plus-horizontal, .plus-vertical {
            position: absolute;
            background-color: #82accb;
            transition: transform 0.3s ease;
            border-radius: 10px;
        }
        .plus-horizontal {
            width: 11px;
            height: 2px;
            transform: none;

            &.open {
                transform: rotateZ(180deg) translateZ(0px);
            }
        }
        .plus-vertical {
            width: 2px;
            height: 11px;
            transform: scale(1) rotateZ(0deg) translateZ(0px);

            &.open {
                transform: scale(0) rotateZ(80deg) translateZ(0px);
            }
        }
        &__item-content {
            @include text-style(0.8, 300, 0.85rem, 'system');
            width: 100%;
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.35s cubic-bezier(.24,.26,0,1);
            padding-left: 35px;
            overflow: hidden;
            
            &--open {
                grid-template-rows: 1fr;
            }
        }
        &__item-text {
            opacity: 0;
            overflow: hidden;
            max-width: 800px;
            transition: opacity 0.2s ease-in-out;
            line-height: 1.5;
            @include text-style(1, 400, 0.85rem, 'system');
        }
        &__item-content--open &__item-text {
            transition-duration: 0.3s;
            opacity: 0.9;
        }
    }
</style>