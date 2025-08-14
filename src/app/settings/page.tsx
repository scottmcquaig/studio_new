
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Lock, Building } from "lucide-react";
import { MOCK_USERS } from "@/lib/data";
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export default function SettingsPage() {
  const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
  
  return (
    <>
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </h1>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User/> Profile Information</CardTitle>
                  <CardDescription>Update your display name and email address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" defaultValue={currentUser?.displayName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={currentUser?.email} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Profile</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock/> Change Password</CardTitle>
                  <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Update Password</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
