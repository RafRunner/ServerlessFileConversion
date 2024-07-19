import { fileTypeFromBuffer } from "file-type";

export async function checkIfMP3(buffer: Uint8Array): Promise<boolean> {
    const type = await fileTypeFromBuffer(buffer);

    return type && type.mime === 'audio/mpeg' && type.ext === 'mp3'
}