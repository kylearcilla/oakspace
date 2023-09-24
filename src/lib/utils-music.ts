import { 
    sereneCollections, acousticCollections, classicalCollections, 
    lofiCollections, soundtrackCollections, summerCollections, 
    upbeatCollections, zenCollections  
} from "$lib/data-music-collections"

enum MusicPlatform { AppleMusic, Spotify, Youtube, Soundcloud }


export const getClickedDiscoverCollectionCardList = (collectionTitle: string, platformProp: string) => {
    switch (collectionTitle) {
        case "Serene":
            //@ts-ignore
            return sereneCollections[platformProp]
        case "Lofi":
            //@ts-ignore
            return lofiCollections[platformProp]
        case "Upbeat":
            //@ts-ignore
            return upbeatCollections[platformProp]
        case "Soundtracks":
            //@ts-ignore
            return soundtrackCollections[platformProp]
        case "Acoustic":
            //@ts-ignore
            return acousticCollections[platformProp]
        case "Classical":
            //@ts-ignore
            return classicalCollections[platformProp]
        case "Zen":
            //@ts-ignore
            return zenCollections[platformProp]
        case "Summer":
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
    console.log(platform === "AppleMusic" ? "Apple Music" : platform)
    return platform === "AppleMusic" ? "Apple Music" : platform
}

/**
 * Based on current platform being used, get the proper platform 
 * ...property of the discover collection object item 
 * 
 * @param platFormIdx  Enum platform index
 * @returns            Property name of current platform
 */
export const getPlatformNameForDiscoverObj = (platFormIdx: number): string => {
    const platform = MusicPlatform[platFormIdx].toLowerCase()
    return platform === "applemusic" ? "appleMusic" : platform
}