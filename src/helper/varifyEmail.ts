import { OAuth2Client } from 'google-auth-library';

export const checkIfTempEmail = async (email: string): Promise<boolean> => {
    const client = new OAuth2Client();
    try {
        const response = await client.verifyIdToken({
            idToken: email,
            audience: "1073406337831-57r35uocja6bst1udpufrbq666p08qq7.apps.googleusercontent.com", // Replace with your Google Client ID
        });

        console.log(response);

        const payload = response.getPayload();
        console.log(payload);
        return !payload?.email_verified;
    } catch (error) {
        console.error('Error occurred:', error);
        return false;
    }
}
