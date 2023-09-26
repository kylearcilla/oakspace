import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }
enum MoodCategory { Serene, Lofi, Upbeat, Soundtracks, Acoustic, Classical, Zen, Summer }

/**
 * Get the platform code. Will be present if user has logged in.
 * 
 * @returns  0 (Apple Music), 1 (Spotify), 2 (Youtube), 4 (Soundcloud)
 */
export const getPlatformCode = () => {
    return localStorage.getItem("music-platform")
}

/**
 * Return the playlists & albums under a discover / mood category based on the current platform.
 * 
 * @param moodTitle   Current collection title
 * @param platformProp      
 * @returns 
 */
export const getClickedDiscoverCollectionCardList = (discoverCategory: MoodCategory, platformProp: string) => {
    switch (discoverCategory) {
        case MoodCategory.Serene:
            //@ts-ignore
            return sereneCollections[platformProp]
        case MoodCategory.Lofi:
            //@ts-ignore
            return lofiCollections[platformProp]
        case MoodCategory.Upbeat:
            //@ts-ignore
            return upbeatCollections[platformProp]
        case MoodCategory.Soundtracks:
            //@ts-ignore
            return soundtrackCollections[platformProp]
        case MoodCategory.Acoustic:
            //@ts-ignore
            return acousticCollections[platformProp]
        case MoodCategory.Classical:
            //@ts-ignore
            return classicalCollections[platformProp]
        case MoodCategory.Zen:
            //@ts-ignore
            return zenCollections[platformProp]
        case MoodCategory.Summer:
            //@ts-ignore
            return summerCollections[platformProp]
    }
}

/**
 * Get the music current platform as a string
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Currnet music platform
 */
export const getCurrMusicPlatformName = (platFormIdx: number): string => {
    const platform = MusicPlatform[platFormIdx]
    return platform === "AppleMusic" ? "Apple Music" : platform
}

/**
 * Based on current platform being used, get the proper platform 
 * ...property of the discover collection object item.
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Property name of current platform
 */
export const getPlatformNameForDiscoverObj = (platFormIdx: MusicPlatform): MusicPlatformPropNames => {
    let platform = MusicPlatform[platFormIdx].toLowerCase()
    platform = "applemusic" ? "appleMusic" : platform

    return platform as MusicPlatformPropNames
}