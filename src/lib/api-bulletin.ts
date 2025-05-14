import { _fetch } from './utils-general'
import { TEST_USER } from './mock-data-goals'

type BulletinData = {
    imgSrc: string | null
    height: number
    hasNotes: boolean
    contentsOnHover: boolean
    noteIdx: number
}

type BulletinDataDB = {
    bulletinImgSrc: string | null
    bulletinHeight: number
    bulletinHasNotes: boolean
    bulletinContentsOnHover: boolean
    bulletinNoteIdx: number
}

export async function createNote({ idx, text }: { idx: number, text: string }) {
    const userId = TEST_USER.id
    const { response, error } =  await _fetch('/home/bulletin', {
        method: 'POST',
        body: JSON.stringify({ idx, text, userId })
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}

export async function deleteNote({ noteId, idx }: { noteId: string, idx: number }) {
    const { response, error } =  await _fetch(`/home/bulletin/${noteId}`, { 
        method: 'DELETE', 
        body: JSON.stringify({ idx, userId: TEST_USER.id })
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}

export async function updateNote(note: { id: string, text: string }) {
    const { response, error } =  await _fetch(`/home/bulletin/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: note.text })
    })

    if (error) {
        throw new Error(error.message)
    }

    return response
}

export async function updateBulletin(data: Partial<BulletinData>) {
    const dbData: Partial<BulletinDataDB> = {
        bulletinImgSrc: data.imgSrc,
        bulletinHeight: data.height,
        bulletinHasNotes: data.hasNotes,
        bulletinContentsOnHover: data.contentsOnHover,
        bulletinNoteIdx: data.noteIdx
    }
    const { response, error } = await _fetch("/home", {
        method: 'PUT',
        body: JSON.stringify(dbData)
    })

    if (error) {
        throw new Error(error.message)
    }

    return { response }
}

