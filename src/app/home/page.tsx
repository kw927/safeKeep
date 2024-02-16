
import React, { useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import HomeComponent from '@/components/home';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { getSaltAndPublicKey } from '../../services/cryptoServiceClient';
import { UserProvider } from '@/context/UserProvider';

// declare the prisma client
const prisma = new PrismaClient();

/**
 * Function to get the salt for encrypting the master password
 * Note: This function is called from the server side and not the client side
 * @returns 
 */
const getSalt = async () => {
    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // get the salt
    try {
        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email
            }
        });

        if (user?.public_key) {
            // get the salt and public key
            const { salt } = getSaltAndPublicKey(user.public_key);

            return salt;
        }

        return null;

    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
}

const Home = async () => {
    // // the router object for redirecting the user to different pages
    // const router = useRouter();

    // // selected file state to store the file selected by the user
    // const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // /**
    //  * Function to handle sign out
    //  */
    // const handleSignOut = async () => {
    //     // sign out and then redirect to the login page
    //     await signOut({ redirect: false });

    //     router.push('/login');
    // };

    // /**
    //  * Function to handle file change event
    //  * @param event 
    //  */
    // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     // get the file selected by the user from the event
    //     const file = event.target.files ? event.target.files[0] : null;

    //     // update the selected file state to the file selected by the user
    //     setSelectedFile(file);
    // };

    // /**
    //  * Function to handle file upload event
    //  * @param event 
    //  * @returns 
    //  */
    // const handleFileUpload = async (event: FormEvent<HTMLFormElement>) => {
    //     // prevent the default form submission behavior
    //     event.preventDefault();

    //     // check if the user has selected a file
    //     if (!selectedFile) {
    //         // TODO: replace the alert with a modal
    //         alert('Please select a file to upload');
    //         return;
    //     }

    //     // create a new FormData object for uploading the file to the API
    //     const formData = new FormData();
    //     // append the file to the FormData object
    //     formData.append('file', selectedFile);

    //     try {
    //         // call the file upload API to upload the form data
    //         const response = await fetch('/api/file/upload', {
    //             method: 'POST',
    //             body: formData,
    //         });

    //         if (response.ok) {
    //             // TODO: replace the alert with a modal
    //             alert('File uploaded successfully');
    //         } else {
    //             // TODO: replace the alert with a modal
    //             alert('File upload failed');
    //         }
    //     } catch (error) {
    //         console.error('Error uploading file:', error);
    //         alert('Error uploading file');
    //     }
    // };
    const salt = await getSalt();

    return (
        <>
            <MainLayout showSearchBar={false}>
                <UserProvider>
                    <HomeComponent salt={salt} />
                </UserProvider>
            </MainLayout>
        </>
    );
};

export default Home;