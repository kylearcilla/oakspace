import { expect, test } from "@playwright/test"
import { closeModal, closeToastMessage, expectSkeletonItems, expectToastMsg, googleLogIn, launchAuthBrowser, verifyInfiniteScoll, vertScrollElem } from "../pw-helpers"

async function openYoutube(page: any) {
    await page.goto('http://localhost:5173/home')
    await page.waitForTimeout(1000)
    await page.mouse.move(0, 20)
    await page.locator('.bar__icon-tab[data-tab-name="youtube"]').click()
}
async function clickOnLogin(page: any) {
    const consentScreen = page.waitForEvent('popup')
    await page.getByRole('button', { name: 'Log In' }).click()
    
    return await consentScreen
}
async function refreshToken(options: { page: any, btn: "playlists" | "token" }) {
    const { page, btn } = options
    await page.locator("#yt-settings--dropdown-btn").click()

    if (btn === "playlists") {
        await page.click('button:has-text("Refresh Playlists")')
    }
    else {
        await page.click('button:has-text("Refresh Token")')
    }
}
async function logoutUser(page: any) {
    await page.locator("#yt-settings--dropdown-btn").click()
    await page.locator(".yt-settings__user-profile-btns-container button").nth(1).click()
}
async function _expectToastMsg(options: {
    msg?: string, 
    page: any,
    count?: number,
    clickActionFunc?: boolean
}) {
    const { msg, page, clickActionFunc, count = 1 } = options

    if (count === 0) {
        await expectToastMsg({ count, page  })
    }
    else {
        await expectToastMsg({ 
            icon: "youtube",
            title: "Youtube",
            description: msg,
            clickActionFunc,
            count,
            page 
        })
    }

}
async function clickExpectChoosePlaylist(options: { 
    page: any,
    category: string,
    playlist: string,
    doVerify?: boolean,
    scrollCount?: number,
    dbl?: boolean
}) {
    const { page, category, playlist, scrollCount, doVerify = true, dbl = false } = options
    const listElem = page.locator(".recs__playlists-list")

    if (category === "My Playlists") {
        await page.locator(".recs__groups-list-user-pl-tab").click()
    }
    else {
        await page.locator(".recs__groups-list-rec-tab").filter({ hasText: category }).click()    
    }
    if (scrollCount) {
        for (let i = 0; i < scrollCount; i++) {
            await vertScrollElem({ elem: listElem, to: "bottom" })
            await page.waitForTimeout(800)
        }
    }

    const playlisItem = await page.locator(".recs__playlist-item-title").filter({ hasText: playlist })
    await playlisItem.dblclick()

    if (dbl) {
        await playlisItem.dblclick()
    }
    if (doVerify) {
        await expect(page.locator(".chosen-playlist__playlist-title")).toHaveText(playlist)
        await expect(page.locator('.playlist-panel__pl-details-title')).toContainText(playlist)
        await expect(page.locator('.vid-view__iframe-player')).toBeAttached()
    }
}
async function expectInvalidMedia(options: { 
    page: any,
    expectiFrameErrorView?: boolean
    expectErrorView?: boolean
    toastMessage: string
}) {
    const { page, expectiFrameErrorView = false, expectErrorView = true, toastMessage } = options

    await _expectToastMsg({ msg: toastMessage, page })

    if (expectiFrameErrorView) {
        const iframe = page.frameLocator('iframe.vid-view__iframe-player')

        await expect(iframe.locator(".ytp-error")).toBeAttached()
    }
    else if (expectErrorView) {
        await expect(page.locator(".vid-view__empty-vid-view")).toBeAttached()
    }
}
async function expectUserLoggedOut(page: any) {
    await expect(page.locator(".yt-settings__user-profile-container")).toHaveText("Log In")
    await expect(page.locator(".recs__groups-list-user-pl-tab")).not.toBeAttached()
}
async function expectUserLoggedIn(options: { username: string, email: string, page: any }) {
    const { username, email, page } = options


    await expect(page.locator(".yt-settings__user-profile-container")).toHaveText(username)

    await page.locator("#yt-settings--dropdown-btn").click()
    const dropdown = page.locator(".yt-settings__user-profile")

    await expect(dropdown).toContainText(email)
    await expect(dropdown).toContainText(username)
}
async function clickOnVideo(options: 
    { page: any, idx: number, isOpen?: boolean }
) {
    const { page, idx, isOpen = false } = options

    const iframe = page.frameLocator('iframe.vid-view__iframe-player')

    if (!isOpen) {
        await iframe.locator('.ytp-playlist-menu-button').click()
    }

    const videos = await iframe.locator('.ytp-playlist-menu-items a')
    await videos.nth(idx).click()
}
async function togglPlayiFrame(page: any) {
    await page.waitForTimeout(1000)
    const iframe = page.frameLocator('iframe.vid-view__iframe-player')
    await iframe.locator(".html5-video-player").click()
}
async function expectVideoDetails(options: { 
    page: any, 
    title: string
    playlist?: string 
    channel?: string 
}) {
    const { page, title, channel, playlist } = options

    if (title) {
        await expect(page.locator('.vid-details__title')).toContainText(title)
    }
    if (channel) {
        await expect(page.locator('.vid-details__channel-details-name')).toContainText(channel)
    }
    if (playlist) {
        await expect(page.locator('.playlist-panel__pl-details-title')).toContainText(title)
    }
}

