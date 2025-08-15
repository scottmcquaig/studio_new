
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Lock, Building } from "lucide-react";
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/components/withAuth';

function SettingsPage() {
  const { appUser } = useAuth();

  if (!appUser) {
      return (
          <div className="flex flex-1 items-center justify-center">
              <div>Loading Settings...</div>
          </div>
      );
  }

  return (
    <>
      <AppHeader pageTitle="Settings" pageIcon={Settings} />
      <main className="flex-1 pb-24 p-4 md:p-8">
        <div className="flex flex-1 flex-col gap-6 md:gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User/> Profile Information</CardTitle>
                <CardDescription>Update your display name and email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" defaultValue={appUser?.displayName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={appUser?.email} />
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
      </main>
      <BottomNavBar />
    </>
  );
}

export default withAuth(SettingsPage);
