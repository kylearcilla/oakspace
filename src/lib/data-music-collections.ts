import { MusicMoodCategory } from "./enums"

export const musicCategories: MusicCollectionCategory[] = [
    {
        moodType: MusicMoodCategory.Serene,
        artworkSrc: "/collection_serene.png",
        artworkBlurredSrc: "/collection_serene_bg.png",
        artistCredit: "Photo by Brodie McCabe",
        description: "Music for maximum chill & serenity."
    },
    {
        moodType: MusicMoodCategory.Lofi,
        artworkSrc: "/collection_lofi.png",
        artworkBlurredSrc: "/collection_lofi_bg.png",
        artistCredit: "Art by Minjin Kang and Mijoo Kim",
        description: "The ideal relaxing musical backdrop for any activity.",
    },
    {
        moodType: MusicMoodCategory.Classical,
        artworkSrc: "/collection_classical.png",
        artworkBlurredSrc: "/collection_classical_bg.png",
        artistCredit: "Art by KangHee Kim",
        description: "Timeless masterpieces & modern works for productive inspiration.",
    },
    {
        moodType: MusicMoodCategory.Upbeat,
        artworkSrc: "/collection_upbeat.png",
        artworkBlurredSrc: "/collection_upbeat_bg.png",
        artistCredit: "Art by David Stenbeck",
        description: "Music to spark your energy and uplift the soul.",
    },
    {
        moodType: MusicMoodCategory.Soundtracks,
        artworkSrc: "/collection_soundtracks.png",
        artworkBlurredSrc: "/collection_soundtracks_bg.png",
        artistCredit: "Art by Studio Ghibli",
        description: "Iconic sountracks for cinematic experiences.",
    },
    {
        moodType: MusicMoodCategory.Acoustic,
        artworkSrc: "/collection_acoustic.png",
        artworkBlurredSrc: "/collection_acoustic_bg.png",
        artistCredit: "",
        description: "Intimate, soft, and stripped-down arrangements for the soul.",
    },
    {
        moodType: MusicMoodCategory.Zen,
        artworkSrc: "/collection_zen.png",
        artworkBlurredSrc: "/collection_zen_bg.png",
        artistCredit: "",
        description: "Soothing & ambient sounds for tranquility and inner piece.",
    },
    {
        moodType: MusicMoodCategory.Summer,
        artworkSrc: "/collection_summer.png",
        artworkBlurredSrc: "/collection_summer_bg.png",
        artistCredit: "Photo by Julie Christina",
        description: "Warm and lush soundscapes for summertime bliss.",
    },
]

export const sereneCollections: DiscoverCollection = {
    appleMusic: [
        {
            name: "Piano Chill",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video116/v4/dd/04/4c/dd044c89-71f9-8f69-9d8f-2c7460ac5a8e/Job4bc7d373-59e0-40cc-a874-3ac4316358c0-146860002-PreviewImage_preview_image_nonvideo_sdr-Time1679342201716.png/400x400cc.webp",
            genre: "Piano",
            description: "Relaxing piano melodies for a serene and soothing musical experience to unwind and destress.",
            songCount: 59,
            id: "pl.cb4d1c09a2df4230a78d0395fe1f8fde",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/piano-chill/pl.cb4d1c09a2df4230a78d0395fe1f8fde"
        },
        {
            name: "Lo-Fi Chill",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video122/v4/05/17/94/05179472-b746-8469-e7bf-0fc8e4fe4d72/Job3e6d7db4-6f0f-4213-b128-b4fec87433d8-133044386-PreviewImage_preview_image_nonvideo_sdr-Time1655426257051.png/540x540cc.webp",
            genre: "Classical",
            description: "Hazy, easy sounds for lean-back listening.",
            songCount: 250,
            id: "pl.1d5ead185d8a4a9089f3b952770b762c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/lo-fi-chill/pl.1d5ead185d8a4a9089f3b952770b762c"
        },
        {
            name: "Chill Covers Acoustic",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Features112/v4/67/6d/29/676d2943-0d31-9914-5953-b1d41a3ff769/346871fc-1751-4079-8ac0-47835bc48e10.png/400x400SC.DN01.webp?l=en-US",
            genre: "Soft Rock / Folk",
            description: "Relaxed, stripped-down versions of beloved songs for a mellow vibe.",
            songCount: 100,
            id: "pl.171ed575105547da92990578cb1639be",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/chill-covers/pl.171ed575105547da92990578cb1639be"
        },
        {
            name: "Pure Ambient",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video125/v4/4c/2d/5d/4c2d5dc4-f2d2-5eb2-21ff-bb285c638894/Job500bcd07-1d32-44e4-90f3-39dd0182e751-118078890-PreviewImage_preview_image_nonvideo_sdr-Time1627320875378.png/400x400cc.webp",
            genre: "Ambient / Lofi",
            description: "A sonic journey for relaxation and introspection.",
            songCount: 348,
            id: "pl.a9bd89e7b22e45cbaac40b58c9d3d09b",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pure-ambient/pl.a9bd89e7b22e45cbaac40b58c9d3d09b"
        },
        {
            name: "Blossom",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video122/v4/6a/17/be/6a17be39-1d83-52db-c489-617076ec1097/Job8e78c9e3-28a2-4b86-a456-92a428e37ee8-137603745-PreviewImage_preview_image_nonvideo_sdr-Time1665688636346.png/540x540cc.webp",
            genre: "Ambient",
            description: "Relaxing journeys in ambient music.",
            songCount: 100,
            id: "pl.aa28cc9ba96a4e719da7e2ddc5ffccb3",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pure-ambient/pl.aa28cc9ba96a4e719da7e2ddc5ffccb3"
        },
        {
            name: "Laidback",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/4e/3f/3b/4e3f3b22-7e60-e69b-fc1d-42bb442d199c/Joba3c38c40-a3e2-486c-926d-288dc6485da5-124777687-PreviewImage_preview_image_nonvideo_sdr-Time1633970447073.png/400x400cc.webp",
            genre: "Multi-Genre",
            description: "Laidback tunes for laidback vibes.",
            songCount: 100,
            id: "pl.a4563494a6234007a8d2549ede5d6741",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/laidback/pl.a4563494a6234007a8d2549ede5d6741"
        },
        {
            name: "Minecraft - Volume Alpha",
            author: "C418",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Music115/v4/08/11/31/08113125-d66e-1f90-65d9-08e28000495c/859705593825_cover.jpg/632x632bb.webp",
            genre: "Ambient",
            description: "An enchanting piece of music the captures Minecraft's tranquil spirit with delicate and ambient soundscapes.",
            songCount: 24,
            id: "424968465",
            type: "Album",
            url: "https://music.apple.com/us/album/minecraft-volume-alpha/424968465"
        },
        {
            name: "Study Beats",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video115/v4/64/9d/b0/649db017-94a0-cc19-4b8c-d9a8d10cfaa1/Job08a0d44c-d215-4d8c-aa89-e10728d6c3ca-113999141-PreviewImage_preview_image_nonvideo_sdr-Time1621594311258.png/400x400cc.webp",
            genre: "Lofi",
            description: "Set the mood with these smooth downtempo grooves, perfect for studying or creating a cozy atmosphere.",
            songCount: 99,
            id: "pl.a4e197979fc74b2a91b3cdf869f12aa5",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/study-beats/pl.a4e197979fc74b2a91b3cdf869f12aa5"
        },
        {
            name: "Norah Jones Essentials",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/AMCArtistImages126/v4/e2/2c/be/e22cbe4d-c0be-ae64-8bc0-33129dc10ea8/94e76513-b629-40a6-a704-0a318bedd7ae_ami-identity-3af22bff7e42e606f3c110cb36b32ea7-2023-06-09T22-44-57.358Z_cropped.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "Pop / Jazz",
            description: "Relax to the smooth blend of jazz and folk in Norah Jones' music, graced by her textured vocals.",
            songCount: 25,
            id: "pl.f465577a2c9446478a9d5ab4f7c873ee",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/norah-jones-essentials/pl.f465577a2c9446478a9d5ab4f7c873ee"
        },
        {
            name: "In Rainbows",
            author: "Radiohead",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/8c/77/14/8c771429-61c0-af72-418d-c60c376daa83/634904032463.png/592x592bb.webp",
            genre: "Rock",
            description: "Love and melody return as Radiohead hit a fine balance between adventure and warmth.",
            songCount: 10,
            id: "1109714933",
            type: "Album",
            url: "https://music.apple.com/ca/album/in-rainbows/1109714933"
        },
        {
            name: "Lianne La Havas Essentials",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/fe/cf/a9/fecfa99f-0b22-32f0-df85-d56c9d0e9235/pr_source.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "R&B / Soul",
            description: "Lianne La Havas’ silky blend of R&B, folk, reggae, and jazz is both comforting and devastatingly candid.",
            songCount: 17,
            id: "pl.34756d8dde2c46249a224a25db8ce96b",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/lianne-la-havas-essentials/pl.34756d8dde2c46249a224a25db8ce96b"
        },
        {
            name: "Today's Chill",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/60/0e/d2/600ed23e-1723-3932-1327-c21a4dacc59b/Job284d2f54-b1e7-4a28-89c7-bb63e4e98f6b-112354263-PreviewImage_preview_image_nonvideo_sdr-Time1619539514875.png/540x540cc.webp",
            genre: "Classical",
            description: "The latest updates from electronic music's low-key vanguard.",
            songCount: 250,
            id: "pl.2bb29727dbc34a63936787297305c37c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/lo-fi-chill/pl.2bb29727dbc34a63936787297305c37c"
        },
        {
            name: "Atmospheres",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video112/v4/58/10/d1/5810d184-ad87-7204-f1b0-e93ca9fe76b7/Job2393d9e2-3626-4a7c-b297-9f4e6a4af3c8-137605598-PreviewImage_preview_image_nonvideo_sdr-Time1665691560259.png/400x400cc.webp",
            genre: "Ambient",
            description: "Ethereal ambient music for a tranquil experiences.",
            songCount: 100,
            id: "pl.0809734db4b54d5eb7192a92a8cbf1c2",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/atmospheres/pl.0809734db4b54d5eb7192a92a8cbf1c2"
        },
        {
            name: "Jazz Chill",
            author: "Apple Music Jazz",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video125/v4/24/f9/35/24f9353e-895a-9a24-68d6-8caec44de753/Job327a703c-4aa2-4f33-9949-bd0dd1036250-116914484-PreviewImage_preview_image_nonvideo_sdr-Time1625777804182.png/400x400cc.webp",
            genre: "Jazz",
            description: "Indulge in the soothing blend of jazz melodies perfect for unwinding and chilling.",
            songCount: 250,
            id: "pl.63271312c084419891982eab46cc68ac",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/jazz-chill/pl.63271312c084419891982eab46cc68ac"
        },
        {
            name: "Acoustic Chill",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video125/v4/02/db/db/02dbdbb0-fe71-1a2b-a6f2-790d397b232a/Job587cd8e5-ae68-4017-a649-827acd800d42-124423639-PreviewImage_preview_image_nonvideo_sdr-Time1632941136066.png/400x400cc.webp",
            genre: "Indie Pop",
            description: "Breezy, expressive pop and indie. New and classic tracks blend for a mellow, singer-songwriter vibe that brings comfort and charm.",
            songCount: 100,
            id: "pl.b5e8dbe8a706496496e1292466839207",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/acoustic-chill/pl.b5e8dbe8a706496496e1292466839207"
        },
        {
            name: "Living in the Library",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/8e/3c/a1/8e3ca176-3cec-e0c7-6404-0af103f5805c/Jobd6676bbf-fadd-45de-b520-d11484b2fd13-112399419-PreviewImage_preview_image_nonvideo_sdr-Time1619737021371.png/400x400cc.webp",
            genre: "Chillwave",
            description: "Shut out distractions with these hypnotic grooves.",
            songCount: 100,
            id: "pl.0b448cf227014bde8f986ecad02c93de",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/living-in-the-library/pl.0b448cf227014bde8f986ecad02c93de"
        },
        {
            name: "Frank Ocean Essentials",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features126/v4/d8/90/47/d8904782-ec1f-d3fc-a4cb-3efb713c9ac8/mzl.vhdbrgee.jpg/400x400SC.FPESS03.webp?l=en-US",
            genre: "Pop",
            description: "A genre-defying blender of introspective lyrics, innovative production, and soulful vocals, captivating listeners with his emotional depth and artistry.",
            songCount: 24,
            id: "pl.975962a888c64b42898257a2b5c65a39",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/frank-ocean-essentials/pl.975962a888c64b42898257a2b5c65a39"
        },
        {
            name: "Thundercat Essentials",
            author: "Apple Music",
            artworkImgSrc: "https://i.pinimg.com/564x/ed/02/a3/ed02a36fb8d7ad4c98f7b57eb8dd43eb.jpg",
            genre: "Pop",
            description: "Virtuosic bass, soulful vocals, and genre-bending brilliance seamlessly converge in Thundercat's music.",
            songCount: 23,
            id: "pl.1b312df84dd84e77831b0085a2eef690",
            type: "Playlist",
            url: "https://music.apple.com/ca/artist/thundercat/367322286"
        },
        {
            name: "Natalia LaFourcade Essentials",
            author: "Natalia Lafourcade",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/39/2c/d2/392cd25a-5c05-6655-c3e9-c9ba26cf4337/pr_source.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "Latin Pop / Folk",
            description: "Richly rooted in Mexican traditions, Natalia LaFourcade's music is genre-spanning and emotionally expressive.",
            songCount: 34,
            id: "pl.0131d9e63b204caabe9802d81e891331",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/natalia-lafourcade-essentials/pl.0131d9e63b204caabe9802d81e891331"
        },
        {
            name: "Homework",
            author: "Apple Music",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video115/v4/71/a3/6f/71a36f90-61a1-37f2-c767-34d506802e8a/Job5604ce93-aa8e-47ba-8a75-0ba7264a6fb9-124419087-PreviewImage_preview_image_nonvideo_sdr-Time1632933170009.png/400x400cc.webp",
            genre: "Pop",
            description: "A blend of indie tunes with chill vibes, designed to boost focus and motivation.",
            songCount: 100,
            id: "pl.0385ce9b66404ccf8bde4cac041f1524",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/homework/pl.0385ce9b66404ccf8bde4cac041f1524"
        },
    ],
}