test.describe("basic functionality", () => {
    test('not logged in + play videos', async ({ page }) => {
        await openYoutube(page)

        await expect(page.locator(".chosen-playlist")).not.toBeAttached()
        await expect(page.locator(".yt-settings__user-profile-container")).toHaveText("Log In")
        
        await clickExpectChoosePlaylist({ page, category: "Lofi / Chill", playlist: "Romantic Chill" })
        await page.waitForTimeout(800)

        await clickExpectChoosePlaylist({ page, category: "Lofi / Chill", playlist: "Anime Chill" })
        await page.waitForTimeout(800)

        await clickExpectChoosePlaylist({ page, category: "Ambience", playlist: "Weather Ambience" })
        await page.waitForTimeout(800)

        await clickExpectChoosePlaylist({ page, category: "History", playlist: "Rome" })
        await page.waitForTimeout(800)

    })
    test('first playlist played is invalid', async ({ page }) => {
        await openYoutube(page)

        /* private */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "private",
            doVerify: false
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })
    })
    test('player errors', async ({ page }) => {
        await openYoutube(page)

        /* regular  */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "Romantic Chill",
            doVerify: true
        })

        await page.waitForTimeout(800)

        /* empty */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "empty",
            doVerify: false
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })

        await page.waitForTimeout(800)

        /* private */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "private",
            doVerify: false
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })

        await page.waitForTimeout(800)

        /* unlisted */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "unlisted",
            doVerify: true
        })

        await page.waitForTimeout(800)

        /* public (1st video is invalid) */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "public w invalid first vid",
            doVerify: false
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })

        await page.waitForTimeout(800)

        /* public (2nd video is invalid) */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "public w invalid 2nd vid",
            doVerify: true
        })

        await closeModal(page)
        await page.waitForTimeout(800)

        /* click on invalid */
        await clickOnVideo({ page, idx: 1 })
        await expectInvalidMedia({ 
            expectiFrameErrorView: true,
            toastMessage: "Video couldn't be played due to privacy or embed playback restrictions.", 
            page
        })
    
        /* click on valid */
        await clickOnVideo({ page, isOpen: true, idx: 0 })

        await expectVideoDetails({ 
            title: "Lofi Chill Mix [chill lo-fi hip hop beats]",
            page,
        })
    })
    test('going through videos in playlist', async ({ page }) => {
        await openYoutube(page)

        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "Gaming Relax & Chill",
            doVerify: true
        })

        await closeModal(page)

        /* 1st */
        await expectVideoDetails({ 
            title: "Relaxing Breath of the Wild music with rain",
            page,
        })

        await page.waitForTimeout(800)

        /* 3rd */
        await clickOnVideo({ page, idx: 2 })
        await expectVideoDetails({ 
            title: "Zelda & Chill",
            page,
        })

        await page.waitForTimeout(800)

        /* 6th */
        await clickOnVideo({ page, isOpen: true, idx: 4 })
        await expectVideoDetails({ 
            title: "Relaxing Zelda Music with Campfire Ambience",
            page,
        })

        await page.waitForTimeout(800)

        /* 18th */
        await clickOnVideo({ page, isOpen: true, idx: 17 })
        await expectVideoDetails({ 
            title: "nintendo frutiger aero chill mix",
            page,
        })
    })
    test('data saved on refresh', async ({ page }) => {
        await openYoutube(page)

        /* load playlist */
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "Gaming Relax & Chill",
            doVerify: true
        })

        await closeModal(page)

        /* play -> refresh -> data is kept */
        await clickOnVideo({ page, idx: 2 })

        await expectVideoDetails({ title: "Zelda & Chill", page, })
        await page.goto('http://localhost:5173/home')
        await expectVideoDetails({ title: "Zelda & Chill", page, })
        await togglPlayiFrame(page)

        await expectVideoDetails({ title: "Zelda & Chill", page, })
        
        /* load playlist */
        await page.waitForTimeout(800)
        await openYoutube(page)

        await page.waitForTimeout(800)
        await clickExpectChoosePlaylist({ 
            page,
            category: "Lofi / Chill", 
            playlist: "Pokémon Chill",
            doVerify: true
        })

        await closeModal(page)

        /* play -> refresh -> data is kept */
        await page.waitForTimeout(800)
        await clickOnVideo({ page, idx: 4 })

        await expectVideoDetails({ title: "Relaxing Pokémon Music Compilation (Vol. 1)", page, })
        await page.goto('http://localhost:5173/home')
        await expectVideoDetails({ title: "Relaxing Pokémon Music Compilation (Vol. 1)", page, })
        await togglPlayiFrame(page)

        await expectVideoDetails({ title: "Relaxing Pokémon Music Compilation (Vol. 1)", page, })
    })
})

