const admin=require('firebase-admin')
const serviceAccount=require('./fishandmeat-ea2c8-firebase-adminsdk-fbsvc-1c4828d160.json')

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = admin;