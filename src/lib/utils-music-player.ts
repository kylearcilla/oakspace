const ANIMTION_SPEED = 12.55    // 12.55 px / sec
const ANIMATION_PAUSE = 2       // When text hits left / right edge

export const getAnimationDurationMs = (offsetWidth: number) => {
    const totalXOffsetDistance = offsetWidth * 2
    
    return (((totalXOffsetDistance / ANIMTION_SPEED) + (ANIMATION_PAUSE * 2)) * 1000) | 0
}
export const getAnimationKeyFrames = (durationMs: number, offSet: number) => {
    const keyFrames = [
        { transform: 'translateX(0)', offset: 0 },
        { transform: `translateX(-${offSet}px)`, offset: 0 },  // move to the right
        { transform: `translateX(-${offSet}px)`, offset: 0 },  // pause at the right
        { transform: 'translateX(0)', offset: 0 },             // move to the left
        { transform: 'translateX(0)', offset: 0 },             // pause at the left
    ]

    const pauseIntervalPercentage = ((ANIMATION_PAUSE * 1000) / durationMs) * 100 
    const activeIntervalPercentage = (100 - (pauseIntervalPercentage * 2)) / 2

    let count = 0
    keyFrames.map((kf: any, idx: number) => {
        kf.offset = (count / 100)
        count += idx % 2 === 0 ? activeIntervalPercentage : pauseIntervalPercentage
    })

    keyFrames[4].offset = 1
    return keyFrames
}
    
export const getSlidingTextAnimation = (textElement: HTMLElement): Animation | null => {
    const textContainerWidth = (textElement!.parentNode as HTMLElement).clientWidth

    let offSet = textElement.clientWidth - textContainerWidth
    offSet = offSet <= 0 ? 0 : offSet + 10

    if (offSet === 0) return null

    const durationMs = getAnimationDurationMs(offSet)
    const keyFrames = getAnimationKeyFrames(durationMs, offSet)

    const options = {
        delay: 3000,
        duration: durationMs,
        iterations: Infinity,
        easing: "linear"
    }
    return textElement.animate(keyFrames, options)
}