import { json } from "@sveltejs/kit"
import { err } from "$lib/server/utils"
import { TEST_USER } from "$lib/mock-data-goals"
import { getUiOptions, updateUiOptions } from "$lib/server/db/general"

export async function GET() {
    const userId = TEST_USER.id
    if (!userId) {
        return err({ status: 401 })
    }

    try {
        const res = await getUiOptions(userId)
        if (!res) {
            return err({ status: 404 })
        }
        const { theme, fontStyle, barBanner, barBannerTop, barBannerShow, routineColors, routineBoxes, barView } = res

        const uiOptions: UiOptions = {
            appearance: {
                theme,
                fontStyle
            },
            bar: {
                header: {
                    show: barBannerShow,
                    img: barBanner,
                    top: barBannerTop
                },
                view: barView,
                routineColors,
                routineBoxes
            }
        }

        return json(uiOptions)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}

export async function PUT({ request }) {
    const userId = TEST_USER.id
    if (!userId) {
        return err({ status: 401 })
    }
    try {
        const data = await request.json()
        const uiOptions = await updateUiOptions(userId, data)

        return json(uiOptions)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500 })
    }
}