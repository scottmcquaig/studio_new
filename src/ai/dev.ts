import { config } from 'dotenv';
config();

import '@/ai/flows/journal-insights.ts';
import '@/ai/flows/generate-unlock-code.ts';
import '@/ai/flows/validate-unlock-code.ts';
import '@/ai/flows/create-user-and-claim-code.ts';
import '@/ai/flows/get-user-profile.ts';
import '@/ai/flows/unlock-and-add-paths.ts';
import '@/ai/flows/switch-active-path.ts';
import '@/ai/flows/get-user-settings.ts';
import '@/ai/flows/update-user-settings.ts';
    