export const lofiCollections = {
    appleMusic: [
        {
            name: "The Lounge",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video125/v4/f3/e0/ca/f3e0ca67-2196-683b-91e2-ec50b46c2ac6/Job4c8e5171-854e-4696-b1a1-6a566990f244-121445907-PreviewImage_preview_image_nonvideo_sdr-Time1629489703860.png/400x400cc.webp",
            genre: "Lofi / Pop",
            description: "Whether you're reading, cooking, or just lying back and chilling out, put this on and let it ride.",
            songCount: 100,
            id: "pl.46bf6d7a51aa48b6a27b37267d293f7f",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/relaxing-classical/pl.46bf6d7a51aa48b6a27b37267d293f7f"
        },
        {
            name: "Solitude",
            author: "Jinsang",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cc/e7/f1/cce7f124-fd18-a5fd-d8a7-0f453361cd16/cover.jpg/592x592bb.webp",
            genre: "Ambient",
            description: "A tranquil sonic journey, filled with mellow beats, nostalgic samples, and a soothing atmosphere",
            songCount: 27,
            id: "1676000364",
            type: "Album",
            url: "https://music.apple.com/us/album/solitude/1676000364"
        },
        {
            name: "Evergreen",
            author: "Apple Music",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video112/v4/43/09/b3/4309b37b-fde7-6a14-b8f2-5243bd537b9e/Job5d858b6c-ee63-4701-a397-6b864fa267cd-137639056-PreviewImage_preview_image_nonvideo_sdr-Time1665758696505.png/400x400cc.webp",
            genre: "Alt / Indie",
            description: "Chill sounds for exploring inner space.",
            songCount: 250,
            id: "pl.7d5e4029dd9140ffbb5da5fda64b3f02",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/evergreen/pl.7d5e4029dd9140ffbb5da5fda64b3f02"
        },
        {
            name: "Lo-Fi Japan",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video112/v4/d2/f3/25/d2f32532-fe9d-c63b-535c-dd85ceae0c92/Jobb63e77c3-12c0-49f9-852a-a532352a1217-133044221-PreviewImage_preview_image_nonvideo_sdr-Time1655426194471.png/400x400cc.webp",
            genre: "Lofi",
            description: "Enjoy mellow Japanese lo-fi, setting a serene mood without distraction.",
            songCount: 150,
            id: "pl.38eb70f47b834187a21cf4e8e5833f35",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/lo-fi-japan/pl.38eb70f47b834187a21cf4e8e5833f35"
        },
        {
            name: "Study lofi 📚",
            author: "Lofi Girl",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/SG-MQ-US-004-Image-000001/v4/7a/85/2a/7a852a7d-02f4-88eb-2428-f7d6888cd9e8/image/400x400cc.webp",
            genre: "Lofi",
            description: "A daily selection of chill beats - perfect to help you relax & study 📚",
            songCount: 100,
            id: "pl.bf7a3cbca49644d8a33f09c1285aef5c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/study-lofi/pl.bf7a3cbca49644d8a33f09c1285aef5c"
        },
        {
            name: "Lo-Fi Jazz",
            author: "Apple Music",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video122/v4/33/1b/fc/331bfcfe-72ed-9e28-b176-d243b657e397/Jobb8b274c0-7633-4029-96a6-dc44c0c588e8-133044411-PreviewImage_preview_image_nonvideo_sdr-Time1655426209345.png/400x400cc.webp",
            genre: "Lofi / Jazz",
            description: "Mellow lo-fi vibes meet soulful jazz.",
            songCount: 100,
            id: "pl.1c1744bbc1174cf2880c53b302d428a0",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/study-lofi/pl.1c1744bbc1174cf2880c53b302d428a0"
        },
        {
            name: "Chill House",
            author: "Apple Music Dance",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/2a/d2/94/2ad2940b-0d37-8665-d5b0-9f511ec7b0fa/Job2d9ee713-d7ee-4a81-b567-5ea07d47df46-108341015-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1608573869722.png/400x400cc.webp",
            genre: "Pop / House",
            description: "Smooth, laid-back electronic beats to set a relaxed, groove-filled atmosphere for unwinding.",
            songCount: 100,
            id: "pl.bd55c25265aa4de8b3fc3e0960751846",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/chill-house/pl.bd55c25265aa4de8b3fc3e0960751846"
        },
        {
            name: "BEATstrumentals",
            author: "Apple Muisc Chill",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video114/v4/e8/f4/5d/e8f45d1a-92ff-d5fd-3fb8-f1183dbd805f/Job01da3c5e-11a4-44b2-8cee-c3b917ab458b-108235318-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1607802044859.png/400x400cc.webp",
            genre: "Lofi",
            description: "A daily selection of chill beats - perfect to help you relax & study 📚",
            songCount: 100,
            id: "pl.f54198ad42404535be13eabf3835fb22",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/study-lofi/pl.f54198ad42404535be13eabf3835fb22"
        },
        {
            name: "Lo-Fi Chill",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video122/v4/05/17/94/05179472-b746-8469-e7bf-0fc8e4fe4d72/Job3e6d7db4-6f0f-4213-b128-b4fec87433d8-133044386-PreviewImage_preview_image_nonvideo_sdr-Time1655426257051.png/540x540cc.webp",
            genre: "Classical",
            description: "Hazy, easy sounds for lean-back listening.",
            songCount: 250,
            id: "pl.1d5ead185d8a4a9089f3b952770b762c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/lo-fi-chill/pl.1d5ead185d8a4a9089f3b952770b762c"
        },
        {
            name: "Lo-fi Sunday",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video116/v4/55/50/c7/5550c79a-2302-278e-02bc-3e5f53c34f30/Jobc61a17df-14b7-4479-83c2-b96c804158a3-129594977-PreviewImage_preview_image_nonvideo_sdr-Time1646864369334.png/400x400cc.webp",
            genre: "Lofi",
            description: "Ease into Sundays with laidback, hip-hop-inspired beats for relaxation, chores, reading, or work.",
            songCount: 100,
            id: "pl.7525e7e5e04f44269ce48ae05d39d209",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/lo-fi-sunday/pl.7525e7e5e04f44269ce48ae05d39d209"
        },
        
    ],
}

