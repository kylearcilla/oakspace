import { MusicMediaType, MusicMoodCategory } from "./enums"

import sereneImg   from '$lib/images/collection-serene.png'
import sereneImgBg from '$lib/images/collection-serene-bg.png'

import upbeatImg   from '$lib/images/collection-upbeat.png'
import upbeatImgBg from '$lib/images/collection-upbeat-bg.png'

import soundtracksImg   from '$lib/images/collection-soundtracks.png'
import soundtracksImgBg from '$lib/images/collection-soundtracks-bg.png'

import acousticImg   from '$lib/images/collection-acoustic.png'
import acousticImgBg from '$lib/images/collection-acoustic-bg.png'

import zenImg   from '$lib/images/collection-zen.png'
import zenImgBg from '$lib/images/collection-zen-bg.png'

import podcastsImg  from '$lib/images/collection-pod.png'
import podcastsImgBg from '$lib/images/collection-pod-bg.png'


export const musicCategories: MusicCollectionCategory[] = [
    {
        moodType: MusicMoodCategory.Serene,
        artworkSrc: sereneImg,
        artworkBlurredSrc: sereneImgBg,
        artistCredit: "Art by KangHee Kim",
        description: "Music for maximum chill & serenity."
    },
    {
        moodType: MusicMoodCategory.Upbeat,
        artworkSrc: upbeatImg,
        artworkBlurredSrc: upbeatImgBg,
        artistCredit: "Art by David Stenbeck",
        description: "Music to spark your energy and uplift the soul.",
    },
    {
        moodType: MusicMoodCategory.Soundtracks,
        artworkSrc: soundtracksImg,
        artworkBlurredSrc: soundtracksImgBg,
        artistCredit: "Art by Studio Ghibli",
        description: "Iconic sountracks for cinematic experiences.",
    },
    {
        moodType: MusicMoodCategory.Acoustic,
        artworkSrc: acousticImg,
        artworkBlurredSrc: acousticImgBg,
        artistCredit: "",
        description: "Intimate, soft, and stripped-down arrangements for the soul.",
    },
    {
        moodType: MusicMoodCategory.Zen,
        artworkSrc: zenImg,
        artworkBlurredSrc: zenImgBg,
        artistCredit: "",
        description: "Soothing & ambient sounds for tranquility and inner piece.",
    },
    {
        moodType: MusicMoodCategory.Podcasts,
        artworkSrc: podcastsImg,
        artworkBlurredSrc: podcastsImgBg,
        artistCredit: "Art by Ana Montiel",
        description: "Engaging stores and thought-provoking conversations.",
    },
]

export const sereneCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Lofi Chill",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/a7/4a/fa/a74afa098622eee4d7214ae1cf3d040e.jpg",
            genre: "Lofi",
            length: 65,
            id: "PLTlW3nrfe71TabdQItclMVN0x2H8Rq6Z1",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71TabdQItclMVN0x2H8Rq6Z1",
            type: MusicMediaType.Playlist,
            description: "Hazy, easy sounds for lean-back listening."
        },
        {
            name: "Serene Ambience",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/dd/90/f9/dd90f975c99fb86769b8f0bfbf487028.jpg",
            genre: "Ambient",
            length: 59,
            id: "PLTlW3nrfe71QpwBh8TyZHVzuvad68XYg4",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71QpwBh8TyZHVzuvad68XYg4",
            type: MusicMediaType.Playlist,
            description: "Relaxing journeys in ambient music."
        },
        {
            name: "Chilled Beats",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/736x/bc/b6/31/bcb631be69c6b2a4046032a30e5c63b2.jpg",
            genre: "Lofi",
            length: 70,
            id: "PLTlW3nrfe71Q1zHvXoeNJYTQQYmce466t",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71Q1zHvXoeNJYTQQYmce466t",
            type: MusicMediaType.Playlist,
            description: "Chillest instrumental beats from around the world."
        },
        {
            name: "Classical Chill",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/1e/b1/d2/1eb1d2023eb777b2a45119779b5c255d.jpg",
                artist: "Jane Hunt"
            },
            genre: "Classical",
            length: 70,
            id: "PLTlW3nrfe71Q88-91GFFmHxyJnNC5boub",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71Q88-91GFFmHxyJnNC5boub",
            type: MusicMediaType.Playlist,
            description: "Wall-to-wall favorites, from glorious piano music to symphonic and operatic greats."
        },
        {
            name: "Summertime Vibes",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/736x/da/5b/2c/da5b2c303935b0f2310b063b52610a22.jpg",
            genre: "Multi-Genre",
            length: 40,
            id: "PLTlW3nrfe71R79NHsTg5krL0xgmq4jYZo",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71R79NHsTg5krL0xgmq4jYZo",
            type: MusicMediaType.Playlist,
            description: "Blissed-out beats to leave you floating on air."
        },
        {
            name: "Alternative / Indie",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/bf/8d/31/bf8d31e1ccc8998613eca32687c7efb5.jpg",
            genre: "Alternative / Indie",
            length: 90,
            id: "PLTlW3nrfe71TntFrm1qK_VH-jx58Gbuam",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71TntFrm1qK_VH-jx58Gbuam",
            type: MusicMediaType.Playlist,
            description: "The best of the from the  altenative & indie genres."
        },
        {
            name: "Gaming Chill",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.ytimg.com/vi/jIySUiyykvE/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCTnp2XIBhhRZHNMBROooZMZ_HpYg",
                artist: "@eebecca_studio"
            },
            genre: "Lofi",
            length: 20,
            id: "PLTlW3nrfe71R4__x5h3omOh8FXf1nf8Up",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71R4__x5h3omOh8FXf1nf8Up",
            type: MusicMediaType.Playlist,
            description: "Relaxed vibes for the gamers out there."
        },
        {
            name: "The Best of Soul",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/06/cf/8b/06cf8b45fdf9375b67c31f64b69a9e50.jpg",
            genre: "Soul / Neo-Soul",
            length: 59,
            id: "PLTlW3nrfe71RZQR90Gv67YoZiH5pGpsU0",
            url: "https://music.apple.com/ca/playlist/piano-chill/PLTlW3nrfe71RZQR90Gv67YoZiH5pGpsU0",
            type: MusicMediaType.Playlist,
            description: "Erykah Badu. D'Angelo. Marvin Gaye. And More."
        },
    ]
}

