export const defaultThemes: Theme[] = [
    {
        title: "Dark Mode",
        thumbnailImgSrc: "/dark-mode-icon.png",
        sectionDetails: {
            title: "default",
            index: 0
        },
        properties: {
            isDark: true,
            hasTwin: true,
            primaryBgColor: "#0C0C0D",
            secondaryBgColor: "#111111",
            tertiaryBgColor: "#141314",
            fgColor1: "248, 177, 187",
            fgColor2: "163, 182, 255",
            fgColor3: "227, 158, 206",
            fgColor4: "1153, 151, 254",
            textColor1: "255, 255, 255",
            textColor2: "255, 255, 255",
            profibleBorderColor: "#FFFFFF",
            themeHighlightBorderColor: "#A3B6FF",
            hoverColor: "#1b1b1b",
            tabColor: "#292929",
            tabHighlightColor: "#FFFFFF",
            tabHighlightBoxShadow: "0px -1px 11px rgba(255, 255, 255, 0.21)",
            modalBgColor: "#121212",
            modalFgColor: "#161616",
            dividerColor: "#242424",
            tabColorTextColor: "#FFFFFF",
            pomBgColor: "#121112",
            pomIconColor: "#858585",
            pomProgressBarFgColor: " linear-gradient(270.59deg, #FF8B9C -10.17%, #E39ECE 12.41%, #A3B6FF 71.86%)",
            pomProgressBarFgBoxShadow: "-1px 0px 23px 6px rgba(187, 173, 237, 0.2)",
            pomProgressBgColor: "#000000",
            pomProgressPlaybackBtnColor: "#F096B8",
            muiscPlayerBgColor: "rgba(153, 153, 153, 0.15)",
            musicProgressBgColor: "#0C0D0B",
            navMenuBgColor: "#121112",
            headerElementBgColor: "#141414",
            headerElementBorderVal: "0.8px solid #202020",
            navIconColor: "none",
            taskViewBgColor: "#121112",
            navIconBgColor: "#1C191C",
            borderVal: "0.9px solid #1C1C1C",
            borderVal2: "1.2px solid #1b1b1b",
            shadowVal: "none",
            shadowVal2: "none",
            sessionBgColor: "#1C1C1C",
            sessionBorderVal: "0.4px solid #262626",
            sessionShadowVal: "none",
            activeSessionItemBorderVal: "0.85px solid #1a1a1a",
            activeSessionItemShadowVal: "none",
            gridItemBorderVal: "0.8px solid #1f1f1f",
            gridItemShadowVal: "none",
            themeToggleBtnBgColor: "#111111",
            iconToggleBtnBgColor: "#3F3F3F",
            highlighterToggleBtnBgColor: "#191919",
            menuBorderVal: "0.9px solid #1C1C1C",
        }
    } as DefaultTheme,
    {
        title: "Light Mode",
        thumbnailImgSrc: "/light-mode-icon.png",
        sectionDetails: {
            title: "default",
            index: 1
        },
        properties: {
            isDark: false,
            hasTwin: true,
            primaryBgColor: "#FFFEFF",
            secondaryBgColor: "#FAFAFA",
            tertiaryBgColor: "#fdfdfd",
            fgColor1: "248, 177, 187",
            fgColor2: "163, 182, 255",
            fgColor3: "227, 158, 206",
            fgColor4: "1153, 151, 254",
            menuBorderVal: "1.1px solid rgba(79, 79, 79, 0.115)",
            borderVal: "1px solid rgb(236, 236, 236)",
            borderVal2: "1px solid rgba(79, 79, 79, 0.1)",
            shadowVal: "0px 4px 13px rgba(0, 0, 0, 0.06)",
            shadowVal2: "0px 5px 9px rgba(0, 0, 0, 0.03)",
            sessionBgColor: "#FFFFFF",
            sessionBorderVal: "0.6px solid #f0f0f0",
            sessionShadowVal: "0px 4px 4px rgba(0, 0, 0, 0.05)",
            activeSessionItemBorderVal: "1.3px solid #f4f4f4",
            activeSessionItemShadowVal: "none",
            textColor1: "46, 35, 48",
            textColor2: "255, 255, 255",
            profibleBorderColor: "string",
            themeHighlightBorderColor: "#A3B6FF",
            hoverColor: "#F1F1F1",
            tabColor: "#F2F2F2",
            tabHighlightColor: "#949FFF",
            tabHighlightBoxShadow: "none",
            tabColorTextColor: "#cacaca",
            headerElementBgColor: "#FFFFFF",
            headerElementBorderVal: "1px solid #EEEEEE",
            modalBgColor: "#FAFAFA",
            modalFgColor: "#FFFEFF",
            gridItemBorderVal: "0.7px solid #EAEAEA",
            gridItemShadowVal: "none",
            dividerColor: "#EDEDED",
            pomBgColor: "#E6EAFF",
            pomIconColor: "#CFC4E2",
            muiscPlayerBgColor: "#a3b6ff",
            musicProgressBgColor: "#494E7D",
            navMenuBgColor: "#FFFEFF",
            taskViewBgColor: "#FFFEFF",
            pomProgressBarFgColor: " linear-gradient(270.59deg, #FF8B9C -10.17%, #E39ECE 12.41%, #A3B6FF 71.86%)",
            pomProgressBarFgBoxShadow: "none",
            pomProgressBgColor: "#E6EAFF",
            pomProgressPlaybackBtnColor: "#F096B8",
            navIconColor: "none",
            navIconBgColor: "none",
            themeToggleBtnBgColor: "string",
            iconToggleBtnBgColor: "#CCCBCC",
            highlighterToggleBtnBgColor: "#F5F5F5",
        }
    } as DefaultTheme
]
export const darkColorThemes = [
    {
        title: "Dusk",
        isDark: false,
        colorPalette: [
            "#1A191A", "#252223", "#C69393", "#E6A090", "#EFB9AE"
        ],
        properties: {

        }
    },
    {
        title: "Sunset",
        isDark: false,
        colorPalette: [
            "#1A191A", "#232225", "#9792CD", "#B5A7F0", "#C8B8F3"
        ],
        properties: {

        }
    },
    {
        title: "Cumulus",
        isDark: false,
        colorPalette: [
            "#19191A", "#222425", "#959CB6", "#AFB5CA", "#BCCAD8"
        ],
        properties: {

        }
    },
]
export const lightColorThemes: Theme[] = [
    {
        title: "Olive",
        sectionDetails: {
            title: "light",
            index: 0
        },
        colorPalette: [
            "#72673A", "#A2956E", "#BFB38D", "#D2C7A8", "#DBD5C1"
        ],
        properties: {
            isDark: false,
            hasTwin: false,
            primaryBgColor: "#ECE7D6",
            secondaryBgColor: "#F0ECDF",
            tertiaryBgColor: "#F4F0E6",
            fgColor1: "248, 177, 187",
            fgColor2: "160, 148, 113",
            fgColor3: "227, 158, 206",
            fgColor4: "1153, 151, 254",
            menuBorderVal: "0.4px solid rgba(200, 200, 200, 0.46)",
            borderVal: "0.4px solid rgba(178, 178, 178, 0.46)",
            borderVal2: "1px solid rgba(79, 79, 79, 0.1)",
            shadowVal: "0px 4px 18px 0px rgba(123, 123, 123, 0.07)",
            shadowVal2: "0px 5px 9px rgba(0, 0, 0, 0.03)",
            sessionBgColor: "#FAF6ED",
            sessionBorderVal: "0.4px solid rgba(164, 164, 164, 0.26)",
            sessionShadowVal: "0px 2px 5px 0px rgba(0, 0, 0, 0.03)",
            activeSessionItemBorderVal: "0.4px solid #e6e3db",
            activeSessionItemShadowVal: "none",
            textColor1: "67, 63, 50",
            textColor2: "255, 255, 255",
            profibleBorderColor: "string",
            themeHighlightBorderColor: "#A3B6FF",
            hoverColor: "#F9F5ED",
            tabColor: "#E8E2D6",
            tabHighlightColor: "#A39673",
            tabHighlightBoxShadow: "none",
            tabColorTextColor: "#979797",
            headerElementBgColor: "#F0ECDF",
            headerElementBorderVal: "0.9px solid #d3cdba",
            modalBgColor: "#F0ECDF",
            modalFgColor: "#f4f1eb",
            gridItemBorderVal: "0.4px solid #D9D3C1",
            gridItemShadowVal: "none",
            dividerColor: "#DBD7CA",
            pomBgColor: "none",
            pomIconColor: "#A2956E",
            muiscPlayerBgColor: "#A09471",
            musicProgressBgColor: "#4B4C43",
            navMenuBgColor: "#F0ECDF",
            taskViewBgColor: "#F0ECDF",
            pomProgressBarFgColor: "#A4946E",
            pomProgressBarFgBoxShadow: "none",
            pomProgressBgColor: "#DED7C5",
            pomProgressPlaybackBtnColor: "#A4946E",
            navIconColor: "#A2956E",
            navIconBgColor: "#ece7d9",
            themeToggleBtnBgColor: "ECE7D8",
            iconToggleBtnBgColor: "#CAC3B0",
            highlighterToggleBtnBgColor: "#A09471",
        }
    } as ColorTheme,
    {
        title: "Basil",
        sectionDetails: {
            title: "light",
            index: 1
        },
        colorPalette: [
             "#66754C", "#8E9B6D", "#A5AB95", "#D5C7AA", "#FAF5EB"
        ],
        properties: {
            isDark: false,
            hasTwin: false,
            primaryBgColor: "#FFFCF7",
            secondaryBgColor: "#FFFCF6",
            tertiaryBgColor: "#FAF8F2",
            fgColor1: "248, 177, 187",
            fgColor2: "206, 196, 176",
            fgColor3: "206, 196, 176",
            fgColor4: "1153, 151, 254",
            menuBorderVal: "0.7px solid #E0E0E0",
            borderVal: "0.4px solid rgba(178, 178, 178, 0.46)",
            borderVal2: "1px solid rgba(79, 79, 79, 0.1)",
            shadowVal: "0px 4px 18px 0px rgba(123, 123, 123, 0.07)",
            shadowVal2: "0px 5px 9px rgba(0, 0, 0, 0.03)",
            sessionBgColor: "#CEC4B0",
            sessionBorderVal: "none",
            sessionShadowVal: "0px 2px 5px 0px rgba(0, 0, 0, 0.03)",
            activeSessionItemBorderVal: "0.4px solid #DCDCDC",
            activeSessionItemShadowVal: "none",
            textColor1: "67, 63, 50",
            textColor2: "255, 255, 255",
            profibleBorderColor: "none",
            themeHighlightBorderColor: "#8D907C",
            hoverColor: "#F9F5ED",
            tabColor: "#E8E2D6",
            tabHighlightColor: "#8D907C",
            tabHighlightBoxShadow: "none",
            tabColorTextColor: "#A9A598",
            headerElementBgColor: "#FFFCF7",
            headerElementBorderVal: "0.9px solid #d7d7d7",
            modalBgColor: "#FFFAEF",
            modalFgColor: "#FFFCF6",
            gridItemBorderVal: "0.4px solid #D5D5D5",
            gridItemShadowVal: "none",
            dividerColor: "#dedfd8",
            muiscPlayerBgColor: "#8D907C",
            musicProgressBgColor: "#45473D",
            taskViewBgColor: "#FFFCF6",
            pomBgColor: "none",
            pomIconColor: "#CEC4B0",
            pomProgressBarFgColor: "#CEC4B0",
            pomProgressBarFgBoxShadow: "none",
            pomProgressBgColor: "#f1ede5",
            pomProgressPlaybackBtnColor: "#CEC4B0",
            navMenuBgColor: "#FAF5EB",
            navIconColor: "#8D907C",
            navIconBgColor: "#EFEBDD",
            themeToggleBtnBgColor: "ECE7D8",
            iconToggleBtnBgColor: "#CAC3B0",
            highlighterToggleBtnBgColor: "#A09471",
        }
    },
    {
        title: "Azul",
        sectionDetails: {
            title: "light",
            index: 2
        },
        colorPalette: [
             "#5E73AF", "#7487BF", "#98A3C4", "#C5CAD8", "#FAF5EB"
        ],
        properties: {
            isDark: false,
            hasTwin: false,
            primaryBgColor: "#FAF5EB",
            secondaryBgColor: "#FDFAF4",
            tertiaryBgColor: "#FAF8F3",
            fgColor1: "248, 177, 187",
            fgColor2: "120, 135, 179",
            fgColor3: "206, 196, 176",
            fgColor4: "1153, 151, 254",
            menuBorderVal: "0.7px solid #E0E0E0",
            borderVal: "0.7px solid #E0E0E0",
            borderVal2: "1px solid rgba(79, 79, 79, 0.1)",
            shadowVal: "box-shadow: 0px 2px 16px 5px rgba(0, 0, 0, 0.05)",
            shadowVal2: "0px 5px 9px rgba(0, 0, 0, 0.03)",
            sessionBgColor: "#FEFBF4",
            sessionBorderVal: "0.4px solid #DEDCD7",
            sessionShadowVal: "0px 4px 8px 0px rgba(0, 0, 0, 0.03)",
            activeSessionItemBorderVal: "0.4px solid #DCDCDC",
            activeSessionItemShadowVal: "none",
            textColor1: "60, 66, 85",
            textColor2: "255, 255, 255",
            profibleBorderColor: "none",
            themeHighlightBorderColor: "#7887B3",
            hoverColor: "#F9F5EF",
            tabColor: "#F2F0EA",
            tabHighlightColor: "#8D907C",
            tabHighlightBoxShadow: "none",
            tabColorTextColor: "#CECBBF",
            headerElementBgColor: "#FFFCF7",
            headerElementBorderVal: "0.4px solid #D5D5D5",
            modalBgColor: "#FAF5EB",
            modalFgColor: "#FDFAF4",
            gridItemBorderVal: "0.4px solid #D5D5D5",
            gridItemShadowVal: "none",
            dividerColor: "#BABECC",
            muiscPlayerBgColor: "#7887B3",
            musicProgressBgColor: "#41485E",
            taskViewBgColor: "#FDFAF4",
            pomBgColor: "none",
            pomIconColor: "#7887B3",
            pomProgressBarFgColor: "#7887B3",
            pomProgressPlaybackBtnColor: "#7887B3",
            pomProgressBgColor: "#CCCCCC",
            pomProgressBarFgBoxShadow: "none",
            navMenuBgColor: "#FAF5EB",
            navIconColor: "#7887B3",
            navIconBgColor: "#F2EDE2",
            themeToggleBtnBgColor: "ECE7D8",
            iconToggleBtnBgColor: "#CAC3B0",
            highlighterToggleBtnBgColor: "#A09471"
        }
    },
    // {
    //     title: "Earth",
    //     isDark: false,
    //     colorPalette: [
    //         "#979687", "#C0BEA6", "#D0CCC2", "#E4BAA2", "#E9D3C5"
    //     ],
    //     properties: {
            
    //     }
    // },
    // {
    //     title: "Earth",
    //     isDark: false,
    //     colorPalette: [
    //         "#979687", "#C0BEA6", "#D0CCC2", "#E4BAA2", "#E9D3C5"
    //     ],
    //     properties: {

    //     }
    // },
    // {
    //     title: "Vert",
    //     isDark: false,
    //     colorPalette: [
    //          "#508D6C", "#739984", "#93B6A3", "#C1C9C0", "#FAF5EB"
    //     ],
    //     properties: {

    //     }
    // },
    // {
    //     title: "Pearl",
    //     isDark: false,
    //     colorPalette: [
    //          "#897D7D", "#A59B9B", "#D4C9C9", "#E4D8D8", "#FEFAF9"
    //     ],
    //     properties: {

    //     }
    // },
    // {
    //     title: "Dark Academia",
    //     isDark: false,
    //     colorPalette: [
    //          "#2B1409", "#4E311A", "#7D5D4B", "#9E856D", "#B19F88"
    //     ],
    //     properties: {

    //     }
    // },
]
export const imageThemes = [
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Albert_Bierstadt_-_Indians_Spear_Fishing_-_Google_Art_Project.jpg/320px-Albert_Bierstadt_-_Indians_Spear_Fishing_-_Google_Art_Project.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Albert_Bierstadt_-_Indians_Spear_Fishing_-_Google_Art_Project.jpg/2560px-Albert_Bierstadt_-_Indians_Spear_Fishing_-_Google_Art_Project.jpg",
        title: "Indians Spear Fishing",
        artist: "Albert Bierstadt"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Home_in_the_Woods_1847_Thomas_Cole.jpeg/320px-Home_in_the_Woods_1847_Thomas_Cole.jpeg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/8/89/Home_in_the_Woods_1847_Thomas_Cole.jpeg",
        title: "Home in the Woods",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Venice%2C_from_the_Porch_of_Madonna_della_Salute_MET_DP169568.jpg/320px-Venice%2C_from_the_Porch_of_Madonna_della_Salute_MET_DP169568.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/9/94/Venice%2C_from_the_Porch_of_Madonna_della_Salute_MET_DP169568.jpg",
        title: "Venice, from the Porch of Madonna della Salute",
        artist: "J.M.W. Turner"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg/320px-Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg",
        title: "Savage State",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg/320px-Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg",
        title: "The Arcadian or Pastoral State",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Cole_Thomas_The_Consummation_The_Course_of_the_Empire_1836.jpg/320px-Cole_Thomas_The_Consummation_The_Course_of_the_Empire_1836.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Cole_Thomas_The_Consummation_The_Course_of_the_Empire_1836.jpg/2560px-Cole_Thomas_The_Consummation_The_Course_of_the_Empire_1836.jpg",
        title: "Consummation",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg/320px-Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg",
        title: "Destruction",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg/320px-Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg",
        title: "Desolation",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Thomas_Cole_-_Dream_of_Arcadia_-_Google_Art_Project.jpg/320px-Thomas_Cole_-_Dream_of_Arcadia_-_Google_Art_Project.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Thomas_Cole_-_Dream_of_Arcadia_-_Google_Art_Project.jpg/2560px-Thomas_Cole_-_Dream_of_Arcadia_-_Google_Art_Project.jpg",
        title: "Dream of Arcadia",
        artist: "Thomas Cole"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Ivan_Aivazovsky_-_Ship_on_Stormy_Seas.jpg/320px-Ivan_Aivazovsky_-_Ship_on_Stormy_Seas.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Ivan_Aivazovsky_-_Ship_on_Stormy_Seas.jpg/2560px-Ivan_Aivazovsky_-_Ship_on_Stormy_Seas.jpg",
        title: "Ship on Stormy Seas",
        artist: "Ivan Aivazovsky"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/500px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg",
        title: "Water Lillies - 1906",
        artist: "Claude Monet"
    },
    {
        thumbnailImgSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Claude_Monet_-_Waterlilies_-_Google_Art_Project.jpg/307px-Claude_Monet_-_Waterlilies_-_Google_Art_Project.jpg",
        fullImgSrc: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Claude_Monet_-_Waterlilies_-_Google_Art_Project.jpg",
        title: "Waterlilies ",
        artist: "Claude Monet"
    },
    {
        thumbnailImgSrc: "https://pbs.twimg.com/media/Ea2ATpWUwAAwzvR?format=jpg&name=large",
        fullImgSrc: "https://pbs.twimg.com/media/Ea2ATpWUwAAwzvR?format=jpg&name=large",
        title: "Howl's Moving Castle",
        artist: "Studio Gibhli"
    },
    {
        thumbnailImgSrc: "https://wallpapers.com/images/hd/spirited-away-house-on-an-island-hvwghkdhxqbjzprj.webp",
        fullImgSrc: "https://wallpapers.com/images/hd/spirited-away-house-on-an-island-hvwghkdhxqbjzprj.webp",
        title: "Spirited Away",
        artist: "Studio Gibhli"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1466350380309-a09bb7347af9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1466350380309-a09bb7347af9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
        title: "Manhattan Bridge",
        artist: "Hieu Vu Minh (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1451186859696-371d9477be93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1451186859696-371d9477be93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2673&q=80",
        title: "Prince Regent National Park",
        artist: "NASA (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2711&q=80",
        title: "Space",
        artist: "NASA (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1581610186406-5f6e9f9edbc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1581610186406-5f6e9f9edbc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
        title: "Dunes",
        artist: "Daniel Olah (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1644322749926-66ac55e2913e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1644322749926-66ac55e2913e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
        title: "Blood Meridian",
        artist: "George Diama (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1538435740860-67bd8f4e8eb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1538435740860-67bd8f4e8eb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2728&q=80",
        title: "Foggy Days",
        artist: "Justin Kauffman (Unsplash)"
    },
    {
        thumbnailImgSrc: "https://images.unsplash.com/photo-1532032659282-dc3fe9336831?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=250&q=80",
        fullImgSrc: "https://images.unsplash.com/photo-1532032659282-dc3fe9336831?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
        title: "Mt Hood Under the Stars",
        artist: "Clint MCKoy (Unsplash)"
    },
]
export const ambientVideos = [
    {
        title: "Mount Shuksan",
        vidUrl: "https://www.youtube.com/watch?v=qRTVg8HHzUo",
        thumbnailSrc: "https://i.ytimg.com/vi/qRTVg8HHzUo/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCgM2LaUhy3mSWfKCzJ8ysmYiwv6Q",
        channelName: "Nature Soundscapes",
        channelImgSrc: "https://yt3.ggpht.com/SWhM3bV2uPbAMb-Qx9F3pxT5EuDCRkFtlrCC0uxvHuPigTXQDtJhhOSu8BiP2tmLfKKYb4f-Nw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Hawaii Sunrise",
        vidUrl: "https://www.youtube.com/watch?v=Fz6tH7cTB5M",
        thumbnailSrc: "https://i.ytimg.com/vi/Fz6tH7cTB5M/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCLgi8_QZZUkgV-OntxQ9J2GoJBVA",
        channelName: "Nature Soundscapes",
        channelImgSrc: "https://yt3.ggpht.com/SWhM3bV2uPbAMb-Qx9F3pxT5EuDCRkFtlrCC0uxvHuPigTXQDtJhhOSu8BiP2tmLfKKYb4f-Nw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Fall Lake",
        vidUrl: "https://www.youtube.com/watch?v=gwE5dGJ_KI0",
        thumbnailSrc: "https://i.ytimg.com/vi/gwE5dGJ_KI0/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCCfgYIiku7WbYntiz8YyuV98X13Q",
        channelName: "Nature Soundscapes",
        channelImgSrc: "https://yt3.ggpht.com/SWhM3bV2uPbAMb-Qx9F3pxT5EuDCRkFtlrCC0uxvHuPigTXQDtJhhOSu8BiP2tmLfKKYb4f-Nw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Rain in Forest",
        vidUrl: "https://www.youtube.com/watch?v=4LeyBbDBvQQ",
        thumbnailSrc: "https://i.ytimg.com/vi/4LeyBbDBvQQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBeewEvZCuZSjksjzh1C2C6NUFr4w",
        channelName: "Nature Soundscapes",
        channelImgSrc: "https://yt3.ggpht.com/SWhM3bV2uPbAMb-Qx9F3pxT5EuDCRkFtlrCC0uxvHuPigTXQDtJhhOSu8BiP2tmLfKKYb4f-Nw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Storm in Forest",
        vidUrl: "https://www.youtube.com/watch?v=XtDwPLk8EgI",
        thumbnailSrc : "https://i.ytimg.com/vi/XtDwPLk8EgI/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_g6AArgIigIMCAAQARg0IGUoXjAP&rs=AOn4CLAl8f0dt8H-4oi5xHkofaGxvHM-Ng",
        channelName: "Relaxing Ambience ASMR",
        channelImgSrc: "https://yt3.googleusercontent.com/ytc/AGIKgqMEOjK50czS5qb9_MCdoHcXfHshijmjDWblqATP=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Kapalua Beach, Maui, Hawaii",
        vidUrl: "https://www.youtube.com/watch?v=KM6K6Mz13uA",
        thumbnailSrc: "https://i.ytimg.com/vi/KM6K6Mz13uA/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBbEdwf3JixlHb5E-K_b-zGvtqH0Q",
        channelName: "Nature Soundscapes",
        channelImgSrc: "https://yt3.ggpht.com/SWhM3bV2uPbAMb-Qx9F3pxT5EuDCRkFtlrCC0uxvHuPigTXQDtJhhOSu8BiP2tmLfKKYb4f-Nw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Study Room with Rain",
        vidUrl: "https://www.youtube.com/watch?v=Jvgx5HHJ0qw",
        thumbnailSrc: "https://i.ytimg.com/vi/Jvgx5HHJ0qw/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAQDhCWJ0TlZkeHq45cZDM4kpPEiA",
        channelName: "Cosmic Report",
        channelImgSrc: "https://yt3.ggpht.com/ytc/AGIKgqOOAu-iCDlYmTm-UaNKeeqbItrYTVs8Q-BpO-BQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Reading Nook",
        vidUrl: "https://www.youtube.com/watch?v=Ol93KaRhrRM",
        thumbnailSrc: "https://i.ytimg.com/vi/Ol93KaRhrRM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDyv-qI-6kRJodCK_4zqvy6l9dYpg",
        channelName: "Cosmic Report",
        channelImgSrc: "https://yt3.ggpht.com/ytc/AGIKgqOOAu-iCDlYmTm-UaNKeeqbItrYTVs8Q-BpO-BQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Minecraft Calm Ambience",
        vidUrl: "https://www.youtube.com/watch?v=CSk9Ozs5Kpg",
        thumbnailSrc: "https://i.ytimg.com/vi/CSk9Ozs5Kpg/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBOHjSUJP5PevquL2Ms_S2MDboosg",
        channelName: "Craft Therapy",
        channelImgSrc: "https://yt3.ggpht.com/43H3Ejti7HaW9VFtGAvl1I7tDSEr7oUynApD4j9XE86H8i1-m1ZUrWBxPUU2E2Xe-Vn_kSc8=s88-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Warm hideout duing a Stormy Night",
        vidUrl: "https://www.youtube.com/watch?v=2PywKRQhK2g",
        thumbnailSrc: "https://i.ytimg.com/vi/2PywKRQhK2g/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBW69EqIfsOHOIQf8MsIdWLu6Ozhw",
        channelName: "dreamysound",
        channelImgSrc: "https://yt3.googleusercontent.com/ytc/AGIKgqO5PB-S_w-J0KXq4bVHbf0iMDi6TSs0b3TqiQT_Zg=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Raining in Osaka",
        vidUrl: "https://www.youtube.com/watch?v=q55qNEKQLG0",
        thumbnailSrc: "https://i.ytimg.com/vi/q55qNEKQLG0/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBPskftIDJ3U7gnbkcBwXcW_urnYQ",
        channelName: "Lofi Music",
        channelImgSrc: "https://yt3.ggpht.com/ytc/AGIKgqMwzOUdfgOvtBXnt0MYP4IuHQmxHd8T2Lwo4mcZ=s88-c-k-c0x00ffffff-no-rj"
    },
]