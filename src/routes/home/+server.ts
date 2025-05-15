import { json } from '@sveltejs/kit'
import { getHomeViewData, updateHomeViewData } from "$lib/server/db/general"
import { TEST_USER } from "$lib/mock-data-goals"
import { err } from '$lib/server/utils.js'

// GET /home
export async function GET({ locals }) {
  const userId = TEST_USER.id

  if (!userId) {
    return err({ status: 401 })
  }

  try {
    const res = await getHomeViewData(userId)
    if (!res) {
        console.error("No home view data found")
        return err({ status: 404 })
    }

    const { homeView, notes } = res
    const { showBanner, bannerSrc, bannerCenter } = homeView
    const { showEntry, headerView, iconSrc, iconType, showIcon } = homeView
    const { bulletinImgSrc, bulletinHeight, bulletinHasNotes, bulletinContentsOnHover, bulletinNoteIdx } = homeView
    const { leftMargin, leftMarginView } = homeView

    const home: BaseView = {
        banner: bannerSrc ? {
            show: showBanner,
            img: { src: bannerSrc, center: bannerCenter ?? 50 }
        } : null,
        header: {
            showEntry,
            entry: null,
            pos: headerView as "top" | "side",
            icon: iconSrc ? 
                { 
                    src: iconSrc, 
                    type: iconType as IconType,
                    show: showIcon
                } : null
        },
        leftMargin: leftMargin,
        leftMarginView: leftMarginView,
        bulletin: {
            imgSrc: bulletinImgSrc ?? "",
            hasNotes: bulletinHasNotes,
            contentsOnHover: bulletinContentsOnHover,
            noteIdx: bulletinNoteIdx,
            notes,
            height: bulletinHeight
        }
    }
  
    return json(home)
  } 
  catch (error) {
    console.error(error)
    return err({ status: 500 })
  }
}

// PUT /home
export async function PUT({ request, locals }) {
  const userId = TEST_USER.id

  if (!userId) {
    return err({ status: 401 })
  }
  try {
    const data = await request.json()
    await updateHomeViewData(userId, data)
    return json({ success: true })
  } 
  catch (error) {
    console.error(error)
    return err({ status: 500 })
  }
}