export const upbeatCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Pop Hits",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/0f/2e/00/0f2e00d45e573efb3a10eac24a9cf8cc.jpg ",
            genre: "Pop",
            length: 50,
            id: "PLTlW3nrfe71ROiUxZGKaFmdaeewir1eRz",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71ROiUxZGKaFmdaeewir1eRz",
            type: MusicMediaType.Playlist,
            description: "The hottest hits right now!"
        },
        {
            name: "Afrobeats",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/fe/f8/5e/fef85e285803ca9b23441399441f11c3.jpg",
            genre: "Afrobeats",
            length: 100,
            id: "PLTlW3nrfe71Qw1eaWl5A_vxp3ku7f7w6z",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71Qw1eaWl5A_vxp3ku7f7w6z",
            type: MusicMediaType.Playlist,
            description: "The essential, freeing sounds of the African diaspora. The classic and latest hits."
        },
        {
            name: "Chill House",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/3c/ea/37/3cea37fbd3c688e554a9b64998438cb9.jpg",
            genre: "House",
            length: 83,
            id: "PLTlW3nrfe71QLqO6MDsoQkHoFJPINF39E",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QLqO6MDsoQkHoFJPINF39E",
            type: MusicMediaType.Playlist,
            description: "Weightless breakbeats, blissed-out deep house, and more laidback grooves."
        },
        {
            name: "Best of R&B",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/736x/09/9d/e4/099de4c65aeaf1513b782af91ad031cf.jpg",
            genre: "R&B",
            length: 63,
            id: "PLTlW3nrfe71RdBQat1wNhRGJ6JwMxVAh4",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RdBQat1wNhRGJ6JwMxVAh4",
            type: MusicMediaType.Playlist,
            description: "The very best that R&B has to offer. From Aaliyah to Mariah Carey to SZA."
        },
        {
            name: "Pop Grooves",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/a6/c0/4c/a6c04c217457fdb28578011295215123.jpg",
            genre: "Pop",
            length: 40,
            id: "PLTlW3nrfe71RGU-_otsL4og95umzkA3uu",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RGU-_otsL4og95umzkA3uu",
            type: MusicMediaType.Playlist,
            description: "Groovy pop anthems for a mood booster!"
        },
        {
            name: "Hip Hop Hits",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/4a/35/ae/4a35aea5d14e6bd5b0bf991591a509ad.jpg",
                artist: "jm.edia"
            },
            genre: "Hip Hip",
            length: 75,
            id: "PLTlW3nrfe71R3W09Xk8EzMU8lac8pQmql",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71R3W09Xk8EzMU8lac8pQmql",
            type: MusicMediaType.Playlist,
            description: "Beats and bars with chart-crashing swagger."
        },
        {
            name: "R&B Hits",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/ad/34/f6/ad34f62932585adf1a1e3a47f5e79f3b.jpg",
            genre: "R&B",
            length: 75,
            id: "PLTlW3nrfe71QsJ6YRymelUaBe8CW_yijW",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QsJ6YRymelUaBe8CW_yijW",
            type: MusicMediaType.Playlist,
            description: "Chart-topping tunes with a whole lotta soul."
        },
        {
            name: "Best of 2010s",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/736x/e8/59/52/e859523fdfe33a01b87303671a71c8bf.jpg",
            genre: "Multi-Genre",
            length: 75,
            id: "PLTlW3nrfe71SsxEK04guGdsuM6cN1abGM",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SsxEK04guGdsuM6cN1abGM",
            type: MusicMediaType.Playlist,
            description: "Frank Ocean. Kendrick Lamar. Taylor Swift. And More."
        },
        {
            name: "Best of 2000s",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/e1/e9/cf/e1e9cf7951754915b6cac5e40d53a404.jpg",
            genre: "Multi-Genre",
            length: 75,
            id: "PLTlW3nrfe71TBFmyLxNW68nsD0bNh2jSA",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71TBFmyLxNW68nsD0bNh2jSA",
            type: MusicMediaType.Playlist,
            description: "Nelly Furtado. The Strokes. Outkast. And More."
        },
        {
            name: "Best of KPop",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://pbs.twimg.com/media/FkeJ0jiXoAM4_CA?format=jpg&name=large",
            genre: "KPop",
            length: 114,
            id: "PLTlW3nrfe71SD1Gei-TbTymVMPWAGysFC",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SD1Gei-TbTymVMPWAGysFC",
            type: MusicMediaType.Playlist,
            description: "Biggest and latest hits from the world of Kpop."
        },
        {
            name: "Best of Kendrick Lamar",
            author: "Kendrick Lamar",
            authorUrl: "https://www.youtube.com/channel/UC3lBXcrKFnFAFkfVk5WuKcQ",
            artworkImgSrc: "https://i.pinimg.com/564x/d1/41/58/d1415823a8e22a14b659e014a69dc0ef.jpg",
            genre: "Hip Hop",
            length: 39,
            id: "PLTlW3nrfe71T-tbU0m8khdt6ic_EJ82a6",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71T-tbU0m8khdt6ic_EJ82a6",
            type: MusicMediaType.Playlist,
            description: "The best from G.O.A.T. of Hip Hop."
        },
    ]
}

