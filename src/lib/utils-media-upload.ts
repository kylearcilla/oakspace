import { ImgUploadError } from "./enums"
import { ResError } from "./errors"

export class ImgInputError extends ResError<ImgUploadError> { }

/**
 * Validates image url input from user.
 * Throws an error if there is one.
 * 
 * @param imgUrl   User input string
 */
export async function validateUserImgURLInput(options: {
    url: string,
    constraints: ImgUploadConstraints
}) {
    try {
        const { url, constraints } = options
        const res = await fetch(url, { mode: 'cors' })

        if (!res.ok) {
            throw new ImgInputError(ImgUploadError.InvalidURL)
        }

        /* verify size */
        const contentLengthHeader = res.headers.get("Content-Length")
        if (!contentLengthHeader) {
            throw new ImgInputError(ImgUploadError.General)
        }

        const sizeBtyes = parseInt(contentLengthHeader, 10)
        verifyImgFileSize(sizeBtyes, constraints.maxMbSize!)

        /* verify dimensions */
        const { height, width } = await getUrlImgDimensions(await res.blob())

        verifyImgFileDims({
            height, width, constraints
        })
    }
    catch(error: any) {
        console.error(error)

        if (error instanceof ImgInputError) {
            throw error
        }
        else if (error instanceof TypeError) {
            throw new ImgInputError(ImgUploadError.InvalidURL)
        }
        else {
            throw new ImgInputError(ImgUploadError.General)
        }
    }
}

/**
 * Validates image file input from user.
 * Throws an error if there is one.
 * 
 * @param imgUrl   User input string
 */
export async function validateUserImgFileInput(options: {
    file: File,
    constraints: ImgUploadConstraints
}) {
    const { file, constraints } = options

    try {
        if (!file) {
            throw new ImgInputError(ImgUploadError.Format)
        }

        /* verify size */
        verifyImgFileSize(file.size, constraints.maxMbSize!)

        /* verify dimensions */
        const { height, width } = await getFileImgDimensions(file)
        verifyImgFileDims({
            height, width, constraints
        })
    }
    catch(error: any) {
        console.error(error)

        if (error instanceof ImgInputError) {
            throw error
        }
        else {
            throw new ImgInputError(ImgUploadError.General)
        }
    }
}

/**
 * Get error message from img input error code.
 * 
 * @param error   Input error code.
 * @returns       String messsage 
 */
export function getImgUploadErrorMsg(error: ImgInputError) {
    const { code, message } = error

    if (code === ImgUploadError.InvalidURL) {
        return message || "Invalid URL or media source."
    }
    else if (code === ImgUploadError.Format) {
        return message || "Uploaded file is of an invalid format"
    }
    else if (code === ImgUploadError.Size) {
        return message || "Invalid File Dimensions."
    }
    else {
        return message || "There was error uploading the file, try again."
    }
}

/**
 * Verify the user's uploaded image's total size.
 * 
 * @param sizeBytes  img's size bytes
 * @param maxMbSize  max allowable size
 */
function verifyImgFileSize(sizeBytes: number, maxMbSize: number) {
    if (sizeBytes > mbToBytes(maxMbSize!)) {
        throw new ImgInputError(ImgUploadError.Size)
    }
}

/**
 * Verify the user's uploaded image's dimensions
 * Returns descriptive error message if image is invalid.
 * 
 * @param options 
 */
function verifyImgFileDims(options: {
    height: number,
    width: number,
    constraints: ImgUploadConstraints
}) {
    const { height, width, constraints: { dims } } = options

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

/**
 * Get the image's size and width from GET request
 * 
 * @param blob   Image blob from GET request
 * @returns      Height and width.
 */
async function getUrlImgDimensions(imageBlob: Blob): Promise<{ height: number, width: number }> {
    const img = new Image()
    const imgURL = URL.createObjectURL(imageBlob)

    return new Promise((resolve, reject) => {
        img.onload = () => {
            const { height, width } = img
            URL.revokeObjectURL(imgURL)
            resolve({ height, width })
        };

        img.onerror = () => {
            URL.revokeObjectURL(imgURL)
            reject(new Error('Unable to load image'))
        }

        img.src = imgURL
    })
}

/**
 * Get the image's size and width on file upload
 * 
 * @param file   File from file upload
 * @returns      Height and width.
 */
async function getFileImgDimensions(file: File): Promise<{ height: number, width: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = () => {
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                })
            }
            img.onerror = () => {
                reject(new Error('Failed to load image.'))
            }
            img.src = reader.result as string
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file.'))
        }

        reader.readAsDataURL(file)
    })
}

function mbToBytes(mb: number) {
    return mb * 1024 * 1024;
}