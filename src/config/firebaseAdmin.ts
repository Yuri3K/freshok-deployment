import dotenv from 'dotenv';
import admin from 'firebase-admin'

dotenv.config();

if (!admin.apps.length) {
  if(process.env.MODE === 'development') {
    console.log("!!!   DEV    !!!")
    admin.initializeApp();
    // const serviceAccount = JSON.parse(
    //   Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString('utf8')
    // );
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    // })
  } else if(
    process.env.MODE === 'production'
  ) {
    // const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS!, 'base64').toString('utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } else {
    throw new Error('Firebase credentials not found')
  }
}

const db = admin.firestore();

export { admin, db }