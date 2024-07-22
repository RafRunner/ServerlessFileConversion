import { FileTypeResult } from "file-type";

export function checkIfMP3(type: FileTypeResult | undefined) {
    return type && type.mime === 'audio/mpeg' && type.ext === 'mp3'
}