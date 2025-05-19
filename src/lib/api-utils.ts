import { PUBLIC_BASE_URL } from '$env/static/public'

export function _url({ path, params }: {
    path: string,
    params: Record<string, string | undefined>
}) {
    const filteredParams = Object.fromEntries(
        Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value as string])
    )

    const url = new URL(path, PUBLIC_BASE_URL)
    url.search = new URLSearchParams(filteredParams).toString()

    return url.toString()
}