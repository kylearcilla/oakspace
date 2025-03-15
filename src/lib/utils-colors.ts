export const COLOR_SWATCHES = [
  {
    primary: "#ff8e8e",
    light1: "157, 100, 100",
    light2: "255, 214, 214",
    light3: "221, 168, 168",
    dark1: "247, 202, 202",
    dark2: "54, 34, 34",
    dark3: "88, 66, 66",
    dark4: "40, 26, 26",
    name: "red"
  },
  {
    primary: "#FBA490",
    light1: "149, 106, 100",
    light2: "247, 222, 202",
    light3: "217, 173, 167",
    dark1: "245, 209, 197",
    dark2: "58, 40, 34",
    dark3: "99, 75, 69",
    dark4: "42, 30, 28",
    name: "terracotta"
  },
  {
    primary: "#FFC898",
    light1: "154, 112, 75",
    light2: "248, 227, 191", 
    light3: "217, 184, 155",
    dark1: "255, 224, 206",
    dark2: "48, 40, 36",
    dark3: "95, 79, 70",
    dark4: "47, 37, 31",
    name: "orange"
  },
  {
    primary: "#FCDE93",
    light1: "139, 114, 66",
    light2: "255, 246, 200",
    light3: "228, 203, 155",
    dark1: "251, 240, 214",
    dark2: "47, 41, 26",
    dark3: "91, 83, 62",
    dark4: "39, 33, 22",
    name: "yellow"
  },
  {
    primary: "#E6FD8A",
    light1: "86, 110, 66",
    light2: "239, 238, 201",
    light3: "174, 186, 157",
    dark1: "235, 255, 217",
    dark2: "40, 44, 25",
    dark3: "82, 86, 58",
    dark4: "33, 36, 22",
    name: "pear"
  },
  {
    primary: "#d7e5aa",
    light1: "72, 111, 70",
    light2: "231, 248, 200",
    light3: "160, 204, 157",
    dark1: "210, 229, 206",
    dark2: "28, 36, 25",
    dark3: "78, 97, 74",
    dark4: "29, 37, 27",
    name: "green"
  },
  {
    primary: "#D4FFFA",
    light1: "72, 99, 93",
    light2: "219, 238, 236",
    light3: "156, 183, 177",
    dark1: "200, 249, 243",
    dark2: "35, 45, 56",
    dark3: "49, 77, 73",
    dark4: "27, 33, 32",
    name: "teal"
  },
  {
    primary: "#B2E4FF",
    light1: "74, 87, 101",
    light2: "218, 229, 241",
    light3: "142, 163, 185",
    dark1: "192, 219, 252",
    dark2: "36, 42, 54",
    dark3: "68, 83, 95",
    dark4: "29, 31, 38",
    name: "blue"
  },
  {
    primary: "#A5BDFE",
    light1: "86, 95, 109",
    light2: "209, 221, 248",
    light3: "141, 158, 189",
    dark1: "191, 215, 255",
    dark2: "27, 31, 42",
    dark3: "65, 80, 108",
    dark4: "30, 30, 48",
    name: "indigo"
  },
  {
    primary: "#CEC1FF",
    light1: "78, 79, 102",
    light2: "230, 227, 245",
    light3: "171, 172, 212",
    dark1: "211, 192, 242",
    dark2: "36, 37, 60",
    dark3: "80, 68, 98",
    dark4: "37, 29, 41",
    name: "purple"
  },
  {
    primary: "#DDBAFF",
    light1: "99, 91, 108",
    light2: "238, 227, 243",
    light3: "194, 178, 213",
    dark1: "232, 208, 255",
    dark2: "45, 35, 42",
    dark3: "93, 79, 107",
    dark4: "40, 34, 43",
    name: "magenta"
  },
  {
    primary: "#FD8AB9",
    light1: "154, 97, 124",
    light2: "249, 218, 224",
    light3: "220, 179, 198",
    dark1: "255, 198, 233",
    dark2: "55, 35, 47",
    dark3: "95, 72, 89",
    dark4: "43, 28, 38",
    name: "pink"
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

export const STATUS_COLORS = {
  RED: {
    light: { color1: COLOR_SWATCHES[0].light1, color2: COLOR_SWATCHES[0].light3 },
    dark: { color1: COLOR_SWATCHES[0].dark1, color2: COLOR_SWATCHES[0].dark3 }
  },
  YELLOW: {
    light: { color1: COLOR_SWATCHES[3].light1, color2: COLOR_SWATCHES[3].light3 },
    dark: { color1: COLOR_SWATCHES[3].dark1, color2: COLOR_SWATCHES[3].dark3 }
  },
  GREEN: {
    light: { color1: COLOR_SWATCHES[5].light1, color2: COLOR_SWATCHES[5].light3 },
    dark: { color1: COLOR_SWATCHES[5].dark1, color2: COLOR_SWATCHES[5].dark3 }
  }
}

/**
 * Get the trio of color properties based on the theme
 * @param    color      - The color object containing light and dark properties.
 * @param    doGetLight - Boolean value indicating whether the theme is light or dark.
 * 
 * @returns  An tuple containing a color's light or dark color trio.
 */
export function getColorTrio(color: Color, doGetLight: boolean): [string, string, string] {

  if (doGetLight) {
    return [color.light1, color.light2, color.light3]
  }
  else {
    return [color.dark1, color.dark4, color.dark3]
  }
}

export function getSwatchColors({ color, light, contrast = true }: { 
  color: Color
  light: boolean 
  contrast?: boolean
}) {

  if (light) {
    return [color.light1, color.light2, color.light3]
  }
  else {
    return [color.dark1, contrast ? color.dark2 : color.dark4, color.dark3]
  }
}

/**
 * Given a hexadecimal color find the closest color from app pre-drefined app colors.
 * 
 * @param    hexColor - The hexadecimal color string to match (e.g., "9FC6E7").
 * @returns  The color swatch object that is closest to the given color, or null if no swatch is found.
 */
export function findClosestColorSwatch(hexColor: string): Color {
  const rgbColor = hexToRgb({ hex: hexColor })
  const labColor = rgbToLab(rgbColor as number[])
  
  let closestColor = null
  let minDistance = Infinity

  for (const color of COLOR_SWATCHES) {
    const primaryRgb = hexToRgb({ hex: color.primary, format: "arr" })
    const primaryLab = rgbToLab(primaryRgb as number[])
    const distance = getDeltaE(labColor, primaryLab)

    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }
  return closestColor!
}

export function hexToRgb({ hex, format = "arr" }: { 
  hex: string, format?: "str" | "arr" 
}) {
  hex = hex.replace(/^#/, '')
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return format === "str" ? `${r}, ${g}, ${b}` : [r, g, b]
}

/**
 * Convert RGB to LAB color space
 */
function rgbToLab(rgb: number[]): number[] {
  // Convert RGB to XYZ
  let r = rgb[0] / 255
  let g = rgb[1] / 255
  let b = rgb[2] / 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  r *= 100
  g *= 100
  b *= 100

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505

  // Convert XYZ to LAB
  const xn = 95.047
  const yn = 100.0
  const zn = 108.883

  const xx = x / xn
  const yy = y / yn
  const zz = z / zn

  const fx = xx > 0.008856 ? Math.pow(xx, 1/3) : (7.787 * xx) + 16/116
  const fy = yy > 0.008856 ? Math.pow(yy, 1/3) : (7.787 * yy) + 16/116
  const fz = zz > 0.008856 ? Math.pow(zz, 1/3) : (7.787 * zz) + 16/116

  const l = (116 * fy) - 16
  const a = 500 * (fx - fy)
  const bb = 200 * (fy - fz)

  return [l, a, bb]
}

/**
 * Calculate color difference in LAB space
 */
function getDeltaE(labA: number[], labB: number[]): number {
  const [l1, a1, b1] = labA
  const [l2, a2, b2] = labB
  
  const deltaL = l2 - l1
  const deltaA = a2 - a1
  const deltaB = b2 - b1

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}