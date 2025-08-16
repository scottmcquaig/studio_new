
'use server';

import { getFirestore, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

const COLLECTIONS_TO_CLEAR = [
    'leagues',
    'teams',
    'picks',
    'competitions',
    'contestants',
    'seasons',
    'scoring_rules'
];

export async function clearFirestoreData() {
    const batch = writeBatch(db);

    // Clear specified collections
    for (const collectionName of COLLECTIONS_TO_CLEAR) {
        const q = query(collection(db, collectionName));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        console.log(`Cleared collection: ${collectionName}`);
    }

    // Clear users except the admin
    const usersQuery = query(collection(db, 'users'), where('email', '!=', 'admin@yac.com'));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    console.log(`Cleared users, preserving admin@yac.com`);

    // Commit the batch
    await batch.commit();
    console.log('Firestore data cleared successfully.');
}

    