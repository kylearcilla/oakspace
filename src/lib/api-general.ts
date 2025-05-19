import { _fetch } from "./utils-general"
import { TEST_USER } from "./mock-data-goals"

/* user */

export async function getUser(id: string) {
    const { response, error } = await _fetch(`/home/users/${id}`, {
        method: "GET"
    })
    if (error) {
        throw new Error(error.message)
    }
    return response
}

export async function updateUser(data: Partial<Omit<User, "id">>) {
    const userId = TEST_USER.id
    const _data: any = data
    if (_data.id) {
        throw new Error("Ids not allowed to be updated")
    }
    const { response, error } = await _fetch(`/home/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data)
    })
    if (error) {
        throw new Error(error.message)
    }

    return response
}

/* home */

export async function updateHome(data: Partial<Omit<HomeViewDB, "entryId" | "userId" | "id">>) {
    const _data: any = data
    if (_data.id || _data.userId || _data.entryId) {
        throw new Error("Ids not allowed to be updated")
    }
    if (_data.bannerSrc === null) {
        _data.bannerCenter = null
        _data.showBanner = false
    }
    const { response, error } = await _fetch(`/home`, {
        method: "PUT", body: JSON.stringify(data)
    })
    if (error) {
        throw new Error(error.message)
    }

    return response
}

/* ui options */

export async function getUiOptions(): Promise<UiOptions> {
    const userid = TEST_USER.id
    const { response, error } = await _fetch("/home/ui", {
        method: "GET"
    })
    if (error) {
        throw new Error(error.message)
    }
    return response
}

export async function updateUiOptions(data: Partial<Omit<UiOptionsDB, "userId" | "id">>) {
    const userid = TEST_USER.id
    const _data: any = data

    if (_data.id || _data.userId) {
        throw new Error("Ids not allowed to be updated")
    }

    const { response, error } = await _fetch("/home/ui", {
        method: "PUT", body: JSON.stringify(data)
    })
    if (error) {
        throw new Error(error.message)
    }
    return response
}

/* misc */

export async function toggleLike(id: string) {
    const { response, error } = await _fetch(`/home/quotes/likes/${id}`, {
        method: "POST"
    })
    if (error) {
        throw new Error(error.message)
    }

    return response
}