export const upbeatCollections = {
    appleMusic: [
        {
            name: "Vibes",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video125/v4/1e/e7/69/1ee76942-480b-5cd7-1fda-e22b93f6b9c5/Job3b677afc-5cbc-4ad2-95a8-79f443f210ca-112465290-PreviewImage_preview_image_nonvideo_sdr-Time1619817745950.png/400x400cc.webp",
            genre: "Electric Pop",
            description: "Unleash your senses with genre-blending tracks that push boundaries and create immersive sonic experiences.",
            songCount: 317,
            id: "pl.d6f5a44a25664f508078216de584ba0d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/vibes/pl.d6f5a44a25664f508078216de584ba0d"
        },
        {
            name: "Pop Chill",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video125/v4/6f/9c/c4/6f9cc45f-9c8e-d9a5-0285-faf729f5cefb/Job5e9a3895-7b3a-4543-b7ef-f52aa9521002-116994080-PreviewImage_preview_image_nonvideo_sdr-Time1625864114647.png/400x400cc.webp",
            genre: "Pop",
            description: "Relaxing and catchy pop tunes to unwind and chill. A curated playlist for those easygoing moments.",
            songCount: 55,
            id: "pl.9a964a33c1484aec8fdb0cac3e7771ed",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pop-chill/pl.9a964a33c1484aec8fdb0cac3e7771ed"
        },
        {
            name: "Hitting the Books",
            author: "Apple Music Focus",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video125/v4/71/32/8f/71328f4a-db5e-0735-49e0-ab962ef5fba1/Job8a5dc44d-0163-4ab2-bf94-7a1e1af57358-124565815-PreviewImage_preview_image_nonvideo_sdr-Time1633379725292.png/400x400cc.webp",
            genre: "Pop / Indie",
            description: "Tracks that provide the perfect backdrop for studying, focusing, and learning.",
            songCount: 55,
            id: "pl.5aedf81bd67d478fa0a17fd58a95a2bc",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/hitting-the-books/pl.5aedf81bd67d478fa0a17fd58a95a2bc"
        },
        {
            name: "Mac Miller Essentials",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video122/v4/16/32/a3/1632a32d-ff0f-ab3d-78d1-d197accc8cd7/Job97b673f9-a3fe-4df4-bf71-24384df36fc0-140351452-PreviewImage_preview_image_nonvideo_sdr-Time1670433416354.png/400x400cc.webp",
            genre: "Pop",
            description: "Mac Miller's music is a blend of introspective lyrics, captivating melodies, and innovative production, leaving a lasting impact.",
            songCount: 40,
            id: "pl.056728da1d2d40fbb30fd6209eb81d0d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/mac-miller-essentials/pl.056728da1d2d40fbb30fd6209eb81d0d"
        },
        {
            name: "Melodic House & Techno",
            author: "Apple Music Dance",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/58/12/05/58120571-1b8b-d072-ef29-5bd97694079e/Job48e859d0-7f3e-4079-9cc2-5bdc3f1642a4-118252396-PreviewImage_preview_image_nonvideo_sdr-Time1627499538149.png/400x400cc.webp",
            genre: "House & Techno",
            description: "Melodic house and techno with vibrant emotions and steady beats.",
            songCount: 125,
            id: "pl.9642e1be452d43fca846dead91e6e8aa",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/melodic-house-techno/pl.9642e1be452d43fca846dead91e6e8aa"
        },
        {
            name: "Kendrick Lamar Essentials",
            author: "Apple Music Hip Hop",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video122/v4/cf/c6/53/cfc65343-9e63-749b-d5c8-0ebf4fa6d76e/Jobc6cab819-f596-4e41-83a6-04f87f06c4f7-140523723-PreviewImage_preview_image_nonvideo_sdr-Time1670618922979.png/400x400cc.webp",
            genre: "Hip-Hop",
            description: "Kendrick Lamar's raw storytelling, versatile flows, and profound artistry have resulted in a rare blend of pop success and widespread critical acclaim.",
            songCount: 30,
            id: "pl.8155ebe08de7423ca2b29929c8adeebd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/kendrick-lamar-essentials/pl.8155ebe08de7423ca2b29929c8adeebd"
        },
        {
            name: "Pop Throwback",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video114/v4/29/19/16/2919168d-a28a-6c14-a517-06bd3e30b0ae/Jobceede723-397c-4913-9deb-b18bc5ac9f69-108344301-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1608586922954.png/400x400cc.webp",
            genre: "Pop",
            description: "Timeless pop classics curated for nostalgia or new discoveries.",
            songCount: 106,
            id: "pl.c21556629e97453f9672feb9d8f228a3",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pop-throwback/pl.c21556629e97453f9672feb9d8f228a3"
        },
        {
            name: "Fleetwood Mac Essentials",
            author: "Apple Music Classic Rock",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video112/v4/84/e1/1b/84e11b0c-2356-c25a-465b-029477436e12/Jobe48e3ced-dc98-46b7-a292-efd87a627a82-140369789-PreviewImage_preview_image_nonvideo_sdr-Time1670454044242.png/400x400cc.webp",
            genre: "Rock",
            description: "Fleetwood Mac's music is a timeless blend of rock, pop, and folk, marked by captivating harmonies and memorable melodies.",
            songCount: 25,
            id: "pl.647db163f3f84ccd9a839e5b6e4f34a2",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/fleetwood-mac-essentials/pl.647db163f3f84ccd9a839e5b6e4f34a2"
        },
        {
            name: "Today's Hits",
            author: "Apple Music Hits",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video115/v4/56/dc/0a/56dc0a5a-2d40-8c3a-a10e-a0fda1898b94/Job4aa95986-4595-4d7d-b439-07c0e2a679d6-124458662-PreviewImage_preview_image_nonvideo_sdr-Time1633041459287.png/400x400cc.webp",
            genre: "Electric Pop",
            description: "The hottest songs across various genres, featuring chart-topping hits and the latest music sensations.",
            songCount: 50,
            id: "pl.f4d106fed2bd41149aaacabb233eb5eb",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb"
        },
        {
            name: "Tyler, The Creator Essentials",
            author: "Apple Music Essentials",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music125/v4/be/51/83/be5183cc-87dd-3ca3-c082-3ccf228e8bf0/pr_source.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "Electric Pop",
            description: "Tyler, The Creator's music is a bold and boundary-pushing blend of hip-hop, alternative rap, and experimental sounds, brimming with raw and sometimes cathartic energy.",
            songCount: 100,
            id: "pl.02757c79605a4577b79c40fb556728db",
            type: "Playlist",
            url: "https://is2-ssl.mzstatic.com/image/thumb/Music125/v4/be/51/83/be5183cc-87dd-3ca3-c082-3ccf228e8bf0/pr_source.png/400x400SC.FPESS03.webp?l=en-US"
        },
        {
            name: "Rap Life",
            author: "Apple Music Hip-Hop",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video124/v4/78/ac/8f/78ac8fe5-990d-e09d-d169-5cc17f95ad1b/Job939bdb7e-5713-4c43-bb2a-3282f83205ba-108235435-PreviewImage_preview_image_nonvideo_sdr-Time1607806893998.png/400x400cc.webp",
            genre: "Hip-Shop",
            description: "Rap Life is the playlist at the forefront of hip-hop culture today, updated regularly with new music you can’t miss.",
            songCount: 101,
            id: "https://music.apple.com/us/playlist/rap-life/pl.abe8ba42278f4ef490e3a9fc5ec8e8c5",
            type: "Album",
            url: "https://music.apple.com/us/playlist/rap-life/pl.abe8ba42278f4ef490e3a9fc5ec8e8c5"
        },
        {
            name: "K-Pop Essentials",
            author: "Apple Music K-Pop",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Features115/v4/bd/48/6e/bd486ee4-6d20-a234-76a6-5669d3f7bd67/U0MtTVMtV1ctSy1Qb3BfRXNzZW50aWFscy1BREFNX0lEPTExMjIyOTY4ODQucG5n.png/400x400SC.CAESS02.webp?l=en-US",
            genre: "K-Pop",
            description: "Essential tracks from the vibrant world of Korean pop music, featuring catchy melodies and infectious beats.",
            songCount: 100,
            id: "pl.6a3c854a49a542739e5d57291b27e122",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/k-pop-essentials/pl.6a3c854a49a542739e5d57291b27e122"
        },
        {
            name: "Afrobeats African",
            author: "Apple Music African",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/d2/f7/cf/d2f7cfca-50f1-307a-c789-166ac9b14aea/Jobd2fcdad4-7987-465c-bf3c-cc1976dd13d4-108508802-PreviewImage_preview_image_nonvideo_sdr-Time1609897324438.png/400x400cc.webp",
            genre: "R&B / House",
            description: "Born in Nigeria and Ghana, Afrobeats has become one of the most eclectic—and exportable—sounds in contemporary music, mixing with everything from rap and dancehall to R&B and house.",
            songCount: 111,
            id: "pl.dc349df19c6f410d874c197db63ecfed",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/afrobeats-hits/pl.dc349df19c6f410d874c197db63ecfed"
        },
        {
            name: "Daft Punk Essentials",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Features115/v4/ed/f9/01/edf90194-32cf-fe39-1b7e-bb42d0c4dea5/mza_4894750657028739591.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "K-Pop",
            description: "Electrifying and futuristic, Daft Punk's music blends infectious beats, mesmerizing synths, and robotic vocals, defining the sound of French electronic music.",
            songCount: 21,
            id: "pl.74657640b88c4587a426160f7441de46",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/daft-punk-essentials/pl.74657640b88c4587a426160f7441de46"
        },
        {
            name: "Renaissance",
            author: "Beyonce",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/fe/ba/43/feba43be-99e8-ad8c-9fad-1bfdea7a4e98/196589344267.jpg/592x592bb.webp",
            genre: "Dance",
            description: "Crafted during the grips of the pandemic, her seventh solo album is a celebration of freedom and a complete immersion into house and dance.",
            songCount: 16,
            id: "1636789969",
            type: "Album",
            url: "https://music.apple.com/us/album/renaissance/1636789969"
        },
        {
            name: "Lemonade",
            author: "Beyonce",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video115/v4/97/58/ef/9758ef3a-bdb3-b7ec-3380-dd3e62dfa2fe/Job58fc92ae-df5a-4ab8-ba4d-d729ca88c62a-112015404-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo_vfcs129603834-Time1619030078267.png/592x592bb.webp",
            genre: "R&B / Hip-Hop",
            description: "A powerful album that showcases Beyoncé's artistry, exploring themes of love, empowerment, and resilience.",
            songCount: 13,
            id: "1460430561",
            type: "Album",
            url: "https://music.apple.com/us/album/lemonade/1460430561"
        },
        {
            name: "Rihanna Essentials",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features116/v4/14/9d/76/149d76d9-cca6-b8e1-146f-e95a9802db13/mza_2396005047706780053.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "Pop",
            description: "Rihanna's music a dynamic fusion of pop, R&B, and hip-hop, characterized by her versatile vocals, empowering lyrics, and trend-setting sound.",
            songCount: 45,
            id: "pl.d549e09c35de455c8aaed84684898d01",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/rihanna-essentials/pl.d549e09c35de455c8aaed84684898d01"
        },
        {
            name: "Currents",
            author: "Tame Impala",
            artworkImgSrc: "https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png",
            genre: "Alt / Psych Rock",
            description: "A psychedelic journey, fusing dreamy melodies, electronic elements, and introspective lyrics into a mesmerizing sonic experience.",
            songCount: 13,
            id: "1440838039",
            type: "Album",
            url: "https://music.apple.com/us/album/currents/1440838039"
        },
        {
            name: "Ariana Grande Essentials",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video122/v4/4a/d4/35/4ad43593-f083-54de-dda5-c85e3ae5fc41/Job5f33622f-3262-413c-bb3e-efff35ad8f2a-140453302-PreviewImage_preview_image_nonvideo_sdr-Time1670544141174.png/400x400cc.webp",
            genre: "Pop",
            description: "Powerful vocals and infectious pop melodies define Ariana Grande's music, blending vulnerability and empowerment seamlessly.",
            songCount: 32,
            id: "pl.942cc20e34a44f06bd36488e6c3e475e",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/ariana-grande-essentials/pl.942cc20e34a44f06bd36488e6c3e475e"
        },
        {
            name: "The Slow Rush",
            author: "Tame Impala",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/65/e3/e7/65e3e740-b69f-f5cb-f2e6-7dedb5265ac9/19UMGIM96748.rgb.jpg/592x592bb.webp",
            genre: "Alt / Psych Rock",
            description: "A sonic tapestry of groovy beats, lush synths, and introspective lyrics that explore the passage of time and personal growth.",
            songCount: 12,
            id: "1497230760",
            type: "Album",
            url: "https://music.apple.com/us/album/the-slow-rush/1497230760"
        },
        {
            name: "Midnights (The Til Dawn Edition)",
            author: "Taylor Swift",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a6/85/b9/a685b9f8-dad3-2ed7-58b2-ab7f64304505/23UMGIM58157.rgb.jpg/592x592bb.webp",
            genre: "Pop",
            description: "Enchanting and introspective, TS's \"Midnights\" weaves a tapestry of captivating melodies and evocative storytelling.",
            songCount: 23,
            id: "1689089710",
            type: "Album",
            url: "https://music.apple.com/us/album/midnights-the-til-dawn-edition/1689089710"
        },
        {
            name: "R&B Throwback",
            author: "Apple Music",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/07/7a/2b/077a2b47-e23f-3c13-e574-eb4a739ccf23/Job0767b0ef-a545-478c-b70e-778419c47c64-145356472-PreviewImage_preview_image_nonvideo_sdr-Time1677014772025.png/400x400cc.webp",
            genre: "R&B",
            description: "Step back in time with and immerse yourself with some R&B classics.",
            songCount: 23,
            id: "pl.605afbf60191408090398dd0cc153e3f",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/r-b-throwback/pl.605afbf60191408090398dd0cc153e3f"
        },
        {
            name: "DAMN.",
            author: "Kendrick Lamar",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music112/v4/86/c9/bb/86c9bb30-fe3d-442e-33c1-c106c4d23705/17UMGIM88776.rgb.jpg/592x592bb.webp",
            genre: "Hip-Hop",
            description: "Raw and introspective, Kendrick Lamar's \"DAMN\". delivers a captivating journey through personal reflections and societal observations.",
            songCount: 14,
            id: "1440881047",
            type: "Album",
            url: "https://music.apple.com/us/album/damn/1440881047"
        },
        {
            name: "To Pimp a Butterfly",
            author: "Kendrick Lamar",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music112/v4/0d/ae/61/0dae6140-d4af-d0df-eae0-3c92eb392a33/15UMGIM11922.rgb.jpg/592x592bb.webp",
            genre: "Hip-Hop",
            description: "A genre-defying masterpiece, Kendrick Lamar's \"To Pimp a Butterfly\" explores profound social commentary through innovative soundscapes.",
            songCount: 16,
            id: "1440828886",
            type: "Album",
            url: "https://music.apple.com/us/album/to-pimp-a-butterfly/1440828886"
        },
        {
            name: "good kid, m.A.A.d city (Deluxe Version)",
            author: "Kendrick Lamar",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Music122/v4/ca/5b/c0/ca5bc0b3-d81d-cc6c-0d19-54b9eedb6dbd/12UMGIM52990.rgb.jpg/592x592bb.webp",
            genre: "Hip-Hop",
            description: "A critically acclaimed hip-hop album that serves as a vivid and introspective narrative of his upbringing in Compton, California and meteoric rise to fame.",
            songCount: 18,
            id: "1440818890",
            type: "Album",
            url: "https://music.apple.com/us/album/good-kid-m-a-a-d-city-deluxe-version/1440818890"
        },
        {
            name: "Channel Orange",
            author: "Frank Ocean",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Music125/v4/04/f8/63/04f863fc-2852-604f-c910-a97ac069506b/12UMGIM40339.rgb.jpg/592x592bb.webp",
            genre: "Pop",
            description: "A mesmerizing album that seamlessly blends soul, R&B, and introspective storytelling for an unforgettable musical experience.",
            songCount: 17,
            id: "1440765580",
            type: "Album",
            url: "https://music.apple.com/us/album/channel-orange/1440765580"
        },
        {
            name: "2000s Hits Essentials",
            author: "Apple Music 2000s",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Features125/v4/be/3a/0a/be3a0ae1-61d4-c0db-34f6-826c5ca179e6/U0MtTVMtV1ctXzAwc19IaXRzX0Vzc2VudGlhbHMtQURBTV9JRD0xMTI0NTQ2OTE3LnBuZw.png/400x400SC.CAHGOY01.webp?l=en-US",
            genre: "A Lot of Genres",
            description: "Relive the sound of the early 2000s with a mix of pop, R&B, and rock hits that defined the decade.",
            songCount: 100,
            id: "pl.e50ccee7318043eaaf8e8e28a2a55114",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/2000s-hits-essentials/pl.e50ccee7318043eaaf8e8e28a2a55114"
        },
        {
            name: "2010s Hits Essentials",
            author: "Apple Music 2010s",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Features125/v4/24/65/14/24651460-e163-eee8-be05-b8f918ecf005/U0MtTVMtV1ctXzEwc19IaXRzX0Vzc2VudGlhbHMtQURBTV9JRD0xMzM5Mzk5MDMzLnBuZw.png/400x400SC.CAHGOY01.webp?l=en-US",
            genre: "A Lot of Genres",
            description: "A compilation of chart-topping hits and genre-defying tracks that shaped the diverse music landscape of the 2010s.",
            songCount: 100,
            id: "pl.6b1b5dfda067443481265436811002f1",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/2010s-hits-essentials/pl.6b1b5dfda067443481265436811002f1"
        },
        {
            name: "KAYTRANADA Essentials",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features125/v4/64/b1/47/64b147d9-c4b4-7319-45be-d043fc60a639/pr_source.png/400x400SC.FPESS03.webp?l=en-US",
            genre: "Electric Pop",
            description: "As warm as a summer day and as laidback as a cocktail party, Kaytranada's music fuses R&B with crisp boom bap and rich electronic textures",
            songCount: 25,
            id: "pl.11f93fe65feb49db807b1219ad865bc0",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/kaytranada-essentials/pl.11f93fe65feb49db807b1219ad865bc0"
        },
        {
            name: "Geography",
            author: "Tom Misch",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/6a/96/98/6a969846-ceeb-bfad-7c20-12ce7b4c19c9/Jobb3f5e43d-c104-4cfb-93a9-ab6380a5b732-131016446-PreviewImage_preview_image_nonvideo_sdr-Time1650404046794.png/592x592bb.webp",
            genre: "Alt Pop",
            description: "a captivating album that fuses soulful melodies, jazz-infused harmonies, and intricate production, creating a sonic journey.",
            songCount: 13,
            id: "1327772541",
            type: "Album",
            url: "https://music.apple.com/us/album/geography/1327772541"
        },
        {
            name: "The Strokes Essentials",
            author: "Apple Music Alternative",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Features125/v4/d0/33/f9/d033f9a2-ba6b-b6da-e1e7-bfbfbfa0d4f0/mzl.nbgjqtdu.jpg/400x400SC.FPESS03.webp?l=en-US",
            genre: "Alt Rock",
            description: "Known for their garage-rock-inspired sound, they deliver catchy, raw, and energetic compositions.",
            songCount: 26,
            id: "pl.3a7a911b00c048ebba63b651935a241a",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/the-strokes-essentials/pl.3a7a911b00c048ebba63b651935a241a"
        },
    ],
}

