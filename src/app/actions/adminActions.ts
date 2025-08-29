
'use server';

import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { app as clientApp } from '@/lib/firebase';
import { adminApp } from '@/lib/firebase-admin';

const db_server = getFirestore(clientApp);
const adminAuth = getAuth(adminApp);

interface InviteUserInput {
    email: string;
    role: string;
}

export async function inviteUser(input: InviteUserInput) {
    const { email, role } = input;

    // 1. Check if user already exists in Firestore
    const usersRef = collection(db_server, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error('User with this email already exists.');
    }
    
    try {
        // 2. Add user to Firestore with 'pending' status
        const newUserDoc = {
            email,
            role,
            status: 'pending',
            displayName: email.split('@')[0], // a temporary display name
            createdAt: new Date().toISOString(),
        };
        await addDoc(usersRef, newUserDoc);
        
        // 3. Generate a password reset link (which serves as an invite link)
        const link = await adminAuth.generatePasswordResetLink(email);
        
        // 4. (TODO) Send an email with this link.
        console.log(`Generated invite link for ${email}: ${link}`);
        console.log(`This link should be sent to the user's email address.`);

        return { success: true, message: `Invitation process started for ${email}.` };

    } catch (error: any) {
        console.error("Error inviting user:", error);
        throw new Error(`Failed to invite user: ${error.message}`);
    }
}
