import { ResError } from "./errors"

enum ImgUploadError {
    General, Format, InvalidURL, Size, Dims, API
}
class ImgInputError extends ResError<ImgUploadError> { }

export const DEFAULT_MAX_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = [
    'jpeg',
    'jpg',
    'png',
    'gif',
    'webp',
    'avif',
    'svg'
]

export async function saveImgFile(file: File) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return "https://i.pinimg.com/originals/38/a9/16/38a916bd72bd02f0ebbb9abbad6affdc.gif"
    }
    catch(e: any) {
        console.error(e)
        throw new ImgInputError(ImgUploadError.API)
    }
}

/* verify */

/**
 * Only verify if the URL is accessible and points to an image of a correct format.
 */
export async function validateImgURL({ url, constraints }: { 
    url: string, constraints: ImgUploadConstraints
}) {
    const { formats } = constraints
    const headers = new Headers({ 
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml' 
    })

    try {
        new URL(url)
    } 
    catch {
        throw new ImgInputError(ImgUploadError.InvalidURL)
    }

    try {
        const res = await fetch(url, { method: 'HEAD', headers })
        const contentType = res.headers.get('content-type')

        verifyImgFormat(contentType, formats)
    }
    catch(error: any) {
        if (error instanceof ImgInputError) {
            throw error
        }
        else if (error instanceof TypeError) {
            await handleCorsErrorRequest(url, formats)
        }
        else {
            throw new ImgInputError(ImgUploadError.General)
        }
    }
}



/**
 * Check to see if an image first and if it's of a correct format.
 */
async function handleCorsErrorRequest(url: string, formats: string[]) {
    try {
        // check if an actual image
        const img = new Image()
        const imgPromise = new Promise((resolve, reject) => {
            img.onload = () => {
                if (img.width === 0 || img.height === 0) {
                    reject()
                }
                resolve(true)
            }
            img.onerror = () => reject(new ImgInputError(ImgUploadError.Format))
        })
        img.src = url
        await imgPromise

        // check if right format
        const type = url.toLowerCase().match(
            new RegExp(`\.(${ALLOWED_IMAGE_TYPES.join('|')})($|[?#]|$)`, 'i')
        )?.[1]

        if (type && !formats.includes(type)) {
            const message = `.${type} files not allowed.`
            throw new ImgInputError(ImgUploadError.Format, message)
        }
    } 
    catch (error: any) {
        if (error instanceof ImgInputError) {
            throw error
        }
        else {
            throw new ImgInputError(ImgUploadError.General)
        }
    }
}

export async function validateImgFile({ file, constraints } : { 
    file?: File, constraints: ImgUploadConstraints 
}) {
    try {
        const { formats, maxSizeMb, dims } = constraints
        if (!file) {
            throw new ImgInputError(ImgUploadError.General)
        }

        verifyImgFormat(file.type, formats)
        verifyMaxSize(file.size, maxSizeMb)

        if (dims) {
            const { height, width } = await getImgDims(file)
            verifyImgFileDims({ height, width, dims })
        }
    }
    catch(error: any) {
        if (error instanceof ImgInputError) {
            throw error
        }
        else {
            throw new ImgInputError(ImgUploadError.General)
        }
    }
}

function verifyImgFormat(contentType: string | null, formats: string[]) {
    if (!contentType) {
        throw new ImgInputError(ImgUploadError.Format, 'Invalid file format.')
    }

    const fileType = getFileTypeFromMime(contentType)
    const allowed = isAllowedFileType(contentType, formats)

    if (!allowed) {
        const message = `.${fileType} files not allowed.`
        throw new ImgInputError(ImgUploadError.Format, message)
    }
}

function verifyMaxSize(sizeBytes: number, maxSizeMb: number) {
    if (sizeBytes > mbToBytes(maxSizeMb!)) {
        const fileSize = formatFileSize(sizeBytes)
        const message = `File size too large: ${fileSize} (max ${maxSizeMb} MB)`

        throw new ImgInputError(ImgUploadError.Size, message)
    }
}

function verifyImgFileDims({ height, width, dims}: {
    height: number
    width: number
    dims?: DimConstraints
}) {
    if (dims?.height) {
        const { max, min } = dims.height

        if (min !== undefined && height < min) {
            throw new ImgInputError(ImgUploadError.Dims, `Height too small: ${height}px (at least ${min}px).`)
        }
        if (max !== undefined && height > max) {
            throw new ImgInputError(ImgUploadError.Dims, `Height too large: ${height}px (at most ${max}px).`)
        }
    }
    if (dims?.width) {
        const { max, min } = dims.width
        if (min !== undefined && width < min) {
            throw new ImgInputError(ImgUploadError.Dims, `Width too small: ${width}px (at least ${min}px).`)
        }
        if (max !== undefined && width > max) {
            throw new ImgInputError(ImgUploadError.Dims, `Width too large: ${width}px (at most ${max}px).`)
        }
    }
}

export function getImgUploadErrorMsg(error: ImgInputError) {
    const { code, message } = error

    if (message) return message

    if (code === ImgUploadError.InvalidURL) {
        return "Invalid URL or media source."
    }
    else if (code === ImgUploadError.Format) {
        return "Unsupported file format."
    }
    else if (code === ImgUploadError.Size) {
        return "File size too large."
    }
    else if (code === ImgUploadError.Dims) {
        return "Invalid file dimensions."
    }
    else if (code === ImgUploadError.API) {
        return "Error uploading file, please try again later."
    }
    else {
        return "Error occurred. Please try again later."
    }
}

/* img details */

async function getImgDims(src: Blob | File): Promise<{ height: number, width: number }> {
    const bitmap = await createImageBitmap(src)
    try {
        const { height, width } = bitmap
        return { height, width }
    } 
    catch (error) {
        throw new Error('Unable to load image')
    }
    finally {
        bitmap.close()
    }
}

function mbToBytes(mb: number) {
    return mb * 1024 * 1024;
}

/* formatting  */

export function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} bytes`
    } 
    else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`
    } 
    else if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`
    } 
    else {
        return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
}

export function getFileTypeFromMime(mimeType: string) {
    return mimeType.split('/')[1]?.replace('+xml', '') || ''
}

export function isAllowedFileType(mimeType: string | null, formats: string[]) {
    if (!mimeType) {
        return false
    }
    const fileType = getFileTypeFromMime(mimeType)
    return formats.includes(fileType)
}