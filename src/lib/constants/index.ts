/* general */

export const DAY_IDX_QUOTE_REFRESH = 1 // on mondays

export const DEFAUL_EMOJIS = [
    "🌱", "🌷", "🌞", "🌙", "👏", "🔖", "🏕️", "⛰️", "💵"
]

export const MAX_FUTURE_YEAR = 1
export const MAX_PAST_YEAR = 2

export const MAX_TODOS_DEPTH = 3

/* text entries  */
export const TEXT_SAVE_DELAY_MS = 800
export const ENTRY_MAX_LENGTH = 2000
export const BIG_MAX_SIZE = 110
export const SMALL_MAX_SIZE = 80

// initial period request, get +-3 periods from current
export const INITIAL_PERIOD_REACH_ENTRY = 3

// moving between periods, next period will be empty so requeset for the next x periods
export const NEXT_PERIOD_REACH_ENTRY = 3


/* overview */
export const GOALS_LIST_MAX = 3
export const PHOTO_OFFSETS = [
    { x: -8, y: -4, tilt: 4  },
    { x: -5, y: -15, tilt: 4  },
    { x: -10, y: -12, tilt: -5  },
    { x: -6, y: -14, tilt: 3  },
    { x: -7, y: -9, tilt: -2  },
    { x: -9, y: -13, tilt: 5  },
    { x: -5, y: -12, tilt: -3  },
    { x: -12, y: -8, tilt: -6  }
]


/* notes */

export const MAX_NOTE_LENGTH = 300
export const MAX_NOTES = 30

/* sessions */

export const MAX_SESSION_TITLE = 100

/* error */

export const DEFAUL_ERR_MESSAGE = "There was an error. Some changes may not be saved."

/* settings */

export const FONT_COPY = "zebra"

export const MAX_USER_NAME_LENGTH = 100

export const USER_DESCRIPTIONS = [
    "High School Student",
    "College Student",
    "Med Student",
    "Artist",
    "Entrepreneur",
    "Human",
    "Engineer"
]

/* local storage */

export const QUOTE_DATE_KEY = "quote-date"
export const QUOTE_KEY = "quote"