export const soundtrackCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Film Soundscapes",
            author: "Multiple Artists",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/8d/49/00/8d490089d140c1267399fd81601b9dce.jpg",
            genre: "Multi-Genre",
            length: 75,
            id: "PLTlW3nrfe71RdYiaxv2cdG7ruektVVG9v",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RdYiaxv2cdG7ruektVVG9v",
            type: MusicMediaType.Playlist,
            description: "For the film buffs. Featuring music from big franchises to indie gems."
        },
        {
            name: "Studio Gibhli",
            author: "Joe Hisaishi",
            authorUrl: "https://music.youtube.com/channel/UCeoT9BqyKRktIHvQnWE8zug",
            artworkImgSrc: "https://i.pinimg.com/564x/db/83/35/db8335a52270de80a737e25b4bd58983.jpg",
            genre: "Orchestral",
            length: 39,
            id: "PLTlW3nrfe71TcoCmzexpQIfOChGRVf2kQ",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71TcoCmzexpQIfOChGRVf2kQ",
            type: MusicMediaType.Playlist,
            description: '"Better a pig than a fascist."'
        },
        {
            name: "Animation",
            author: "Disney, Pixar, Dreamworks",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/bf/d4/73/bfd4731e418f8408da2185b06f6ac8c2.jpg",
            genre: "Multi-Genre",
            length: 60,
            id: "PLTlW3nrfe71RRyVnI1QokJR_bexg_r92-",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RRyVnI1QokJR_bexg_r92-",
            type: MusicMediaType.Playlist,
            description: "The very best Disney, Pixar, Dreamworks, and more!"
        },
        {
            name: "Pokémon Collection",
            author: "Multiple Artists",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/a2/98/9e/a2989eda466fadfc9856e398c87ad1be.jpg",
                artist: "hyogonosuke"
            },
            genre: "Multi-Genre",
            length: 24,
            id: "PLTlW3nrfe71RUE4u7eaB0Z0vnhPRG57jm",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RUE4u7eaB0Z0vnhPRG57jm",
            type: MusicMediaType.Playlist,
            description: "Unwind with the magic of Pokémon's music, taking you from Kanto to the wonders of Unovas."
        },
        {
            name: "Interstellar (Original Motion Picture Soundtrack) [Expanded Edition]",
            author: "Hans Zimmer",
            authorUrl: "https://www.youtube.com/channel/UCJeBQabyLa_FvMxb6G67lkw",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d00001e02ac29a65e7ffcfa6f9cb0d342",
            genre: "Orchestral",
            length: 30,
            id: "OLAK5uy_ksMcoC36wmr-fyFQfcpM_TjVqo3pBA1H4",
            url: "https://www.youtube.com/playlist?list=OLAK5uy_ksMcoC36wmr-fyFQfcpM_TjVqo3pBA1H4",
            type: MusicMediaType.Playlist,
            description: '"Do not go gentle into that good night. Rage, rage against the dying of the light."'
        },
        {
            name: "The Lord of the Rings Soundtrack",
            author: "Howard Shore",
            authorUrl: "https://music.youtube.com/channel/UC_S6DQOsVY3JX_dXvdo-WRQ",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d0000b2732b4d071f7824b2c60c3b85cd",
            genre: "Orchestral",
            length: 46,
            id: "PLTlW3nrfe71QRkn-FQpQ8cKfwDteeslx3",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QRkn-FQpQ8cKfwDteeslx3",
            type: MusicMediaType.Playlist,
            description: '"All we have to decide is what to do with the time that is given us."'
        },
        {
            name: "Game of Thrones",
            author: "Ramin Djawadi",
            authorUrl: "https://www.youtube.com/channel/UCvV2r2DeuALi2RprU-J53EA",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d0000b273239a1395e4d595efc28af924",
            genre: "Orchestral",
            length: 191,
            id: "PLsNZSmkIbJbiGQNVSqa9xYFSXpBAhyQpL",
            url: "https://www.youtube.com/playlist?list=PLsNZSmkIbJbiGQNVSqa9xYFSXpBAhyQpL",
            type: MusicMediaType.Playlist,
            description: '"When you play the game of thrones, you win or you die. There is no middle ground"'
        },
        {
            name: "Hans Zimmer Collection",
            author: "Hans Zimmer",
            authorUrl: "https://www.youtube.com/channel/UCJeBQabyLa_FvMxb6G67lkw",
            artworkImgSrc: "https://i.pinimg.com/564x/71/99/39/7199390a81d21b07c5ef129dd26b87aa.jpg",
            genre: "Multi-Genre",
            length: 60,
            id: "PLTlW3nrfe71RLmnJbuStlpdI55On8iHM_",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RLmnJbuStlpdI55On8iHM_",
            type: MusicMediaType.Playlist,
            description: "The very best of the legendary composer."
        },
        {
            name: "Her Soundtrack",
            author: "Arcade Fire, Owen Pallet",
            authorUrl: "https://www.youtube.com/channel/UCIIGxQ6BA9MwIJXBu47SyZQ",
            artworkImgSrc: "https://upload.wikimedia.org/wikipedia/en/2/29/The_Moon_Song_%28Her%29.png",
            genre: "Ambient / Indie",
            length: 15,
            id: "PLTlW3nrfe71RuQWS_Whj4qHwChqv54s1T",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RuQWS_Whj4qHwChqv54s1T",
            type: MusicMediaType.Playlist,
            description: '"The past is just a story we tell ourselves."'
        },
        {
            name: "Minecraft Volume Beta",
            author: "C418",
            authorUrl: "https://www.youtube.com/@C418",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d00001e02aaeb5c9fb6131977995b7f0e",
            genre: "Ambient",
            length: 24,
            id: "OLAK5uy_nafOyxSwDvUta0pkBIkQfpUV6qKZ1jQaw",
            url: "https://www.youtube.com/playlist?list=OLAK5uy_nafOyxSwDvUta0pkBIkQfpUV6qKZ1jQaw",
            type: MusicMediaType.Playlist,
            description: "Minimalist, ambient tracks that evoke calm and fuel imagination."
        },
        {
            name: "Minecraft Volume Alpha",
            author: "C418",
            authorUrl: "https://www.youtube.com/@C418",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d00001e024cf0b29eb06a92aa96acae64",
            genre: "Ambient",
            length: 30,
            id: "OLAK5uy_kdbq6PJddSKFobjO_xbXCYOLuypeXTN_M",
            url: "https://www.youtube.com/playlist?list=OLAK5uy_kdbq6PJddSKFobjO_xbXCYOLuypeXTN_M",
            type: MusicMediaType.Playlist,
            description: "Features darker, more experimental soundscapes compared to its sister album."
        },
        {
            name: "Succession",
            author: "Nicholas Britell",
            authorUrl: "https://www.youtube.com/@nicholasbritell",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d0000aa546f85ddf6fbb47ddecd32b7ae",
            genre: "Orchestral",
            length: 93,
            id: "PLs58dkVLAZbh4OXbElIXrZLTyV7PDzD9s",
            url: "https://www.youtube.com/playlist?list=PLs58dkVLAZbh4OXbElIXrZLTyV7PDzD9s",
            type: MusicMediaType.Playlist,
            description: '"You can’t make a Tomelette without breaking some Gregs"'
        },
        {
            name: "The Last of Us",
            author: "Gustavo Santaolalla, Mac Quayle",
            authorUrl: "https://www.youtube.com/channel/UCUvUnTmMHlhlWxOc0Ouz8Ww",
            artworkImgSrc: "https://i.scdn.co/image/ab67616d0000b27368e5e7cc9256ca8c0917a9dd",
            genre: "Instrumental",
            length: 45,
            id: "PLTlW3nrfe71RiGtV_RywHQh2TFhcqEnzf",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RiGtV_RywHQh2TFhcqEnzf",
            type: MusicMediaType.Playlist,
            description: "Featuring music from both games."
        },
    ]
}

