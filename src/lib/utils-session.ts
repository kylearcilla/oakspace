import { SessionManager } from "./session-manager"


export function continueFocusSession() {
    new SessionManager()
}

export function didInitSession() {
    return localStorage.getItem("session") != null
}

export function getFocusTime() {
    const data = localStorage.getItem("focus-time")
    const today = new Date().toISOString().split("T")[0]
    
    if (data) {
        const { elapsed, dateStr } = JSON.parse(data)

        if (dateStr === today) {
            return parseInt(elapsed)
        }
        else {
            localStorage.setItem("focus-time", JSON.stringify({ elapsed: 0, dateStr: today }))
            return 0
        }
    }
    else {
        localStorage.setItem("focus-time", JSON.stringify({ elapsed: 0, dateStr: today }))
        return 0
    }
}

export function incrementFocusTime(focus: number) {
    const data = localStorage.getItem("focus-time")
    const today = new Date().toISOString().split("T")[0]

    if (data) {
        const { elapsed, dateStr } = JSON.parse(data)

        if (dateStr === today) {
            localStorage.setItem("focus-time", JSON.stringify({ elapsed: elapsed + focus, dateStr: today }))
        }
        else {
            localStorage.setItem("focus-time", JSON.stringify({ elapsed: focus, dateStr: today }))
        }
    }
    else {
        localStorage.setItem("focus-time", JSON.stringify({ elapsed: focus, dateStr: today }))
    }
}

export const resultText = {
    bad: [
        "Don't settle for less than your best. Keep working towards getting better!",
        "You can do better!",
    ],
    good: [
        "Success is the sum of small efforts, repeated daily. You're proving it true!",
        "Consistency is the key to success, and you're nailing it!",
        "Your commitment to yourself is really admirable. Keep up the good work!",
        "Your daily dedication is paving the path to your dreams. Keep walking it.",
        "Wow! You are a productivity god!",
        "Holy guacamole you're insane! Great work!",
    ],
}

export const resultImg = {
    bad: [
        "https://i.pinimg.com/originals/e9/b2/7c/e9b27cbccc81bcc7c9c12914c7a01d93.gif",
    ],
    good: [
        "https://media.tenor.com/r2_RSuOMIwIAAAAC/whisper-of-the-heart-cartoon.gif",
        "https://i.pinimg.com/originals/2c/45/fa/2c45fa7b020a0889c6a06298fbbbc6d1.gif",
        "https://media.tenor.com/BcUevwfD6zUAAAAC/the-wind-rises-writing.gif",
    ]
}