export const soundtrackCollections = {
    appleMusic: [
        {
            name: "Spirited Away (Original Soundtracks)",
            author: "Joe Hisaishi",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Music115/v4/12/dc/cf/12dccf7e-32ce-12e8-03fe-37574d6c2197/TKCA-72165.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Hisaishi's whimsical and melancholic compositions gracefully capture the wonder and danger found in the world of 'Spirited Away.'",
            songCount: 21,
            id: "883501721",
            type: "Album",
            url: "https://music.apple.com/us/album/spirited-away-original-soundtrack/883501721"
        },
        {
            name: "Disney Pixar Hits",
            author: "Disney",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Features126/v4/46/fd/ad/46fdadd4-5ccb-3e7f-a65e-77530540fec5/4ccb84f2-b046-4940-85f4-65a67d2e5bee.png/400x400cc.webp",
            genre: "Soundtrack",
            description: "Enjoy your favorite songs from Pixar greats like Toy Story, Coco, Monster's Inc., Up, Finding Nemo, Cars and many more!",
            songCount: 53,
            id: "pl.7d443a2e53a242d389f5ed439647df1d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/disney-pixar-hits/pl.7d443a2e53a242d389f5ed439647df1d"
        },
        {
            name: "Up (Soundtrack from the Motion Picture)",
            author: "Michael Giacchino",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music114/v4/03/a1/7b/03a17b02-ec6b-ef7c-1558-b81ea2801139/00050087145095.rgb.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Giacchino's score enriches the film with captivating, whimsical, and often-times gut-wrenching melodies.",
            songCount: 27,
            id: "1440617705",
            type: "Album",
            url: "https://music.apple.com/us/album/up-soundtrack-from-the-motion-picture/1440617705"
        },
        {
            name: "Guardians of the Galaxy",
            author: "Disney",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features116/v4/71/d7/91/71d79119-21ac-b7c7-d205-0ad9950e55e4/87f938ab-5db6-4591-9a2b-08e7e0d467c6.png/400x400cc.webp",
            genre: "Soundtrack",
            description: "Classic rock and pop anthems of 'Guardians of the Galaxy.",
            songCount: 127,
            id: "pl.c7183fd379694af4896a1b4d7dc85d30",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/guardians-of-the-galaxy/pl.c7183fd379694af4896a1b4d7dc85d30"
        },
        {
            name: "Interstellar (Original Motion Picture Soundtrack) [Expanded Edition]",
            author: "Hans Zimmer",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f4/5b/73/f45b735a-8d7a-9713-b217-0f8e1593c28b/794043201943.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Epic, immense and ethereal, Hans Zimmer's score for 'Interstellar' is both intimate & cosmic in the scale of its emotional resonance.",
            songCount: 30,
            id: "1533983552",
            type: "Album",
            url: "https://music.apple.com/us/album/interstellar-original-motion-picture-soundtrack-expanded/1533983552"
        },
        {
            name: "Coco (Original Motion Picture Soundtrack) [Deluxe Edition]",
            author: "Various Artists",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Music124/v4/92/7f/18/927f189a-2a37-393c-3abd-9d7df26f200e/00050087379735.rgb.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Coco's' soundtrack resonates with the lively spirit of Mexican traditions and Coco's heartfelt story.",
            songCount: 27,
            id: "1442277063",
            type: "Album",
            url: "https://music.apple.com/us/album/coco-original-motion-picture-soundtrack-deluxe-edition/1442277063"
        },
        {
            name: "The Lord of the Rings: The Fellowship of the Ring - The Complete Recordings",
            author: "Howard Shore",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/cd/d0/0b/cdd00b19-0cd7-3c23-3f47-79a5b4399491/603497859108.jpg/632x632bb.webp",
            genre: "Soundtrack",
            description: "Epic, sweeping, and enchanting, Howard Shore's soundtrack embodies the grandeur of Middle-earth and the drama of the trilogy.",
            songCount: 37,
            id: "1369921417",
            type: "Album",
            url: "https://music.apple.com/us/album/the-lord-of-the-rings-the/1369921417"
        },
        {
            name: "O Brother, Where Art Thou? (Music from the Motion Picture)",
            author: "Various Artist",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Music124/v4/6c/9b/66/6c9b6682-cdbd-7454-4f3b-69a9fcc74b5b/06UMGIM06980.rgb.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "This Grammy-winning soundtack is a timeless blend of folk, blues, and gospel capturing the soul of rural America.",
            songCount: 19,
            id: "1469575447",
            type: "Album",
            url: "https://music.apple.com/us/album/o-brother-where-art-thou-music-from-the-motion-picture/1469575447"
        },
        {
            name: "Best of Star Wars",
            author: "Disney",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video125/v4/8f/81/99/8f81994b-8b05-9dc8-b433-2e14d2e39264/Jobfefd48b7-9176-4a5f-ac90-e242bc7f403a-112732152-PreviewImage_preview_image_nonvideo_sdr-Time1620071816870.png/400x400cc.webp",
            genre: "Soundtrack",
            description: "May the Force be with you. All of the iconic Star Wars music—in one playlist.",
            songCount: 66,
            id: "pl.cfa48bbf57144c799f2cb002ddff1f96",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/best-of-star-wars/pl.cfa48bbf57144c799f2cb002ddff1f96"
        },
        {
            name: "Spider-Man: Into the Spider-Verse (Soundtrack From & Inspired by the Motion Picture) [Deluxe Edition]",
            author: "Various Artists",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/65/28/ad/6528ad6c-cfeb-fb08-ea85-b19c4612ab08/18UMGIM82277.rgb.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "An eclectic and energizing soundtrack of pop-heavy melodies.",
            songCount: 15,
            id: "1453876765",
            type: "Album",
            url: "https://music.apple.com/us/album/spider-man-into-the-spider-verse-soundtrack-from/1453876765"
        },
        {
            name: "The Last of Us (Video Game Soundtrack)",
            author: "Gustavo Santaolalla",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Music124/v4/95/7a/8b/957a8b8b-77a2-fa17-7d34-0d4ffef0151f/886443853973.jpg/592x592bf.webp",
            genre: "Ambient / Guitar",
            description: "Santaolalla's work merges haunting melodies & ambient sounds that perfectly accompanies the game's emotional narrative & desolate aesthetic.",
            songCount: 30,
            id: "655118434",
            type: "Album",
            url: "https://music.apple.com/ca/playlist/acoustic-chill/pl.b5e8dbe8a706496496e1292466839207"
        },
        {
            name: "The Lion King (Original Motion Picture Soundtrack)",
            author: "Various Artists",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video116/v4/b3/2b/77/b32b77b3-805f-ca68-589d-f970d024d43e/Job391e7b42-cea6-4e8b-bd21-c34411dd5d25-149168221-PreviewImage_preview_image_nonvideo_sdr-Time1682442404342.png/592x592bb.webp",
            genre: "Soundtrack",
            description: "Sweeping and majestic, the 'Lion King' soundtrack echoes the African savannah's beauty and drama of its story.",
            songCount: 12,
            id: "1445732923",
            type: "Album",
            url: "https://music.apple.com/us/album/the-lion-king-original-motion-picture-soundtrack/1445732923"
        },
        {
            name: "There Will Be Blood (Music from the Motion Picture)",
            author: "Jonny Greenwood",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/93/1b/a8/931ba832-0d71-4c5b-1e4e-41498eec13c3/075597930078.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Jonny Greenwood's symphonic score on 'There Will be Blood' adds a haunting, dissonant layer of intensity to the film's sprawling narrative.",
            songCount: 13,
            id: "1449615925",
            type: "Album",
            url: "https://music.apple.com/us/album/there-will-be-blood-music-from-the-motion-picture/1449615925"
        },
        {
            name: "Minecraft - Volume Alpha",
            author: "C418",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Music115/v4/08/11/31/08113125-d66e-1f90-65d9-08e28000495c/859705593825_cover.jpg/632x632bb.webp",
            genre: "Ambient",
            description: "Minecraft's tranquil spirit is captured beautifully in this enchanting music with delicate, ambient soundscapes.",
            songCount: 24,
            id: "424968465",
            type: "Album",
            url: "https://music.apple.com/us/album/minecraft-volume-alpha/424968465"
        },
        {
            name: "Phantom Thread (Original Motion Picture Soundtrack)",
            author: "Jonny Greenwood",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/b0/df/eb/b0dfebba-fbc8-6d1d-187f-d325215861f4/075597933376.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Jonny Greenwood's symphonic score enriches the film's graceful and refined aesthetic of the fashion hub of 1950's London.",
            songCount: 13,
            id: "1329073218",
            type: "Album",
            url: "https://music.apple.com/us/album/phantom-thread-original-motion-picture-soundtrack/1329073218"
        },
        {
            name: "Music from Game of Thrones",
            author: "Ramin Djawadi",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Features113/v4/8c/ec/7a/8cec7ae8-a1b4-e97b-fe96-164f1f634644/pr_source.png/400x400cc.webp",
            genre: "Soundtrack",
            description: "Ramin Djawad's sweeping work of orchestral grandeur and haunting themes enhance the series' drama and fantasy.",
            songCount: 55,
            id: "pl.fea117e7b45549aea9a0663d8a309806",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/music-from-game-of-thrones/pl.fea117e7b45549aea9a0663d8a309806"
        },
        {
            name: "The Revenant (Original Motion Picture Soundtrack)",
            author: "Ryuichi Sakamoto, Alva Noto",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music113/v4/4d/d0/17/4dd017cf-bb56-6fd3-7a7f-2ef7086b6252/886448177968.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Intensely visceral music that enriches the intensity of a story about survival and revenge.",
            songCount: 23,
            id: "1516405841",
            type: "Album",
            url: "https://music.apple.com/us/album/the-revenant-original-motion-picture-soundtrack/1516405841"
        },
        {
            name: "The Grand Budapest Hotel (Original Soundtrack)",
            author: "Various Artists",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Music128/v4/bd/32/d9/bd32d9c1-ef62-fed6-8a39-7dd401445cb2/00018771813620.rgb.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Quirky, whimsical, and emotional, this soundtrack mirrors the film's unique charm and ligh-hearted spirit.",
            songCount: 32,
            id: "1440789547",
            type: "Album",
            url: "https://music.apple.com/us/album/the-grand-budapest-hotel-original-soundtrack/1440789547"
        },
        {
            name: "Her (Original Score)",
            author: "Arcade Fire, Owen Pallet",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/64/a3/db/64a3db4d-942b-40dd-c97b-4b104885d6e0/886448820741.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Soulful and emotionally resonant, the 'Her' soundtrack deepens the film's story about heartbreak and love in the modern world.",
            songCount: 13,
            id: "1553022037",
            type: "Album",
            url: "https://music.apple.com/us/album/her-original-score/1553022037"
        },
        {
            name: "Eternal Sunshine of the Spotless Mind (Soundtrack from the Motion Picture)",
            author: "Jon Brion",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/9a/cc/ea/9accea7e-6cbe-873b-27fb-fd11eb1a7f92/00720616244925.rgb.jpg/592x592bf.webp",
            genre: "Soundtrack",
            description: "A melancholic and ethereal soundtrack that mirrors the film's exploration of love, memory, and heartbreak.",
            songCount: 26,
            id: "1442912229",
            type: "Album",
            url: "https://music.apple.com/us/album/eternal-sunshine-of-the-spotless-mind-soundtrack/1442912229"
        },
        {
            name: "Succession: Season 4 (HBO Original Series Soundtrack)",
            author: "Nicholas Britell",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Music116/v4/cf/09/29/cf09290f-6d4b-a832-2c4a-4b1215d0e2ec/39659.jpg/592x592bb.webp",
            genre: "Soundtrack",
            description: "Nicholas Britell's emotionally rich symphonic score captures the dramatic power struggles within the Roy family.",
            songCount: 25,
            id: "1689640612",
            type: "Album",
            url: "https://music.apple.com/us/album/succession-season-4-hbo-original-series-soundtrack/1689640612"
        },
    ],
}

