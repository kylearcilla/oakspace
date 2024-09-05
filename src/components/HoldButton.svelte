<script lang="ts">
	import { inlineStyling } from "$lib/utils-general";

    export let text: string
    export let disabled = false
    export let onOk: FunctionParam
    export let styling: StylingOptions | undefined = undefined
    export let options: {
        lengthMs?: number,
        colorCover?: string
    } | undefined = undefined

    const lengthMs = options?.lengthMs ?? 1500
    const coverColor = options?.colorCover ?? "#FFFFFF"
    const coverTextColor = options?.colorCover ?? "rgb(var(--textColor2))"

    let isHolding = false

    function onConfirmPointerDown(pe: PointerEvent) {
        if (pe.button === 2) return
        isHolding = true
    }
    function onConfirmPointerUp(pe: PointerEvent) {
        if (pe.button === 2) return
        isHolding = false
    }
    function onHoldEnd() {
        isHolding = false
        onOk()
    }
    function onPointerUp() {
        if (isHolding) {
            isHolding = false
        }
    }
    function onMouseLeave() {
        if (isHolding) {
            isHolding = false
        }
    }
</script>

<button
    {disabled}
    class="hold-btn"
    class:hold-btn--holding={isHolding}
    style={inlineStyling(styling)}
    style:--cover-color={coverColor}
    style:--cover-txt-color={coverTextColor}
    style:--anim-length={`${lengthMs}ms`}
    on:pointerup={onPointerUp} 
    on:mouseleave={onMouseLeave}
    on:pointerdown={onConfirmPointerDown}
    on:pointerup={onConfirmPointerUp}
    on:animationend={onHoldEnd}
>
    <div class="hold-btn__cover">
        {text}
    </div>
    {text}
</button>

<style lang="scss">
    .hold-btn {
        @include center;
        @include text-style(0.75, 500, 1rem);
        position: relative;
        background: rgba(var(--textColor1), 0.02);
        overflow: hidden;

        &:hover {
            background: rgba(var(--textColor1), 0.055);
        }
        &:active {
            transform: scale(0.97);
        }
        &--holding &__cover {
            animation: hold-confirm var(--anim-length) forwards;
        }

        &__cover {
            width: 100%;
            height: 100%;
            text-align: center;
            background-color: var(--cover-color);
            color: rgb(var(--textColor2));
            @include center;
            @include abs-center;

            -webkit-mask-image: linear-gradient(to right, rgb(var(--textColor1)) 0%, rgb(var(--textColor1)) 50%, transparent 50%, transparent 100%);
                    mask-image: linear-gradient(to right, rgb(var(--textColor1)) 0%, rgb(var(--textColor1)) 50%, transparent 50%, transparent 100%);

            -webkit-mask-size: 200% 100%;
                    mask-size: 200% 100%;

            -webkit-mask-position: right;
                    mask-position: right;
        }
    }

    @keyframes hold-confirm {
        100% {
            -webkit-mask-position: left;
                    mask-position: left;
        }
    }
</style>