export const acousticCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Acoustic Chill",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/736x/d6/02/f2/d602f22eebf75969194b7d9768705ccd.jpg",
                artist: ""
            },
            genre: "Indie / Pop",
            length: 54,
            id: "PLTlW3nrfe71SpzDmh6NXYzXd2E9WWlGSs",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SpzDmh6NXYzXd2E9WWlGSs",
            type: MusicMediaType.Playlist,
            description: "Keep calm with this mix of laidback, acoustic tracks."
        },
        {
            name: "Guitar Vibes",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/61/b1/54/61b1541b6be8a52c914b64a3482a1afe.jpg",
                artist: ""
            },
            genre: "Muli-Genre",
            length: 48,
            id: "PLTlW3nrfe71QHJED88FjR9maiCkOf4VeB",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QHJED88FjR9maiCkOf4VeB",
            type: MusicMediaType.Playlist,
            description: "Ease into tranquility with these gentle acoustic guitar soundscapes."
        },
        {
            name: "Acoustic Hits",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/e3/55/10/e35510a4d14d6c693c5d69c45ac6a474.jpg",
                artist: "Paul Rousteau"
            },
            genre: "Indie / Pop",
            length: 58,
            id: "PLTlW3nrfe71TCsCTFffnQQ3pvhFVE-Yge",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71TCsCTFffnQQ3pvhFVE-Yge",
            type: MusicMediaType.Playlist,
            description: "Timeless stripped-down hits."
        },
        {
            name: "Immersive Piano",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/bf/11/44/bf1144a2cc044ee1ca77b5f63380d2de.jpg",
                artist: "Andreas N. Fischer"
            },
            genre: "Piano",
            length: 10,
            id: "PLTlW3nrfe71SwyRlqN9yP5nXFXKr-MG5e",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SwyRlqN9yP5nXFXKr-MG5e",
            type: MusicMediaType.Playlist,
            description: "Rich and immersive piano soundscapes."
        },
        {
            name: "Electric Guitar",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/0b/28/51/0b28513eb3ad19a81f5a10672d0d7571.jpg",
                artist: "skip1frame"
            },
            genre: "Muli-Genre",
            length: 58,
            id: "PLTlW3nrfe71TsRwHE_PxTJIDVALm-Harz",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71TsRwHE_PxTJIDVALm-Harz",
            type: MusicMediaType.Playlist,
            description: "Smooth instrumental sounds from the electric guitar."
        },
        {
            name: "Chill Piano",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.insider.com/548b48406bb3f7275bcd3c2e?width=600&format=jpeg&auto=webp",
                artist: "zandraartt"
            },
            genre: "Piano",
            length: 51,
            id: "PLTlW3nrfe71QZJbIIr8w92iNhrw3TfVWY",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QZJbIIr8w92iNhrw3TfVWY",
            type: MusicMediaType.Playlist,
            description: "Peaceful piano to help you slow down, breathe, and relax."
        },
        {
            name: "Peaceful Guitar",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/ec/6d/3d/ec6d3d3659efdf4a094ed4465c5917e5.jpg",
                artist: ""
            },
            genre: "Muli-Genre",
            length: 6,
            id: "PLTlW3nrfe71RKgn8qeJoOY1zcZ9WWzYjA",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RKgn8qeJoOY1zcZ9WWzYjA",
            type: MusicMediaType.Playlist,
            description: "Unwind to these calm acoustic guitar soundscapes."
        }
    ]
}