export const acousticCollections = {
    appleMusic: [
        {
            name: "Classic Acoustic",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video115/v4/05/5d/c4/055dc4b5-29d5-36d9-f6d4-af1ca4822c99/Job1c7d19c5-5de9-46a5-926c-8e4e735d364f-124021346-PreviewImage_preview_image_nonvideo_sdr-Time1631826356251.png/400x400cc.webp",
            genre: "Classical",
            description: "Timeless, stripped-down tunes by classic rockers and songsmiths.",
            songCount: 100,
            id: "pl.895834a538434df79968948ee559608c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classic-acoustic/pl.895834a538434df79968948ee559608c"
        },
        {
            name: "Acoustic Hits",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video114/v4/de/9d/8e/de9d8e29-d270-c066-1968-fe07a43b3087/Jobd99f8763-1e9e-4431-a791-24b649f29382-108349559-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1608606700636.png/540x540cc.webp",
            genre: "Pop / Acoustic",
            description: "Authentic pop hits in their purest form, stripped down to captivate with raw vocals and melodies.",
            songCount: 98,
            id: "pl.522581bf8c264bafa742e75df9772078",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/acoustic-hits/pl.522581bf8c264bafa742e75df9772078"
        },
        {
            name: "Acoustic Summer",
            author: "Apple Music Summertime Sounds",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/17/f4/27/17f4279d-b3fd-28dc-8c50-5f9fb3befb47/Job1229dc7d-c382-4ed0-93e5-25a55bc400f7-111916041-PreviewImage_preview_image_nonvideo_sdr-Time1618953189310.png/540x540cc.webp",
            genre: "Pop / Indie",
            description: "Relaxing melodies that capture the essence of a serene summer.",
            songCount: 61,
            id: "pl.e6441e3d39664b9997d3533e7e65e037",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/acoustic-summer/pl.e6441e3d39664b9997d3533e7e65e037"
        },
        {
            name: "Jazzzzzzzzzzzzzzz",
            author: "Apple Music Jazz",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/35/d8/05/35d8056e-e93d-9362-9fb3-e94895de5776/Jobb2da2f71-36e3-4746-af4e-510a44e6c37d-129106196-PreviewImage_preview_image_nonvideo_sdr-Time1645640540621.png/400x400cc.webp",
            genre: "Jazz Piano",
            description: "Jazz playlist for rest and relaxation, perfect for a good night's sleep and winding down.",
            songCount: 100,
            id: "pl.f31fb34cf8ad46f0a27c960fa805cc4c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/jazzzzzzzzzzzzzzz/pl.f31fb34cf8ad46f0a27c960fa805cc4c"
        },
        {
            name: "Acoustic Chill",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video125/v4/02/db/db/02dbdbb0-fe71-1a2b-a6f2-790d397b232a/Job587cd8e5-ae68-4017-a649-827acd800d42-124423639-PreviewImage_preview_image_nonvideo_sdr-Time1632941136066.png/400x400cc.webp",
            genre: "Pop / Indie",
            description: "Breezy, expressive pop and indie.",
            songCount: 100,
            id: "pl.b5e8dbe8a706496496e1292466839207",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/acoustic-chill/pl.b5e8dbe8a706496496e1292466839207"
        },
        {
            name: "Guitar Chill",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video116/v4/94/89/12/9489124f-4d7a-1e6e-3bd7-4b5fce97efc0/Jobfa38dd38-e1e2-454d-b69e-3f568ea3370a-146857133-PreviewImage_preview_image_nonvideo_sdr-Time1679338491201.png/400x400cc.webp",
            genre: "Classical",
            description: "Soothing guitar melodies for mindfulness and restoration.",
            songCount: 49,
            id: "pl.e048686be4f34819ad4373a034c8bf59",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/guitar-chill/pl.e048686be4f34819ad4373a034c8bf59"
        },
        {
            name: "Acoustic R&B",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/c4/5d/4e/c45d4e9e-b4e4-d5b9-3b0f-8e65d3b69bb9/Job8fd8a67b-c19c-47c9-9eb8-232dd4bb6734-124480431-PreviewImage_preview_image_nonvideo_sdr-Time1633101117439.png/400x400cc.webp",
            genre: "R&B",
            description: "Stripped-down vocals and melodies, both classics and reworks.",
            songCount: 49,
            id: "pl.7378e49b2bc74ec186547e8185ee913f",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/acoustic-r-b/pl.7378e49b2bc74ec186547e8185ee913f"
        },
        {
            name: "Spanish Guitar",
            author: "Prisma Music",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/ULo4KO1n8xpHIe2BZE5W7A/400x400cc.webp",
            genre: "Acoustic Guitar",
            description: "Relaxing riffs straight from the pueblos blancos in Andalusia.",
            songCount: 155,
            id: "pl.2f93a13048b94204918d4b99e9a056df",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/spanish-guitar/pl.2f93a13048b94204918d4b99e9a056df"
        },
        {
            name: "Chill Covers Acoustic",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Features112/v4/67/6d/29/676d2943-0d31-9914-5953-b1d41a3ff769/346871fc-1751-4079-8ac0-47835bc48e10.png/400x400SC.DN01.webp?l=en-US",
            genre: "Soft Rock / Folk",
            description: "Relaxed, stripped-down versions of beloved songs for a mellow vibe.",
            songCount: 100,
            id: "pl.171ed575105547da92990578cb1639be",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/chill-covers/pl.171ed575105547da92990578cb1639be"
        },
        {
            name: "Barefoot Acoustic",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video126/v4/f9/14/6a/f9146aba-858b-6ac8-9f7e-9484d9612ec3/Job9e7c3520-9f68-4c4f-be19-7ab766b6b34a-128958112-PreviewImage_preview_image_nonvideo_sdr-Time1645200074492.png/400x400cc.webp",
            genre: "Soft Rock / Folk",
            description: "Experience the soothing allure of acoustic melodies that evoke nature's beauty.",
            songCount: 264,
            id: "pl.8e7d5f0c316f4d9da9db9c29281f10a4",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/barefoot-acoustic/pl.8e7d5f0c316f4d9da9db9c29281f10a4"
        },
        {
            name: "The Classical Guitar",
            author: "BBC Music Magazine",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/SG-S3-US-Std-Image-000001/v4/f8/cd/aa/f8cdaa66-3a74-19dc-abdd-25ddde764f8a/image/400x400cc.webp",
            genre: "Classical",
            description: "A collection of some of the greatest guitar classics, performed by a selection of the finest players of all time.",
            songCount: 18,
            id: "pl.1147311a18094eb9974c3ba4a425fd61",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/the-classical-guitar/pl.1147311a18094eb9974c3ba4a425fd61"
        },
        {
            name: "Piano Chill",
            author: "Apple Music Acoustic",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video116/v4/dd/04/4c/dd044c89-71f9-8f69-9d8f-2c7460ac5a8e/Job4bc7d373-59e0-40cc-a874-3ac4316358c0-146860002-PreviewImage_preview_image_nonvideo_sdr-Time1679342201716.png/400x400cc.webp",
            genre: "Classical Piano",
            description: "Savor the tranquil solo piano melodies from this acoustic playlist.",
            songCount: 50,
            id: "pl.cb4d1c09a2df4230a78d0395fe1f8fde",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/piano-chill/pl.cb4d1c09a2df4230a78d0395fe1f8fde"
        },
        {
            name: "Piano Essentials",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features125/v4/d5/a6/a3/d5a6a342-2d34-585d-ba9b-1480a5b90788/U0MtTVMtV1ctUGlhbm9fRXNzZW50aWFscy1BREFNX0lEPTEzNDg4MjQ3MTEucG5n.png/400x400SC.CAESS02.webp?l=en-US",
            genre: "Classical Piano",
            description: "Timeless masterpieces showcasing the piano's elegance and emotional depth.",
            songCount: 100,
            id: "pl.5e6ff35247334d9699646afd21e589bd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/piano-essentials/pl.5e6ff35247334d9699646afd21e589bd"
        },
        {
            name: "Jazz Piano Essentials",
            author: "Apple Music Jazz",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Features115/v4/78/85/01/7885018a-d1d5-b0a1-a57a-5e148cb92ac2/U0MtTVMtV1ctSmF6el9QaWFub19Fc3NlbnRpYWxzLUFEQU1fSUQ9MTM1MDAzOTg1NC5wbmc.png/400x400SC.CAESS02.webp?l=en-US",
            genre: "Jazz",
            description: "Expressive keys and improvisational flair create a rhythmic and soulful musical journey.",
            songCount: 100,
            id: "pl.5d571bccbe60493eaadf6bb467720feb",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/jazz-piano-essentials/pl.5d571bccbe60493eaadf6bb467720feb"
        },
    ],
}

