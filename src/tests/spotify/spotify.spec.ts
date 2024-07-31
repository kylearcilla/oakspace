import { expect, test, chromium } from "@playwright/test"

async function openMusic(page: any) {
    await page.goto('http://localhost:5173/home')
    await page.waitForTimeout(1000)
    await page.mouse.move(0, 20)
    await page.locator('.bar__icon-tab[data-tab-name="music"]').click()
}
async function login() {
    
}
async function logout() {

}
test.describe("login functionality", () => {

})