export const zenCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Rain & Thunderstorms",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/30/08/7e/30087e9ffc709b30be5db5b1b0729930.jpg",
                artist: "zandraartt"
            },
            genre: "Ambient",
            length: 48,
            id: "PLTlW3nrfe71RDkKd2CHK3hpYqmbrYbZXI",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RDkKd2CHK3hpYqmbrYbZXI",
            type: MusicMediaType.Playlist,
            description: "Hours of comforting sounds of thunder and rain."
        },
        {
            name: "Meditation",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/a2/9e/1f/a29e1ff7b361a15b3312e1bdd0282ec9.jpg",
                artist: "Ana Montiel"
            },
            genre: "Ambient",
            length: 62,
            id: "PLTlW3nrfe71RHPo9tlpgzwi-8pFnLc4IU",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71RHPo9tlpgzwi-8pFnLc4IU",
            type: MusicMediaType.Playlist,
            description: "Breathe. Sense. Feel. Transcend."
        },
        {
            name: "Eclectic Ambient",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/a1/bb/67/a1bb67bd622e866e710898f7832b8538.jpg",
            genre: "Multi-Genre",
            length: 23,
            id: "PLTlW3nrfe71QdMQ24zPtnBeqoN8ddeyQa",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71QdMQ24zPtnBeqoN8ddeyQa",
            type: MusicMediaType.Playlist,
            description: "Ambient with a mix of electronica, jazz, and more."
        },
        {
            name: "Ambient Chill",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/fe/21/88/fe2188ec2c97a0ccac6a50e35e26b8bf.jpg",
                artist: "skip1frame"
            },
            genre: "Ambient",
            length: 55,
            id: "PLTlW3nrfe71R7TfPRs_4UvoqgOOywTejE",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71R7TfPRs_4UvoqgOOywTejE",
            type: MusicMediaType.Playlist,
            description: "Ambient sounds to make you feel weightless."
        },
        {
            name: "Spa",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/c7/1d/ef/c71deff1747f9e9660394b8128ca3720.jpg",
                artist: "Ana Montiel"
            },
            genre: "Ambient",
            length: 59,
            id: "PLTlW3nrfe71Q2jMj4wSUK-6Dzf4cjonQf",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71Q2jMj4wSUK-6Dzf4cjonQf",
            type: MusicMediaType.Playlist,
            description: "Music wellness for your soul."
        },
        {
            name: "Pure Ambient",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/736x/61/d9/82/61d9828d5d276abf9e3f3eba5b899e63.jpg",
                artist: "Pham Huy Trung"
            },
            genre: "Ambient",
            length: 35,
            id: "PLTlW3nrfe71SeIP9yu4s-FxSKBVITcQQq",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SeIP9yu4s-FxSKBVITcQQq",
            type: MusicMediaType.Playlist,
            description: "Fill your mind with music for dreaming, thinking and longing."
        },
        {
            name: "Nature Sounds",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: "https://i.pinimg.com/564x/c4/2d/7a/c42d7a3a89512ec5a7de5761cfce1bf4.jpg",
            genre: "Ambient",
            length: 61,
            id: "PLTlW3nrfe71SHBFFp_zeuc8Cpg5IsdqS8",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71SHBFFp_zeuc8Cpg5IsdqS8",
            type: MusicMediaType.Playlist,
            description: "Wander into the magical mix of music, water, birds, and calmness."
        },
        {
            name: "White Noise",
            author: "Somara",
            authorUrl: "",
            artworkImgSrc: {
                url: "https://i.pinimg.com/564x/11/e6/40/11e6409e162e59ed66002cb1a789d154.jpg",
                artist: "Jeffrey Simmons"
            },
            genre: "Ambient",
            length: 31,
            id: "PLTlW3nrfe71R1J2IRzzBYpLhWxojfTPn4",
            url: "https://www.youtube.com/playlist?list=PLTlW3nrfe71R1J2IRzzBYpLhWxojfTPn4",
            type: MusicMediaType.Playlist,
            description: "Hours of long continuous white noise to help you relax and let go."
        },
    ]
}

