export const COLOR_SWATCHES = [
  {
    primary: "#FF9292",
    light1: "157, 100, 100",
    light2: "255, 214, 214",
    light3: "221, 168, 168",
    dark1: "252, 145, 145",
    dark2: "41, 26, 26",
    dark3: "96, 66, 66",
    name: "Red"
  },
  {
    primary: "#FBA490",
    light1: "149, 106, 100",
    light2: "247, 215, 202",
    light3: "217, 173, 167",
    dark1: "251, 163, 144",
    dark2: "39, 27, 25",
    dark3: "102, 80, 75",
    name: "Terracotta"
  },
  {
    primary: "#FFC898",
    light1: "154, 112, 75",
    light2: "248, 227, 191", 
    light3: "217, 184, 155",
    dark1: "255, 193, 152",
    dark2: "35, 26, 21",
    dark3: "107, 76, 55",
    name: "Orange"
  },
  {
    primary: "#FCDE93",
    light1: "139, 114, 66",
    light2: "255, 246, 200",
    light3: "228, 203, 155",
    dark1: "252, 222, 147",
    dark2: "43, 36, 27",
    dark3: "100, 86, 51",
    name: "Yellow"
  },
  {
    primary: "#E6FD8A",
    light1: "86, 110, 66",
    light2: "220, 235, 177",
    light3: "175, 198, 156",
    dark1: "245, 255, 205",
    dark2: "39, 39, 28",
    dark3: "81, 85, 66",
    name: "Pear"
  },
  {
    primary: "#DCFFBB",
    light1: "72, 111, 70",
    light2: "201, 236, 185",
    light3: "160, 204, 157",
    dark1: "220, 255, 187",
    dark2: "28, 36, 25",
    dark3: "69, 88, 52",
    name: "Green"
  },
  {
    primary: "#D4FFFA",
    light1: "72, 99, 93",
    light2: "208, 232, 230",
    light3: "156, 183, 177",
    dark1: "200, 249, 243",
    dark2: "24, 35, 30",
    dark3: "58, 109, 102",
    name: "Teal"
  },
  {
    primary: "#B2E4FF",
    light1: "74, 87, 101",
    light2: "218, 229, 241",
    light3: "142, 163, 185",
    dark1: "192, 233, 251",
    dark2: "21, 30, 35",
    dark3: "53, 80, 92",
    name: "Azure"
  },
  {
    primary: "#A5BDFE",
    light1: "86, 95, 109",
    light2: "209, 221, 248",
    light3: "141, 158, 189",
    dark1: "191, 215, 255",
    dark2: "27, 31, 42",
    dark3: "54, 70, 99",
    name: "Blue"
  },
  {
    primary: "#B1A0F7",
    light1: "78, 79, 102",
    light2: "224, 218, 253",
    light3: "151, 154, 204",
    dark1: "177, 180, 255",
    dark2: "33, 33, 33",
    dark3: "61, 63, 118",
    name: "Purple"
  },
  {
    primary: "#E8D0FF",
    light1: "99, 91, 108",
    light2: "239, 212, 249",
    light3: "187, 168, 209",
    dark1: "232, 208, 255",
    dark2: "45, 35, 42",
    dark3: "93, 79, 107",
    name: "Magenta"
  },
  {
    primary: "#f4a3c4",
    light1: "154, 97, 124",
    light2: "249, 218, 224",
    light3: "220, 179, 198",
    dark1: "255, 164, 176",
    dark2: "41, 27, 33",
    dark3: "87, 55, 59",
    name: "Pink"
  },
]

export const DARK_COLOR_PROGRESS = {
  max: 243, min: 125,
  gVal: 245, bVal: 125
}

export const LIGHT_COLOR_PROGRESS = {
  max: 212, min: 145,
  gVal: 212, bVal: 145
}
  
export function getColorByName(name: string) {
  return COLOR_SWATCHES.find(color => color.name === name)
}

/**
 * Get the trio of color properties based on the theme
 * @param    color      - The color object containing light and dark properties.
 * @param    doGetLight - Boolean value indicating whether the theme is light or dark.
 * 
 * @returns  An tuple containing a color's light or dark color trio.
 */
export function getColorTrio(color: Color, doGetLight: boolean): [string, string, string] {
  const colorTrio = doGetLight ? [color.light1, color.light2, color.light3] : [color.dark1, color.dark2, color.dark3]

  return colorTrio as [string, string, string]
}

/**
 * Given a hexadecimal color find the closest color from app pre-drefined app colors.
 * 
 * @param    hexColor - The hexadecimal color string to match (e.g., "9FC6E7").
 * @returns  The color swatch object that is closest to the given color, or null if no swatch is found.
 */
export function findClosestColorSwatch(hexColor: string): Color {
  const rgbColor = hexToRgb(hexColor)
  let closestColor = null
  let minDistance = Infinity

  for (const color of COLOR_SWATCHES) {
    const primaryRgb = color.primary.split(", ").map(Number)
    const distance = getEuclideanDistance(rgbColor, primaryRgb)

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor!
}

function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, '')
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return [r, g, b]
}

/**
 * Calculates the Euclidean distance between two RGB colors.
 * 
 * @param rgb1 The first RGB color as an array [r, g, b].
 * @param rgb2 The second RGB color as an array [r, g, b].
 * @returns    The Euclidean distance between the two colors.
 * 
 */
function getEuclideanDistance(rgb1: number[], rgb2: number[]) {
  const rDiff = rgb1[0] - rgb2[0]
  const gDiff = rgb1[1] - rgb2[1]
  const bDiff = rgb1[2] - rgb2[2]

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}