test.describe("logged in", () => {
    test('no associated yt account', async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        const page2 = await clickOnLogin(page)

        await googleLogIn({
            email: `${process.env.GOOGLE_USER_1_EMAIL}`,
            password: `${process.env.GOOGLE_USER_1_PASSWORD}`,
            page: page2,
        })
        await expectUserLoggedOut(page)
        
        await _expectToastMsg({ msg: "Your Google account is not associated with any YouTube account.", page })
    })
    test('successful log in -> play personal playlists -> player errors -> log out', async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)

        /* Loggin in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })
        await expectUserLoggedIn({
            username: "Napoleon Bonaparte", 
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            page
        })
        await _expectToastMsg({ msg: "Log in Successful!", page })

        /* non personal */
        await clickExpectChoosePlaylist({ 
            page, 
            category: "Lofi / Chill", 
            playlist: "Romantic Chill",
            doVerify: true
        })

        await page.waitForTimeout(800)

        /* personal (private) */
        await clickExpectChoosePlaylist({ 
            page,
            category: "My Playlists", 
            playlist: "private",
            scrollCount: 3,
            doVerify: false 
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })

        await page.waitForTimeout(800)

        /* public (1st video is invalid) */
        await clickExpectChoosePlaylist({ 
            page,
            category: "My Playlists", 
            playlist: "public w invalid first vid",
            doVerify: false 
        })
        await expectInvalidMedia({ 
            toastMessage: "Playlist couldn't be played due to privacy or embed playback restrictions.", 
            page
        })

        await page.waitForTimeout(800)

        /* public */
        await clickExpectChoosePlaylist({ 
            page, 
            category: "My Playlists", 
            playlist: "public w invalid 2nd vid",
            doVerify: true
        })

        /* logging out */
        await logoutUser(page)
        await _expectToastMsg({ msg: "Logged Out Successfully!", page })
        await expectUserLoggedOut(page)
    })
    test("expired token -> refresh token through toast", async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        await page.clock.install()

        /* log in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })
        await closeToastMessage(page)

        /* expired token  */
        await page.clock.fastForward("01:00:00")

        /* attempt to refresh -> expired notification  */
        await refreshToken({ page, btn: "playlists" })
        const consentScreen = page.waitForEvent('popup')

        await _expectToastMsg({ 
            msg: "Token has expired. Log in again to continue.", 
            page,
            clickActionFunc: true
        })
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await consentScreen,
        })
        await _expectToastMsg({ 
            msg: "Token Refreshed!", 
            page
        })

        /* attempt to refresh no notification  */
        await refreshToken({ page, btn: "playlists" })
        await _expectToastMsg({ count: 0, page })


        /* expire again */
        await page.clock.fastForward("01:00:00")
        await refreshToken({ page, btn: "playlists" })

        await _expectToastMsg({ 
            msg: "Token has expired. Log in again to continue.", 
            page
        })
    })
    test("expired token -> refresh token through dropdown", async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        await page.clock.install()

        /* log in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })
        await closeToastMessage(page)

        /* expired token  */
        await page.clock.fastForward("01:00:00")
        await refreshToken({ page, btn: "playlists" })
        await closeToastMessage(page)

        /* refresh  */
        const consentScreen = page.waitForEvent('popup')
        await refreshToken({ page, btn: "token" })

        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await consentScreen,
        })
        await _expectToastMsg({ 
            msg: "Token Refreshed!", 
            page
        })
    })
    test("expired token on infinite scroll", async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        await page.clock.install()

        /* log in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })

        await page.locator(".recs__groups-list-user-pl-tab").click()

        const playlistList = page.locator(".recs__playlists-list")

        await page.clock.fastForward("01:00:00")

        await vertScrollElem({ elem: playlistList, to: "bottom" })
    })
    test("infinite scroll", async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        await page.clock.install()

        /* log in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })

        await page.locator(".recs__groups-list-user-pl-tab").click()

        await page.waitForTimeout(1000)

        await verifyInfiniteScoll({
            page, 
            firstItemsPerRequest: ["15", "unlisted", ""],
            itemSelector: ".recs__playlist-item",
            elem: page.locator(".recs__playlists-list")
        })
    })
    test("refresh playlists", async () => {
        const page = await launchAuthBrowser()
        await openYoutube(page)
        await page.clock.install()

        /* log in */
        await googleLogIn({
            email: `${process.env.GOOGLE_USER_2_EMAIL}`,
            password: `${process.env.GOOGLE_USER_2_PASSWORD}`,
            page: await clickOnLogin(page),
        })

        await page.locator(".recs__groups-list-user-pl-tab").click()
        await refreshToken({ page, btn: "playlists" })

        await expectSkeletonItems({
            elem: page.locator(".recs__playlists-list"),
            itemSelector: ".recs__playlist-item"
        })
    })
})