export const classicalCollections = {
    appleMusic: [
        {
            name: "Classical Chill",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/e2/06/a0/e206a076-f843-f407-cf3c-4ff6e026f0c6/Job3436f820-e1d0-476c-a75e-4024c7942ced-146855397-PreviewImage_preview_image_nonvideo_sdr-Time1679336619560.png/400x400cc.webp",
            genre: "Classical",
            description: "Relax with a calming mix of classical and contemporary music.",
            songCount: 50,
            id: "pl.5a26d34eb6ec4825976bdef03784537d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-chill/pl.5a26d34eb6ec4825976bdef03784537d"
        },
        {
            name: "Mozart and More",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/34/f5/8d/34f58de7-567e-7c36-139e-196bab132f0a/Job5c246c9c-39d3-4c5c-811f-df7cb5a256de-146855838-PreviewImage_preview_image_nonvideo_sdr-Time1679337227805.png/400x400cc.webp",
            genre: "Classical",
            description: "Explore the 1700s-1800s classical era's brilliance, featuring Mozart, Haydn, Beethoven, and more.",
            songCount: 49,
            id: "pl.fe324bdb6f104480bae2021c10bbcf77",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/mozart-and-more/pl.fe324bdb6f104480bae2021c10bbcf77"
        },
        {
            name: "Piano Essentials",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features125/v4/d5/a6/a3/d5a6a342-2d34-585d-ba9b-1480a5b90788/U0MtTVMtV1ctUGlhbm9fRXNzZW50aWFscy1BREFNX0lEPTEzNDg4MjQ3MTEucG5n.png/400x400SC.CAESS02.webp?l=en-US",
            genre: "Classical Piano",
            description: "Timeless masterpieces showcasing the piano's elegance and emotional depth.",
            songCount: 100,
            id: "pl.5e6ff35247334d9699646afd21e589bd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/piano-essentials/pl.5e6ff35247334d9699646afd21e589bd"
        },
        {
            name: "Joyful Classical",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features116/v4/97/12/d1/9712d139-591f-c299-7ea7-b85f07acd884/b0331411-2392-46ee-b964-e2044ea0c1fb.png/400x400SC.DNC01.webp?l=en-US",
            genre: "Classical",
            description: "Upbeat, witty, and fun, this music is guaranteed to raise a smile.",
            songCount: 100,
            id: "pl.0030a85106a14c078a3bbf0f6befb877",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/joyful-classical/pl.0030a85106a14c078a3bbf0f6befb877"
        },
        {
            name: "Relaxing Classical",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video126/v4/a4/9a/06/a49a06f3-a29d-c581-9f73-2c72e0406561/Job24071de3-fd3f-4b15-8575-a48a9ea1247d-146859868-PreviewImage_preview_image_nonvideo_sdr-Time1679341990783.png/400x400cc.webp",
            genre: "Classical",
            description: "Soothe your soul with serene and timeless classical compositions for tranquil vibes.",
            songCount: 50,
            id: "pl.c2ab8af2e9e74576b3bb45d62819d5cd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/relaxing-classical/pl.c2ab8af2e9e74576b3bb45d62819d5cd"
        },
        {
            name: "Classical Hits",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video116/v4/b2/7f/43/b27f436f-29a2-ac36-b47c-deb683dfec12/Job4a8f3e1a-8510-4b21-a312-4a4977c68c05-148085538-PreviewImage_preview_image_nonvideo_sdr-Time1680632682932.png/400x400cc.webp",
            genre: "Classical",
            description: "Indulge in the timeless beauty of classical hits.",
            songCount: 50,
            id: "pl.9dc583e20e344cc4bf7dc823abde7a2c",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-hits/pl.9dc583e20e344cc4bf7dc823abde7a2c"
        },
        {
            name: "Classical Summer",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video126/v4/1f/98/4f/1f984fbf-2c71-2d0f-8984-67ef988e2854/Job7f278307-f867-4542-890f-ca2e0f4443b6-146927777-PreviewImage_preview_image_nonvideo_sdr-Time1679434445879.png/400x400cc.webp",
            genre: "Classical",
            description: "Experience the magic of summer with the uplifting and vibrant tunes of classical music.",
            songCount: 49,
            id: "pl.ab135abce66d4784b801594e22ce338d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-summer/pl.ab135abce66d4784b801594e22ce338d"
        },
        {
            name: "Mozart Essentials",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Features116/v4/12/58/7d/12587dec-089f-049e-f6d0-c00f9597f4ab/mza_2526353882289973203.png/400x400SC.FPESSC01.webp?l=en-US",
            genre: "Classical",
            description: "Explore the profound and enduring compositions of a master.",
            songCount: 48,
            id: "pl.63696b0b53a24734a0f1f34c92ccd5c4",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/wolfgang-amadeus-mozart-essentials/pl.63696b0b53a24734a0f1f34c92ccd5c4"
        },
        {
            name: "Classical Spring",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/14/29/c3/1429c308-0bf3-43f0-8484-e61c255784d8/Jobd438d920-a841-4d2b-9d2c-cd2e95936492-146676420-PreviewImage_preview_image_nonvideo_sdr-Time1678984039633.png/400x400cc.webp",
            genre: "Classical",
            description: "Embrace the season with a playlist of uplifting classical masterpieces inspired by springtime.",
            songCount: 24,
            id: "pl.c310b4d40b394e2e91cb8d9a08321097",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-spring/pl.c310b4d40b394e2e91cb8d9a08321097"
        },
        {
            name: "Classical Motivation",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video126/v4/ee/97/1d/ee971daa-252c-7604-a87b-9dba08e1fce6/Job565eba58-ba25-410b-b49f-2d550e523e30-146857155-PreviewImage_preview_image_nonvideo_sdr-Time1679338762831.png/400x400cc.webp",
            genre: "Classical",
            description: "Brisk and elegant classical music for an energized and enduring boost.",
            songCount: 73,
            id: "pl.351c85541ea843eeb9b9a814bf210b03",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-motivation/pl.351c85541ea843eeb9b9a814bf210b03"
        },
        {
            name: "The Works",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/c6/ac/53/c6ac5385-a042-fc54-6091-3804cd14fdee/Jobddca6d73-50b9-4691-bfb8-4fb5e6974396-146917950-PreviewImage_preview_image_nonvideo_sdr-Time1679421783328.png/400x400cc.webp",
            genre: "Classical",
            description: "Discover world-class music-making, from solo recitals to epic symphonies, all performed by incredible artists and ensembles.",
            songCount: 59,
            id: "pl.66c17ed5cc754856b944a9150483e375",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/the-works/pl.66c17ed5cc754856b944a9150483e375"
        },
        {
            name: "Classical Sleep",
            author: "Apple Music Classical",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/84/c9/6e/84c96e41-15a5-70c8-f251-c6d5cf38334c/Job29023d68-3d64-4237-af31-6d36f85727e5-146856849-PreviewImage_preview_image_nonvideo_sdr-Time1679338273461.png/400x400cc.webp",
            genre: "Classical",
            description: "Harness the power of classical music for better sleep or for just chilling.",
            songCount: 100,
            id: "pl.998d1aa71ae64e1f9199d0a112067149",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/classical-sleep/pl.998d1aa71ae64e1f9199d0a112067149"
        },
    ],
}

