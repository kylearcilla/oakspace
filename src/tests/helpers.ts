type GenerateStringOptions = {
    length: number;
    includeEmojis?: boolean;
    leadingSpace?: number;
    trailingSpace?: number;
    exclude?: string[]
}

export function looseEqualTo(x: number, y: number, diff = 5) {
    return Math.abs(x - y) <= diff
}

export function neg(num: number) {
    return -1 * (num)
}
  
export function generateRandomString(options: GenerateStringOptions): string {
    const { length, includeEmojis = false, leadingSpace = 0, trailingSpace = 0, exclude = [] } = options
    const emojiRange = [128512, 128591]
    const startAscii = 33
    const endAscii = 126
    const asciiRange = endAscii - startAscii + 1
    let result = ''

    const getRandomChar = (force: "alpha-num" | "emoji" | null = null) => {
        if (includeEmojis && (force === "emoji" || (force !== "alpha-num" && Math.random() < 0.1))) {
            const randomEmoji = Math.floor(Math.random() * (emojiRange[1] - emojiRange[0] + 1)) + emojiRange[0]
            return String.fromCodePoint(randomEmoji)
        } 
        else {
            let randomAscii

            do {
                randomAscii = Math.floor(Math.random() * asciiRange) + startAscii
            } 
            while (exclude.includes(String.fromCharCode(randomAscii)))

            return String.fromCharCode(randomAscii)
        }
    };

    for (let i = 0; i < length; i++) {
        result += getRandomChar((length - 1 - i) < 1 ? "alpha-num" : null)
    }

    const leadingSpaces = ' '.repeat(leadingSpace)
    const trailingSpaces = ' '.repeat(trailingSpace)
    let res = `${leadingSpaces}${result}${trailingSpaces}`

    if (res.length != length) {
        res = res.substring(0, length)
        let randomAscii;
        
        do {
            randomAscii = Math.floor(Math.random() * asciiRange) + startAscii
        } 
        while (exclude.includes(String.fromCharCode(randomAscii)))
            
        return res.slice(0, -1) + String.fromCharCode(randomAscii)
    } else {
        return res;
    }
}

export function encodeHTMLEntities(str: string) {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    
    return str.split('').map(ch => map[ch] || ch).join('')
}
