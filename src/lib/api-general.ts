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

export async function updateUser(data: Partial<User>) {
    const userId = TEST_USER.id
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

export async function updateHome(data: Partial<HomeViewDB>) {
    if (data.bannerSrc === null) {
        data.bannerCenter = null
        data.showBanner = false
    }
    const { response, error } = await _fetch(`/home`, {
        method: "PUT",
        body: JSON.stringify(data)
    })
    if (error) {
        throw new Error(error.message)
    }

    return response
}

/* ui options */

export async function getUiOptions(): Promise<UiOptions> {
    const userid = TEST_USER.id
    const { response, error } = await _fetch(`/home/ui/${userid}`, {
        method: "GET"
    })
    if (error) {
        throw new Error(error.message)
    }
    return response
}

export async function updateUiOptions(data: Partial<UiOptionsDB>) {
    const userid = TEST_USER.id
    const { response, error } = await _fetch(`/home/ui/${userid}`, {
        method: "PUT",
        body: JSON.stringify(data)
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