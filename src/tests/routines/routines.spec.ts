import { expect, test } from "@playwright/test"

test.describe("Routine blocks are rendered properly", () => {

    test('weekly routines rendered properly', async ({ page }) => {
        await page.goto("/home/routines/weekly")

        // page renders properly
        await expect(page.getByRole('heading', { name: 'Routines' })).toBeVisible()

        
    })
})