export const zenCollections = {
    appleMusic: [
        {
            name: "Rain Sounds",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video124/v4/d0/a3/9e/d0a39efb-1245-f8de-6442-f3888a794da3/Jobaa10be7c-a041-4cbc-9e8b-7214d1c2a3ab-108330241-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1608539542113.png/400x400cc.webp",
            genre: "Ambient",
            description: "Calming rainfall sounds, from gentle drizzles to distant thunderstorms, providing introspective tranquility and natural white noise.",
            songCount: 250,
            id: "pl.e79d63bcaead407fb44a0c19380822e6",
            type: "Playlist",
            url: "https://music.apple.com/ca/playlist/rain-sounds/pl.e79d63bcaead407fb44a0c19380822e6"
        },
        {
            name: "Sleep Meditation",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video126/v4/ac/b4/f8/acb4f831-bbb5-612f-ebf3-121a23036cef/Job101b8390-f9ec-4fcd-b262-2ec635ad1265-125823217-PreviewImage_preview_image_nonvideo_sdr-Time1636732931998.png/400x400cc.webp",
            genre: "Guided Meditation",
            description: "Guided meditations to ease anxieties and promote restful sleep.",
            songCount: 100,
            id: "pl.b201f2bc8ec3468c8afd74a5e394b6e2",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/sleep-meditation/pl.b201f2bc8ec3468c8afd74a5e394b6e2"
        },
        {
            name: "Ambient Chill",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Video115/v4/e4/d2/e0/e4d2e04d-9a6d-6c8b-1e1c-f7f24214ab0c/Job84f72d8b-9cf6-48f7-a5e5-febb47c82bea-121401900-PreviewImage_preview_image_nonvideo_sdr-Time1629467430113.png/400x400cc.webp",
            genre: "Ambient",
            description: "Sonic wallpaper for discerning ears.",
            songCount: 250,
            id: "pl.bed492442a53481f98e98c6c4da9e01d",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/ambient-chill/pl.bed492442a53481f98e98c6c4da9e01d"
        },
        {
            name: "Spa",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video125/v4/e2/4e/a0/e24ea026-be0a-2e43-b59b-4923adc59727/Job228dc454-d709-438f-93e9-701c91d4c19c-124823685-PreviewImage_preview_image_nonvideo_sdr-Time1634075912438.png/400x400cc.webp",
            genre: "Ambient / Nature",
            description: "Unwind and rejuvenate with a soothing playlist of tranquil melodies for ultimate relaxation.",
            songCount: 250,
            id: "pl.4f2b5ddd448344a1848db8259e6c5f5b",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/spa/pl.4f2b5ddd448344a1848db8259e6c5f5b"
        },
        {
            name: "White Noise",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/3f/1d/1c/3f1d1c58-7efe-e277-5153-5ee2ee6959f6/Jobc1012ed3-0887-4952-abad-c8e9194de8da-118267001-PreviewImage_preview_image_nonvideo_sdr-Time1627509732782.png/540x540cc.webp",
            genre: "Ambient",
            description: "Whispering static to cancel out the distractions around you.",
            songCount: 250,
            id: "pl.4a9b82ff3b2b4c97935434eb257b7cc3",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/white-noise/pl.4a9b82ff3b2b4c97935434eb257b7cc3"
        },
        {
            name: "Sleep Sounds",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video124/v4/0c/9e/b2/0c9eb20f-1b27-9536-83dc-8765af3135a2/Jobd80949f7-345e-4460-a8d5-dcd702991b62-108327984-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo-Time1608524996185.png/400x400cc.webp",
            genre: "Ambient",
            description: "Relaxing sounds to lull you into peaceful sleep and create a tranquil bedtime atmosphere.",
            songCount: 250,
            id: "pl.0ef59752c0cd457dbf1391f08cbd936f",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/sleep-sounds/pl.0ef59752c0cd457dbf1391f08cbd936f"
        },
        {
            name: "Pure Ambient",
            author: "Apple Music Electronic",
            artworkImgSrc: "https://is2-ssl.mzstatic.com/image/thumb/Video125/v4/4c/2d/5d/4c2d5dc4-f2d2-5eb2-21ff-bb285c638894/Job500bcd07-1d32-44e4-90f3-39dd0182e751-118078890-PreviewImage_preview_image_nonvideo_sdr-Time1627320875378.png/400x400cc.webp",
            genre: "Ambient / Lofi",
            description: "A sonic journey for relaxation and introspection.",
            songCount: 348,
            id: "pl.a9bd89e7b22e45cbaac40b58c9d3d09b",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pure-ambient/pl.a9bd89e7b22e45cbaac40b58c9d3d09b"
        },
        {
            name: "Pure Meditation",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Video116/v4/e1/9f/79/e19f79c5-370b-a28d-763a-f16b0b49fecf/Job46fe51ce-a72a-4c42-af8c-2965dc7fa683-127602118-PreviewImage_preview_image_nonvideo_sdr-Time1641929865610.png/400x400cc.webp",
            genre: "Ambient / Nature",
            description: "Serene ambient tunes for tranquility, featuring gentle acoustic sounds, nature sounds, and more.",
            songCount: 250,
            id: "pl.e896478fdf824a93ab2f99165c3a1422",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pure-meditation/pl.e896478fdf824a93ab2f99165c3a1422"
        },
        {
            name: "Guided Meditation",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is3-ssl.mzstatic.com/image/thumb/Video116/v4/43/22/a5/4322a546-e5dc-bbe2-f284-229844eaa26d/Job866f054e-3f12-4b82-bbca-971b4cd5927b-125168388-PreviewImage_preview_image_nonvideo_sdr-Time1634931226260.png/400x400cc.webp",
            genre: "Guided Meditation",
            description: "Enlightening talks and prompts from leading voices in meditation and wellness.",
            songCount: 100,
            id: "pl.84d78a058d1744208f63004b66e4d857",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/guided-meditation/pl.84d78a058d1744208f63004b66e4d857"
        },
        {
            name: "Beats & Breath",
            author: "Apple Music Fitness",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/ea/d6/8a/ead68a2c-3c45-1625-715c-47d3136031c4/U0MtTVMtV1ctV2VsbG5lc3MtQmVhdHNfQW5kX0JyZWF0aC1BREFNX0lEPTE1Mjc4Mzc0OTcucG5n.png/400x400SC.DN01.webp?l=en-US",
            genre: "Ambient / Lofi",
            description: "An eclectic playlist to keep you focused and anchored during yoga or meditation.",
            songCount: 99,
            id: "pl.72a029c5d77f4da8a0793afeb2a8be8b",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/beats-breath/pl.72a029c5d77f4da8a0793afeb2a8be8b"
        },
        {
            name: "Pure Calm",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/9a/7f/4c/9a7f4c3e-1589-1dce-6108-5aaef7d0c31a/Job82d14b04-96eb-4395-b832-41857712eb15-121447836-PreviewImage_preview_image_nonvideo_sdr-Time1629490644784.png/400x400cc.webp",
            genre: "Mostly Classical",
            description: "Harmonious music for mindfulness and breathwork.",
            songCount: 100,
            id: "pl.ffc344338c3d4ff394ddcf94d766c143",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/pure-calm/pl.ffc344338c3d4ff394ddcf94d766c143"
        },
        {
            name: "High Vibes Yoga",
            author: "Apple Music Fitness",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/5f/4f/66/5f4f6654-ef2a-e284-1696-8a478d4af401/U0MtTVMtV1ctV2VsbG5lc3MtSGlnaF9WaWJlc19Zb2dhLUFEQU1fSUQ9MTUyNzgyNzYzMS5wbmc.png/592x592SC.DN01.webp?l=en-US",
            genre: "Pop / House",
            description: "High-energy music for ecstatic yoga sessions with tribal and house influences.",
            songCount: 99,
            id: "pl.10555e26fab04dfb81041ae92a76effd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/high-vibes-yoga/pl.10555e26fab04dfb81041ae92a76effd"
        },
        {
            name: "Flow State",
            author: "Apple Music Fitness",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/db/c8/d3/dbc8d309-d2e5-40c4-fde0-bae8a50929ae/U0MtTVMtV1ctV2VsbG5lc3MtRmxvd19TdGF0ZS1BREFNX0lEPTE1Mjc4MjQ2MjkucG5n.png/592x592SC.DN01.webp?l=en-US",
            genre: "Ambient",
            description: "Music to elevate mindfulness & creativity by immersing you in the flow state.",
            songCount: 99,
            id: "pl.de20dc985af84cc2aaef6c9f5f493c3b",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/flow-state/pl.de20dc985af84cc2aaef6c9f5f493c3b"
        },
        {
            name: "Healing Meditation",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Features115/v4/34/41/27/3441276f-143c-c19b-84d2-e4cbaa48b350/U0MtTVMtV1ctV2VsbG5lc3MtSGVhbGluZ19NZWRpdGlhdGlvbi1BREFNX0lEPTE1MjI2MzAzMjMucG5n.png/592x592SC.DN01.webp?l=en-US",
            genre: "Guided Meditation",
            description: "Immerse yourself in a world of peaceful music, tailor-made for enhancing your breathwork and relaxation.",
            songCount: 100,
            id: "pl.d8caca2864d645459da8f4301cb26a37",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/healing-meditation/pl.d8caca2864d645459da8f4301cb26a37"
        },
        {
            name: "Ambient Sleep",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/5e/99/a0/5e99a089-1ab7-3f3f-d47b-ac9d0b7a71db/Jobfc694a00-8cd5-4a80-b4e6-9f10264bc141-125895533-PreviewImage_preview_image_nonvideo_sdr-Time1636995684378.png/400x400cc.webp",
            genre: "Ambient",
            description: "Serenity through breathwork and soothing tunes.",
            songCount: 250,
            id: "pl.2ce0acb450d048c49d4c4b52b2f4b195",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/ambient-sleep/pl.2ce0acb450d048c49d4c4b52b2f4b195"
        },
        {
            name: "Breathwork",
            author: "Apple Music Wellbeing",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video112/v4/cb/82/a9/cb82a9f8-bbdc-ee6e-3916-074a22f1fb1c/Job49ad0960-8c7d-446f-a012-50eeaf3cefd9-137838647-PreviewImage_preview_image_nonvideo_sdr-Time1666209944481.png/400x400cc.webp",
            genre: "Ambient",
            description: "Soothing melodies to enhance mindfulness, relaxation, and deep breathing for overall well-being.",
            songCount: 100,
            id: "pl.45fcb3b93a9749eaa8190693802d025e",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/breathwork/pl.45fcb3b93a9749eaa8190693802d025e"
        },
        {
            name: "Nature Sounds",
            author: "Apple Music Sleep",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/0d/b0/1f/0db01fe7-d24c-fc40-bfdb-b536ae0ce0a0/Jobbd1af4e2-c81e-442b-863d-51e298fc133a-125892929-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo_vfcs223323551-Time1636990385482.png/400x400cc.webp",
            genre: "Nature",
            description: "Soothing nature sounds to lull you to a state of relaxation.",
            songCount: 100,
            id: "pl.040f99fdd83542a79b28fc4c13f773bd",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/nature-sounds/pl.040f99fdd83542a79b28fc4c13f773bd"
        }
    ],
}

