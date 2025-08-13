
'use server';

import { z } from 'zod';
import { db } from '@/lib/firestore';

const FormSchema = z.object({
    name: z.string(),
    favNumber: z.number(),
});

export async function saveFormSubmission(data: z.infer<typeof FormSchema>) {
    try {
        const validatedData = FormSchema.parse(data);

        await db.collection('submissions').add({
            ...validatedData,
            submittedAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save form submission:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation failed.' };
        }
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
