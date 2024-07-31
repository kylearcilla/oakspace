import { MusicMediaType } from "./enums"

const ANIMTION_SPEED = 12.55    // 12.55 px / sec
const ANIMATION_PAUSE = 2       // When text hits left / right edge
const ANIMATION_DELAY = 3000
const TEXT_CONTAINER_OFFSET_MIN_CUTOFF = 11  // diff betwen text width and container

export const INPUT_RANGE_FG_COLOR = "rgba(255, 255, 255, 0.9)"
export const INPUT_RANGE_BG_COLOR = "rgba(255, 255, 255, 0.1)"

/**
 * Updates the progrress bar based on current value.
 * @param trackPlaybackBar   Player progress bar
 */
export const trackProgressHandler = (trackPlaybackBar: HTMLInputElement) => {
    const value = trackPlaybackBar.value
    trackPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, ${INPUT_RANGE_BG_COLOR} ${value}%, ${INPUT_RANGE_BG_COLOR} 100%)`
}

/**
 * Updates the volume bar based on current value.
 * @param trackPlaybackBar   Player progress bar
 */
export const volumeHandler = (musicPlaybackBar: HTMLInputElement) => {
    const value = musicPlaybackBar.value
    musicPlaybackBar.style.background = `linear-gradient(to right, white 0%, white ${value}%, ${INPUT_RANGE_BG_COLOR} ${value}%, ${INPUT_RANGE_BG_COLOR} 100%)`
}

/**
 * Calculates how long a sliding animation will take. 
 * Changes depending on the length of track title / artist name.
 * 
 * @param offsetWidth    Width difference between a text element and its parent container.
 * @returns              
 */
export const getAnimationDurationMs = (offsetWidth: number) => {
    const totalXOffsetDistance = offsetWidth * 2
    
    return (((totalXOffsetDistance / ANIMTION_SPEED) + (ANIMATION_PAUSE * 2)) * 1000) | 0
}

/**
 * Generates keyframes for sliding text animation.
 * There will always be ANIMATION_PAUSE pause when text hits the right & left boundary.
 *
 * @param   durationMs    The duration of the animation in milliseconds.
 * @param   offsetWidth   Width difference between a text element and its parent container.
 * @returns               An array of keyframes with transform and offset properties.
 */
export const getAnimationKeyFrames = (durationMs: number, offsetWidth: number) => {
    const keyFrames = [
        { transform: 'translateX(0)', offset: 0 },
        { transform: `translateX(-${offsetWidth}px)`, offset: 0 },  // move to the left
        { transform: `translateX(-${offsetWidth}px)`, offset: 0 },  // pause at the left
        { transform: 'translateX(0)', offset: 0 },                  // move to the right
        { transform: 'translateX(0)', offset: 0 },                  // pause at the right
    ]

    const pauseIntervalPercentage = ((ANIMATION_PAUSE * 1000) / durationMs) * 100 
    const activeIntervalPercentage = (100 - (pauseIntervalPercentage * 2)) / 2

    let count = 0
    keyFrames.map((kf: { transform: string, offset: number }, idx: number) => {
        kf.offset = (count / 100)
        count += idx % 2 === 0 ? activeIntervalPercentage : pauseIntervalPercentage
    })

    keyFrames[4].offset = 1
    return keyFrames
}
    
/**
 * Used to do a sliding animation to show the entire track title / artist when player is not wide enough to show them.
 * Dynamically calculates animation length & keyframes to keep animation consistent for any title text length.
 * Animation object is returned for it be canceled later when new animation is needed.
 * 
 * @param textElement   Text element where track title / artist will be stored
 * @returns             An animation object that will be attached to the text elements.
 */
export const getSlidingTextAnimation = (textElement: HTMLElement): Animation | null => {
    const textContainerWidth = (textElement!.parentNode as HTMLElement).clientWidth

    let offSet = textElement.clientWidth - textContainerWidth
    offSet = offSet <= 0 ? 0 : offSet

    if (offSet === 0) return null

    const durationMs = getAnimationDurationMs(offSet)
    const keyFrames = getAnimationKeyFrames(durationMs, offSet)

    const options = {
        delay: ANIMATION_DELAY,
        duration: durationMs,
        iterations: offSet <= TEXT_CONTAINER_OFFSET_MIN_CUTOFF ? 1 : Infinity,   // do not keep moving text if only a litle part is cut off
        easing: "linear"
    }
    return textElement.animate(keyFrames, options)
}

/**
 * Given current media duration and value of input get the corresponding position in seconds.
 * @param percValue   Value of input
 * @param durationMs  Duration  of current media
 * @returns           Seek position in seconds
 */
export function getSeekPositionSecs(percValue: number, durationMs: number) {
    return (durationMs * (percValue / 100)) / 1000
}