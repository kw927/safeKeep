import { NextRequest, NextResponse } from 'next/server';
import { encryptFile, decryptFile } from '../../../../services/cryptoService';
import { join } from 'path';

const Upload = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        console.log(req.method)
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // TODO: verify the user is authenticated

    // Check if a file is submitted
    const data = await req.formData();
    const file: File | null = data.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }

    try {
        // The prototype will save the encrypted file to the tmp folder
        // TODO: change the path to the user's folder
        const savePath = join('/', 'tmp', `${file.name}.crypt`);

        // Encrypt the file
        const fileEncrypted = await encryptFile(file, process.env.TOTP_ENCRYPTION_KEY as string, savePath);

        // Decrypt the file
        const fileDecrypted = await decryptFile(savePath, process.env.TOTP_ENCRYPTION_KEY as string);

        if (fileEncrypted) {
            return NextResponse.json({ message: 'success' }, { status: 200 });
        }

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export { Upload as POST }