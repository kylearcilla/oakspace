import { ImgUploadInput } from "./enums"
import { ResError } from "./errors"

const MAX_IMG_FILE_SIZE = 5_242_880   // 5 MB

export class ImgInputError extends ResError<ImgUploadInput> { }

/**
 * Validates image url input from user.
 * Throws an error if there is one.
 * @param imgUrl   User input string
 */
export async function validateUserImgURLInput(imgUrl: string) {
    try {
        const res = await fetch(imgUrl)

        if (!res.ok) {
            throw new ImgInputError(ImgUploadInput.InvalidURL)
        }
        
        const contentLengthHeader = res.headers.get("Content-Length")
        if (!contentLengthHeader) {
            throw new ImgInputError(ImgUploadInput.InvalidURL)
        }

        const fileSizeInBytes = parseInt(contentLengthHeader, 10);
        if (fileSizeInBytes > MAX_IMG_FILE_SIZE) {
            throw new ImgInputError(ImgUploadInput.TooBig)
        }
    }
    catch(error: any) {
        throw (error instanceof ImgInputError) ? error : (error instanceof TypeError) ? 
                                                            new ImgInputError(ImgUploadInput.InvalidURL) : new ImgInputError(ImgUploadInput.Error)
    }
}

/**
 * Validates image file input from user.
 * Throws an error if there is one.
 * @param imgUrl   User input string
 */
export function validateUserImgFileInput(file: File) {
    try {
        if (!file) {
            throw new ImgInputError(ImgUploadInput.Error)
        }

        const reader = new FileReader()
        reader.readAsDataURL(file)

        if (file.size > MAX_IMG_FILE_SIZE) {
            throw new ImgInputError(ImgUploadInput.TooBig)
        }
    }
    catch(error: any) {
        throw (error instanceof ImgInputError) ? error : (error instanceof TypeError) ? 
                                                                new ImgInputError(ImgUploadInput.InvalidURL) : new ImgInputError(ImgUploadInput.Error)
    }
}

/**
 * Get error message from img input error code.
 * @param error   Input error code.
 * @returns       String messsage 
 */
export function getImgUploadErrorMsg(error: ImgInputError) {
  if (error.code === ImgUploadInput.TooBig) {
    return "File size cannot exceed more than 5 MB"
  }
  else if (error.code === ImgUploadInput.InvalidURL) {
    return "Invalid URL"
  }

  return "Error has occured, try again."
}


export function handleCustomVidInput () {

}