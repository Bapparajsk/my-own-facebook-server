import admin from 'firebase-admin'
// @ts-ignore
import serviceAccount from '../../credentials/serviceAccountKey.json'

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const messaging = admin.messaging();