export const podcastCollections: DiscoverCollection = {
    youtube: [
        {
            name: "Huberman Lab",
            author: "Andrew Huberman",
            authorUrl: "https://www.youtube.com/@hubermanlab",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8aaa4830256e4b613f07287208",
            genre: "Health / Science",
            length: 220,
            id: "PLPNW_gerXa4Pc8S2qoUQc5e8Ir97RLuVW",
            url: "https://www.youtube.com/playlist?list=PLPNW_gerXa4Pc8S2qoUQc5e8Ir97RLuVW",
            type: MusicMediaType.Podcast,
            description: "Huberman Lab explores neuroscience, brain-body connections, and tools for enhancing nervous system function."
        },
        {
            name: "Lex Fridman Podcast",
            author: "Lex Fridman",
            authorUrl: "https://www.youtube.com/@lexfridman",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a563ebb538d297875b10114b7",
            genre: "Talk, Technology",
            length: 432,
            id: "PLrAXtmErZgOdP_8GztsuKi9nrraNbKKp4",
            url: "https://www.youtube.com/playlist?list=PLrAXtmErZgOdP_8GztsuKi9nrraNbKKp4",
            type: MusicMediaType.Podcast,
            description: "Lex explores science, technology, history, philosophy, intelligence, consciousness, love, and power."
        },
        {
            name: "Smartless",
            author: "Smartless",
            authorUrl: "https://www.youtube.com/@SmartLess",
            artworkImgSrc: "https://upload.wikimedia.org/wikipedia/en/e/e2/SmartLess_cover.jpg",
            genre: "Comedy Talk",
            length: 163,
            id: "PLt6RTQSh6jO5A7_QGe41aXNRg1ExK31FX",
            url: "https://www.youtube.com/playlist?list=PLt6RTQSh6jO5A7_QGe41aXNRg1ExK31FX",
            type: MusicMediaType.Podcast,
            description: "Jason Bateman, Sean Hayes, and Will Arnett bring mystery guests for authentic (and often funny) conversations."
        },
        {
            name: "The Daily",
            author: "New York Times",
            authorUrl: "https://www.youtube.com/@NYTPodcasts",
            artworkImgSrc: "https://static01.nyt.com/images/2017/01/29/podcasts/the-daily-album-art/the-daily-album-art-square320-v5.jpg",
            genre: "News",
            length: 474,
            id: "PLdMrbgYfVl-s16D_iT2BJCJ90pWtTO1A4",
            url: "https://www.youtube.com/playlist?list=PLdMrbgYfVl-s16D_iT2BJCJ90pWtTO1A4",
            type: MusicMediaType.Podcast,
            description: "The biggest stories of our time, told by the best journalists in the world. Hosted by Michael Barbaro and Sabrina Tavernise. Twenty minutes a day, five days a week, ready by 6 a.m."
        },
        {
            name: "Fresh Air",
            author: "Fresh Air",
            authorUrl: "https://www.youtube.com/@thisisfreshair",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a069da8b00fc25043d744243d",
            genre: "Arts",
            length: 353,
            id: "PL_hBoyeUT5njGiwtkQMm5sfWQ0eMROHnm",
            url: "https://www.youtube.com/playlist?list=PL_hBoyeUT5njGiwtkQMm5sfWQ0eMROHnm",
            type: MusicMediaType.Podcast,
            description: "Fresh Air, hosted by Terry Gross, features in-depth interviews with prominent figures in contemporary arts and issues."
        },
        {
            name: "Matter of Opinion",
            author: "New York Times",
            authorUrl: "https://www.youtube.com/@NYTPodcasts",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a6854645db72fe5745270cb4e",
            genre: "Politics",
            length: 220,
            id: "PLdMrbgYfVl-t_zd7kglNy7D0LOyASEMw7",
            url: "https://www.youtube.com/playlist?list=PLdMrbgYfVl-t_zd7kglNy7D0LOyASEMw7",
            type: MusicMediaType.Podcast,
            description: "Thoughts, aloud. Hosted by Michelle Cottle, Ross Douthat, Carlos Lozada and Lydia Polgreen. Every Friday, from New York Times Opinion."
        },
        {
            name: "Hard Fork",
            author: "New York Times",
            authorUrl: "https://www.youtube.com/@hardfork",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a37a4c8e5a5f95c3a81f36eb7",
            genre: "Tech",
            length: 39,
            id: "PLB9gMmtMLXxsa8C0PzHFL2tJFh7FrKrYD",
            url: "https://www.youtube.com/playlist?list=PLB9gMmtMLXxsa8C0PzHFL2tJFh7FrKrYD",
            type: MusicMediaType.Podcast,
            description: "“Hard Fork” is a show about the future thatGregs already here. Each week, journalists Kevin Roose and Casey Newton explore and make sense of the latest in the rapidly changing world of tech."
        },
        {
            name: "The Joe Rogan Experience",
            author: "Joe Rogan",
            authorUrl: "https://www.youtube.com/@joerogan",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a4868f57f9fe9696dba800548",
            genre: "Culture / Comedy",
            length: 2167,
            id: "PLk1Sqn_f33KuWf3tW9BBe_4TP7x8l0m3T",
            url: "https://www.youtube.com/playlist?list=PLk1Sqn_f33KuWf3tW9BBe_4TP7x8l0m3T",
            type: MusicMediaType.Podcast,
            description: "The official podcast of comedian Joe Rogan."
        },
        {
            name: "Waveform Podcast",
            author: "WVFRM Podcast",
            authorUrl: "https://www.youtube.com/@Waveform",
            artworkImgSrc: "https://megaphone.imgix.net/podcasts/ae6237e6-7e71-11e9-9c4d-3b02b0eab47c/image/21_VMPN_011_Waveform_Social_3000x3000.png?ixlib=rails-2.1.2&max-w=3000&max-h=3000&fit=crop&auto=format,compress",
            genre: "Tech",
            length: 180,
            id: "PL70yIS6vx_Y2xaKD3w2qb6Eu06jNBdNJb",
            url: "https://www.youtube.com/playlist?list=PL70yIS6vx_Y2xaKD3w2qb6Eu06jNBdNJb",
            type: MusicMediaType.Podcast,
            description: "A tech podcast for the gadget lovers and tech heads among us from the mind of Marques Brownlee, better known as MKBHD."
        },
        {
            name: "The Vergecast",
            author: "The Verge",
            authorUrl: "https://www.youtube.com/@TheVerge",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a8e08d3b0f126c847db80f0a6",
            genre: "Tech",
            length: 178,
            id: "PL39u5ZEfYDEO5PaNRWyqloGY6zzJ1fjBa",
            url: "https://www.youtube.com/playlist?list=PL39u5ZEfYDEO5PaNRWyqloGY6zzJ1fjBa",
            type: MusicMediaType.Podcast,
            description: "The Vergecast is the flagship podcast from The Verge about small gadgets, Big Tech, and everything in between."
        },
        {
            name: "The Rest Is History",
            author: "The Rest Is History",
            authorUrl: "https://www.youtube.com/@restishistorypod",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a053b0b90a2dcd86e3eaad82a",
            genre: "History / Culture",
            length: 230,
            id: "PLEbAHi3fZpuEyBOPtr158TY-FW7P1l4Fg",
            url: "https://www.youtube.com/playlist?list=PLEbAHi3fZpuEyBOPtr158TY-FW7P1l4Fg",
            type: MusicMediaType.Podcast,
            description: "The world’s most popular history podcast, with Tom Holland and Dominic Sandbrook."
        },
        {
            name: "Deep Dive with Ali Abdaal",
            author: "Ali Abdaal",
            authorUrl: "https://www.youtube.com/@DeepDivewithAliAbdaal",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a415bc0e1b5f482188db30cfc",
            genre: "Productivity / Life",
            length: 106,
            id: "PL9KXtqUiGVbs6RWYY5vxyrxsKdrQFaWm2",
            url: "https://www.youtube.com/playlist?list=PL9KXtqUiGVbs6RWYY5vxyrxsKdrQFaWm2",
            type: MusicMediaType.Podcast,
            description: "Uncovering the strategies of successful entrepreneurs and creators for a better life."
        },
        {
            name: "House of R",
            author: "The RingerVerse",
            authorUrl: "https://www.youtube.com/@ringerverse",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a5df11e620e2dacaf271384ed",
            genre: "Entertainment",
            length: 42,
            id: "PLRzBKXpC4g8IvMuyVvPDgYLBMPK7ZAK3O",
            url: "https://www.youtube.com/playlist?list=PLRzBKXpC4g8IvMuyVvPDgYLBMPK7ZAK3O",
            type: MusicMediaType.Podcast,
            description: "Join Mallory Rubin and Joanna Robinson for deep dives into your favorite fantasy and sci-fi worlds."
        },
        {
            name: "StarTalk Podcast",
            author: "StarTalk",
            authorUrl: "https://www.youtube.com/@StarTalk",
            artworkImgSrc: "https://i.scdn.co/image/ab6765630000ba8a77a133a01f346cf7c55fb376",
            genre: "Science",
            length: 349,
            id: "PLnaXrumrax3X8_6L1yL3cejSMH9oTpxiI",
            url: "https://www.youtube.com/playlist?list=PLnaXrumrax3X8_6L1yL3cejSMH9oTpxiI",
            type: MusicMediaType.Podcast,
            description: "Science, pop culture, and comedy collide on StarTalk Radio!"
        },
    ]
}