export const summerCollections = {
    appleMusic: [
        {
            name: "Summer Vibes",
            author: "Apple Music Summertime Sounds",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/65/19/05/6519051b-0aca-c750-4f3f-009c09e9af75/Job7b50fd20-698c-4871-95c6-804f39fe616e-117771577-PreviewImage_preview_image_nonvideo_sdr-Time1626888119158.png/540x540cc.webp",
            genre: "Pop",
            description: "Sun-soaked, feel-good tunes for the summer.",
            songCount: 109,
            id: "pl.6cbec98d25194addb2b012e681e0eff6",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/summer-vibes/pl.6cbec98d25194addb2b012e681e0eff6"
        },
        {
            name: "Women In Music, Pt. III (Expanded Edition)",
            author: "HAIM",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d8/78/01/d87801c7-ae42-63cc-f887-3b22c2b20309/886448983798.jpg/632x632bb.webp",
            genre: "Alternative",
            description: "An album teeming dreamy melodies, lively guitars, and summer soul-searching.",
            songCount: 18,
            id: "1550175828",
            type: "Album",
            url: "https://music.apple.com/us/album/women-in-music-pt-iii-expanded-edition/1550175828"
        },
        {
            name: "Songs of the Summer",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/8c/b1/95/8cb1958d-50d6-3afc-0f97-8fd6d353841b/Job31332cbd-86f9-4329-b292-8d73c11b945a-112821519-PreviewImage_preview_image_nonvideo_sdr-Time1620240698518.png/540x540cc.webp",
            genre: "Mostly Pop",
            description: "Sunny, feel-good melodies to brighten your summer days.",
            songCount: 79,
            id: "pl.34c6bf42a176492abb918edb57b565e9",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/songs-of-the-summer/pl.34c6bf42a176492abb918edb57b565e9"
        },
        {
            name: "Channel Orange",
            author: "Frank Ocean",
            artworkImgSrc: "https://is4-ssl.mzstatic.com/image/thumb/Music125/v4/04/f8/63/04f863fc-2852-604f-c910-a97ac069506b/12UMGIM40339.rgb.jpg/592x592bb.webp",
            genre: "Pop",
            description: "A mesmerizing album that seamlessly blends soul, R&B, and introspective storytelling for an unforgettable musical experience.",
            songCount: 17,
            id: "1440765580",
            type: "Album",
            url: "https://music.apple.com/us/album/channel-orange/1440765580"
        },
        {
            name: "Legend – The Best of Bob Marley & The Wailers (2002 Edition)",
            author: "Bob Marley & The Wailers",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/ea/20/06/ea2006f9-7512-cf9c-7b44-78116156875e/12UMGIM14712.rgb.jpg/632x632bb.webp",
            genre: "Reggae",
            description: "Timeless reggae rhythms with messages of love, freedom, and social consciousness.",
            songCount: 16,
            id: "1469575763",
            type: "Album",
            url: "https://music.apple.com/us/album/legend-the-best-of-bob-marley-the-wailers-2002-edition/1469575763"
        },
        {
            name: "Summer Soul",
            author: "Apple Music Summertime Sounds",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video116/v4/42/c2/58/42c25864-54ef-42f3-95fa-c2a9667aba36/Job6d14df16-f816-4a8a-ab72-6d5586702c0c-126905734-PreviewImage_preview_image_nonvideo_sdr-Time1639673781768.png/540x540cc.webp",
            genre: "Soul / Pop",
            description: "Soulful melodies for laid-back summer vibes.",
            songCount: 61,
            id: "pl.bd08a568ec2647d19da5891d3a4a3ebe",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/summer-soul/pl.bd08a568ec2647d19da5891d3a4a3ebe"
        },
        {
            name: "Happy Hits",
            author: "Apple Music Pop",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video125/v4/ba/3c/65/ba3c6531-4993-ef14-6d2c-c092f67bef58/Jobceac683a-4ba1-4c75-a7aa-623d6820930f-111427458-PreviewImage_preview_image_nonvideo_sdr-Time1618522173056.png/540x540cc.webp",
            genre: "Pop",
            description: "Elevate your mood with breezy beats, uplifting vocals, and catchy rhythms.",
            songCount: 100,
            id: "pl.4fe671d3bd994738ace5ae974daebc10",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/happy-hits/pl.4fe671d3bd994738ace5ae974daebc10"
        },
        {
            name: "Sunkissed",
            author: "Apple Music Chill",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/3c/aa/bf/3caabfd0-a1d6-8ad3-9089-d6f0ee26e9f7/Jobb2bd0019-bf67-483b-b0ca-73a28bf5dec5-129188771-PreviewImage_preview_image_nonvideo_sdr-Time1645804513371.png/540x540cc.webp",
            genre: "Pop",
            description: "Radiant tunes that embody the sun's golden embrace.",
            songCount: 100,
            id: "pl.e4d0cb54b9dd46648a06290ff1a90045",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/sunkissed/pl.e4d0cb54b9dd46648a06290ff1a90045"
        },
        {
            name: "Permanent Vacation",
            author: "Apple Music Summertime Sounds",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/0e/c1/d9/0ec1d9b9-2d5d-62e0-9003-3854ccf47a0a/Job359dd63a-f8db-4d4a-9997-d20efc5bff8c-111817944-PreviewImage_PreviewImageIntermediate_preview_image_nonvideo_vfcs128013572-Time1618868454188.png/540x540cc.webp",
            genre: "Pop",
            description: "Music that leads you to a perpetual state of chill.",
            songCount: 196,
            id: "pl.9dc9de535a544d5d9692766feac0f7c7",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/permanent-vacation/pl.9dc9de535a544d5d9692766feac0f7c7"
        },
        {
            name: "Beach Party",
            author: "Apple Music",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/b2/96/b5/b296b55c-af41-423c-f6a8-280040f93aaf/Job835ceaf0-afac-4ea1-96dc-626fbd8663ec-124485814-PreviewImage_preview_image_nonvideo_sdr-Time1633112893634.png/540x540cc.webp",
            genre: "Pop",
            description: "Summer vibe tunes fit for fun at the beach.",
            songCount: 100,
            id: "pl.894cf25d1772492f89115f854826fc15",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/beach-party/pl.894cf25d1772492f89115f854826fc15"
        },
        {
            name: "Summer Sunshine",
            author: "Apple Music",
            artworkImgSrc: "https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/51/f8/c0/51f8c0a1-df59-b36c-b0f1-a27f56f8c1dd/Job05ccab2b-f8aa-4203-a470-730d3d35af1d-126906086-PreviewImage_preview_image_nonvideo_sdr-Time1639674444237.png/400x400cc.webp",
            genre: "Pop",
            description: "Pop so hot, you’ll need SPF 50+ to listen.",
            songCount: 50,
            id: "pl.f27ed614acb2429188a9d09f50caa9ff",
            type: "Playlist",
            url: "https://music.apple.com/us/playlist/summer-sunshine/pl.f27ed614acb2429188a9d09f50caa9ff"
        },
    ],
}