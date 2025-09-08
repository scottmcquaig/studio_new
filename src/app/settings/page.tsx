
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bell, User as UserIcon, Mail } from 'lucide-react';
import BottomNav from '@/components/bottom-nav';
import { getUserSettings } from '@/ai/flows/get-user-settings';
import { updateUserSettings } from '@/ai/flows/update-user-settings';
import PrivateRoute from '@/components/private-route';

interface UserSettings {
    displayName: string;
    email: string;
    reminders: {
        pushEnabled: boolean;
        emailEnabled: boolean;
        morningTime: string;
        eveningTime: string;
        timezone: string;
    }
}

const timezones = [
    { value: 'America/New_York', label: 'EST (UTC-5)' },
    { value: 'America/Chicago', label: 'CST (UTC-6)' },
    { value: 'America/Denver', label: 'MST (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'PST (UTC-8)' },
    { value: 'Europe/London', label: 'GMT (UTC+0)' },
    { value: 'Europe/Paris', label: 'CET (UTC+1)' },
];

function SettingsPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserSettings({ uid: user.uid })
                .then(data => {
                    setSettings({
                        displayName: data.displayName || '',
                        email: data.email || '',
                        reminders: data.reminders,
                    });
                })
                .catch(err => {
                    toast({
                        variant: 'destructive',
                        title: 'Failed to load settings',
                        description: err.message,
                    });
                })
                .finally(() => setIsLoading(false));
        }
    }, [user, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => prev ? { ...prev, [id]: value } : null);
    };

    const handleReminderChange = (field: string, value: any) => {
        setSettings(prev => prev ? {
            ...prev,
            reminders: {
                ...prev.reminders,
                [field]: value
            }
        } : null);
    };

    const handleSaveChanges = async () => {
        if (!user || !settings) return;
        setIsSaving(true);
        try {
            await updateUserSettings({
                uid: user.uid,
                displayName: settings.displayName,
                email: settings.email,
                reminders: settings.reminders,
            });
            toast({
                title: 'Success!',
                description: 'Your settings have been updated.',
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Failed to save settings',
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!settings) {
        return <div className="text-center py-10">Could not load settings.</div>
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="py-4 bg-card border-b">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                <h1 className="text-xl font-bold font-headline text-primary">Settings</h1>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <UserIcon className="h-6 w-6 text-accent" />
                                <CardTitle className="font-headline text-2xl text-primary">Profile Information</CardTitle>
                            </div>
                            <CardDescription>Manage your public display name and account email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" value={settings.displayName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={settings.email} onChange={handleInputChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Bell className="h-6 w-6 text-accent" />
                                <CardTitle className="font-headline text-2xl text-primary">Notification Settings</CardTitle>
                            </div>
                            <CardDescription>Control how and when you receive challenge reminders.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                <Label htmlFor="pushEnabled" className="font-medium">Enable Push Notifications (coming soon)</Label>
                                <Switch id="pushEnabled" checked={settings.reminders.pushEnabled} onCheckedChange={(checked) => handleReminderChange('pushEnabled', checked)} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                <Label htmlFor="emailEnabled" className="font-medium">Enable Email Reminders (coming soon)</Label>
                                <Switch id="emailEnabled" checked={settings.reminders.emailEnabled} onCheckedChange={(checked) => handleReminderChange('emailEnabled', checked)} />
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="timezone">Your Timezone</Label>
                                <Select value={settings.reminders.timezone} onValueChange={(value) => handleReminderChange('timezone', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timezones.map(tz => (
                                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="morningTime">Morning Intention Time</Label>
                                    <Input id="morningTime" type="time" value={settings.reminders.morningTime} onChange={(e) => handleReminderChange('morningTime', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eveningTime">Evening Reflection Time</Label>
                                    <Input id="eveningTime" type="time" value={settings.reminders.eveningTime} onChange={(e) => handleReminderChange('eveningTime', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </main>
            <BottomNav activeTab="User" />
        </div>
    );
}


export default function SettingsPage() {
    return (
        <PrivateRoute>
            <SettingsPageContent />
        </PrivateRoute>
    );
}
