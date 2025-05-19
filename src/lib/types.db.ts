type HomeViewDB = {
    id: string
    headerView: "top" | "side"
    leftMarginView: "month" | "today"
    leftMargin: boolean
    bannerSrc: string | null
    bannerCenter: number | null
    iconSrc: string | null
    iconType: string | null
    showBanner: boolean
    showEntry: boolean
    showIcon: boolean
    bulletinImgSrc: string | null
    bulletinHeight: number
    bulletinHasNotes: boolean
    bulletinContentsOnHover: boolean
    bulletinNoteIdx: number
    entryId: string | null
    userId: string
  }
  
  type TextEntryDB = Omit<TextEntry, "icon"> & {
    iconType: "img" | "emoji" | null
    iconSrc: string | null
    iconSize: "small" | "big" | null
  }

  type AppearanceDB = {
    id: string
    theme: "dark" | "light" | "sand" | "terracotta" | "academia" | "gotham" | null
    fontStyle: "system" | "mono"
    userId: string
  }

  type UiOptionsDB = {
    id: string
    theme: "dark" | "light" | "sand" | "terracotta" | "academia" | "gotham"
    fontStyle: "system" | "mono"
    barBanner: string | null
    barBannerTop: number | null
    barBannerShow: boolean
    barView: "cal" | "tasks"
    routineColors: boolean
    routineBoxes: boolean
    userId: string
  }

  type BulletinDataDB = Pick<
    HomeViewDB, 
    "bulletinImgSrc" | "bulletinHeight" | "bulletinHasNotes" | "bulletinContentsOnHover" | "bulletinNoteIdx"
>