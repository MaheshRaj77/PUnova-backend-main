const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Supports two modes:
//   1. Local dev: serviceAccountKey.json file in project root
//   2. Production (Render): GOOGLE_SERVICE_ACCOUNT env var containing the JSON string

let serviceAccount;
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
} else {
    serviceAccount = require('../serviceAccountKey.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
