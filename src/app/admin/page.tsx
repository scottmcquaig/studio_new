
"use client";

import { useState, useEffect, createElement, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion, ChevronsUpDown, Plus, BookCopy, Palette, Smile, Trophy, Star, TrendingUp, TrendingDown, Swords, Handshake, Angry, GripVertical, Home, Ban, Gem, Gift, HeartPulse, Medal, DollarSign, Rocket, Cctv, Skull, CloudSun, XCircle, ShieldPlus, Calendar as CalendarIcon, Package, Globe, UserSquare, Database, Search, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { MOCK_SEASONS } from "@/lib/data";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule, UserStatus, Season, ScoringRuleSet, LeagueScoringBreakdownCategory, Pick } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn, getContestantDisplayName, getCroppedImg } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { app } from '@/lib/firebase';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import Cropper, { Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { seedDatabase } from '@/lib/seed';
import { useSearchParams } from 'next/navigation';


const iconSelection = [
    'Crown', 'Ban', 'Gem', 'Gift', 'HeartPulse', 'KeyRound', 'ShieldPlus', 'Trophy',
    'Medal', 'DollarSign', 'Rocket', 'Cctv', 'Skull', 'CloudSun', 'XCircle'
] as const;

const colorSelection = [
    'bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

const specialEventRuleCodes = ['SAVED', 'POWER', 'PUNISH', 'PENALTY_RULE', 'SPECIAL_POWER'];

const USERS_PER_PAGE = 5;

// Component to manage a single rule row, preventing input focus loss
const RuleRow = ({ rule, index, onUpdate, onRemove }: { rule: ScoringRule, index: number, onUpdate: (index: number, field: keyof ScoringRule, value: string | number) => void, onRemove: (code: string) => void }) => {
    const [localRule, setLocalRule] = useState(rule);

    useEffect(() => {
        setLocalRule(rule);
    }, [rule]);

    const handleChange = (field: keyof ScoringRule, value: string | number) => {
        setLocalRule(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: keyof ScoringRule) => {
        onUpdate(index, field, localRule[field]);
    };

    return (
        <TableRow>
            <TableCell>
                <Input 
                    value={localRule.code} 
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())} 
                    onBlur={() => handleBlur('code')}
                    className="h-8" 
                />
            </TableCell>
            <TableCell>
                <Input 
                    value={localRule.label} 
                    onChange={(e) => handleChange('label', e.target.value)} 
                    onBlur={() => handleBlur('label')}
                    className="h-8" 
                />
            </TableCell>
            <TableCell className="text-right">
                <Input 
                    type="number" 
                    value={localRule.points} 
                    onChange={(e) => handleChange('points', Number(e.target.value))} 
                    onBlur={() => handleBlur('points')}
                    className="h-8 w-20 text-right" 
                />
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(rule.code)}>
                    <Trash2 className="h-4 w-4 text-red-500"/>
                </Button>
            </TableCell>
        </TableRow>
    );
};


function AdminPage() {
  const { toast } = useToast();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const { appUser: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view');
  
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const leagueSettings = useMemo(() => allLeagues.find(l => l.id === selectedLeagueId), [allLeagues, selectedLeagueId]);
  const [leagueToDelete, setLeagueToDelete] = useState<League | null>(null);

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const [activeSeason, setActiveSeason] = useState<Season | null>(MOCK_SEASONS[0]);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [scoringRuleSet, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(activeSeason?.currentWeek || 1);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isAddUserToLeagueDialogOpen, setIsAddUserToLeagueDialogOpen] = useState(false);
  const [isNewLeagueDialogOpen, setIsNewLeagueDialogOpen] = useState(false);

  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftingTeam, setDraftingTeam] = useState<Team | null>(null);
  const [draftSelection, setDraftSelection] = useState<string>('');
  const [currentPickNumber, setCurrentPickNumber] = useState(1);


  const [newUserData, setNewUserData] = useState({ displayName: '', email: ''});
  const [addUserToLeagueData, setAddUserToLeagueData] = useState({ userId: '', teamId: '' });
  const [newRuleData, setNewRuleData] = useState<ScoringRule>({ code: '', label: '', points: 0 });
  const [specialEventData, setSpecialEventData] = useState({ contestantId: '', ruleCode: '', notes: '', eventDate: new Date() });
  const [newLeagueData, setNewLeagueData] = useState<Partial<League>>({
      name: '',
      seasonId: MOCK_SEASONS[0]?.id,
      maxTeams: 8,
      contestantTerm: { singular: 'Contestant', plural: 'Contestants' },
      settings: { draftRounds: 4 }
  });
  
  const [teamNames, setTeamNames] = useState<{[id: string]: string}>({});

  const [teamDraftOrders, setTeamDraftOrders] = useState<{[id: string]: number}>({});

  const [activeTab, setActiveTab] = useState('scoring'); // Default for site admins

  // State for weekly event management
  const [hohWinnerId, setHohWinnerId] = useState<string | undefined>();
  const [hohDate, setHohDate] = useState<Date | undefined>();
  const [nominees, setNominees] = useState<string[]>(['', '']);
  const [nomsDate, setNomsDate] = useState<Date | undefined>();
  const [vetoWinnerId, setVetoWinnerId] = useState<string | undefined>();
  const [vetoDate, setVetoDate] = useState<Date | undefined>();
  const [vetoUsed, setVetoUsed] = useState(false);
  const [vetoUsedOnId, setVetoUsedOnId] = useState<string | undefined>();
  const [vetoReplacementNomId, setVetoReplacementNomId] = useState<string | undefined>();
  const [blockBusterWinnerId, setBlockBusterWinnerId] = useState<string | undefined>();
  const [blockBusterDate, setBlockBusterDate] = useState<Date | undefined>();
  const [evictedId, setEvictedId] = useState<string | undefined>();
  const [evictionDate, setEvictionDate] = useState<Date | undefined>();

  // Image Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] = useState(false);
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const [runnerUpId, setRunnerUpId] = useState<string | undefined>();


  const scoringRules = useMemo(() => scoringRuleSet?.rules || [], [scoringRuleSet]);
  const specialEventRules = useMemo(() => scoringRules.filter(r => specialEventRuleCodes.includes(r.code)) || [], [scoringRules]);
  const teams = useMemo(() => allTeams.filter(t => t.leagueId === selectedLeagueId).sort((a,b) => a.draftOrder - b.draftOrder), [allTeams, selectedLeagueId]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
        user.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, userCurrentPage]);


  useEffect(() => {
    if (initialView === 'site') {
        setActiveTab('site_admin');
    } else {
        const lastTab = sessionStorage.getItem('adminActiveTab');
        if (lastTab && lastTab !== 'site_admin') {
            setActiveTab(lastTab);
        } else {
            setActiveTab('scoring');
        }
    }
  }, [initialView]);

  useEffect(() => {
    const lastWeek = sessionStorage.getItem('adminSelectedWeek');
    if (lastWeek && activeSeason && Number(lastWeek) <= activeSeason.currentWeek) {
        setSelectedWeek(Number(lastWeek));
    } else if (activeSeason) {
        setSelectedWeek(activeSeason.currentWeek);
    }
  }, [activeSeason]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    sessionStorage.setItem('adminActiveTab', value);
  };

  const handleWeekChange = (value: string) => {
    const week = Number(value);
    setSelectedWeek(week);
    sessionStorage.setItem('adminSelectedWeek', String(week));
  };
  
  const handleStartNewWeek = () => {
      if (activeSeason) {
          const newWeek = activeSeason.currentWeek + 1;
          // In a real app, you'd save this to the database.
          setActiveSeason({ ...activeSeason, currentWeek: newWeek });
          setSelectedWeek(newWeek);
          sessionStorage.setItem('adminSelectedWeek', String(newWeek));
          toast({ title: "New Week Started", description: `You are now managing Week ${newWeek}.`});
      }
  };
  
  useEffect(() => {
    const compCol = collection(db, "competitions");
    const unsubscribeComps = onSnapshot(compCol, (querySnapshot) => {
      const compData: Competition[] = [];
      querySnapshot.forEach((doc) => {
        compData.push({ ...doc.data(), id: doc.id } as Competition);
      });
      setCompetitions(compData);
    });

    const contestantsCol = collection(db, "contestants");
    const unsubscribeContestants = onSnapshot(contestantsCol, (querySnapshot) => {
        const contestantData: Contestant[] = [];
        querySnapshot.forEach((doc) => {
            contestantData.push({ ...doc.data(), id: doc.id } as Contestant);
        });
        setContestants(contestantData.sort((a,b) => (a.firstName || '').localeCompare(b.firstName || '')));
    });

    const leaguesCol = collection(db, "leagues");
    const unsubscribeLeagues = onSnapshot(leaguesCol, (querySnapshot) => {
        const leagueData: League[] = [];
        querySnapshot.forEach((doc) => {
            leagueData.push({ ...doc.data(), id: doc.id } as League);
        });
        setAllLeagues(leagueData);
        if (!selectedLeagueId && leagueData.length > 0) {
            setSelectedLeagueId(leagueData[0].id);
        }
    });
    
    const usersCol = collection(db, "users");
    const qUsers = query(usersCol);
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
        const usersData: UserType[] = [];
        querySnapshot.forEach((doc) => {
            usersData.push({ ...doc.data(), id: doc.id } as UserType);
        });
        setUsers(usersData);
    });
    
    const allTeamsQuery = query(collection(db, "teams"));
    const unsubscribeAllTeams = onSnapshot(allTeamsQuery, (querySnapshot) => {
        const teamsData: Team[] = [];
        const teamNamesData: {[id: string]: string} = {};
        const draftOrderData: {[id: string]: number} = {};

        querySnapshot.forEach((doc) => {
            const team = { ...doc.data(), id: doc.id } as Team;
            teamsData.push(team);
            teamNamesData[team.id] = team.name;
            draftOrderData[team.id] = team.draftOrder;
        });

        setAllTeams(teamsData);
        setTeamNames(teamNamesData);
        setTeamDraftOrders(draftOrderData);
    });


    return () => {
        unsubscribeComps();
        unsubscribeContestants();
        unsubscribeLeagues();
        unsubscribeUsers();
        unsubscribeAllTeams();
    };
  }, [db]);
  
  useEffect(() => {
    if (!selectedLeagueId) return;

    const picksQuery = query(collection(db, "picks"), where("leagueId", "==", selectedLeagueId));
    const unsubscribePicks = onSnapshot(picksQuery, (querySnapshot) => {
        const picksData: Pick[] = [];
        querySnapshot.forEach((doc) => {
            picksData.push({ ...doc.data(), id: doc.id } as Pick);
        });
        setPicks(picksData.sort((a,b) => a.pick - b.pick));
        setCurrentPickNumber(picksData.length + 1);
    });
    
    return () => {
      unsubscribePicks();
    }
  }, [db, selectedLeagueId]);

  useEffect(() => {
      if (leagueSettings?.settings?.scoringRuleSetId) {
          const ruleSetDocRef = doc(db, 'scoring_rules', leagueSettings.settings.scoringRuleSetId);
          const unsubscribeRules = onSnapshot(ruleSetDocRef, (ruleSnap) => {
              if (ruleSnap.exists()) {
                  setScoringRuleSet({ id: ruleSnap.id, ...ruleSnap.data() } as ScoringRuleSet);
              }
          });
          return () => unsubscribeRules();
      } else {
          setScoringRuleSet(null);
      }
  }, [leagueSettings, db]);


  const activeContestants = useMemo(() => contestants.filter(hg => hg.status === 'active'), [contestants]);
  const weekOptions = useMemo(() => Array.from({ length: activeSeason?.currentWeek || 1 }, (_, i) => i + 1).reverse(), [activeSeason]);
  
  const allAssignedContestantIds = useMemo(() => picks.map(p => p.contestantId), [picks]);
  const undraftedContestants = useMemo(() => contestants.filter(c => !allAssignedContestantIds.includes(c.id)), [contestants, allAssignedContestantIds]);

  const weekEvents = useMemo(() => competitions.filter(c => c.week === selectedWeek), [competitions, selectedWeek]);
  
  useEffect(() => {
    const hoh = weekEvents.find(c => c.type === 'HOH');
    const pov = weekEvents.find(c => c.type === 'VETO');
    const noms = weekEvents.find(c => c.type === 'NOMINATIONS');
    const blockBuster = weekEvents.find(c => c.type === 'BLOCK_BUSTER');
    const eviction = weekEvents.find(c => c.type === 'EVICTION');
    
    setHohWinnerId(hoh?.winnerId);
    setHohDate(hoh?.airDate ? new Date(hoh.airDate) : undefined);
    setNominees(noms?.nominees || ['', '']);
    setNomsDate(noms?.airDate ? new Date(noms.airDate) : undefined);
    setVetoWinnerId(pov?.winnerId);
    setVetoDate(pov?.airDate ? new Date(pov.airDate) : undefined);
    setVetoUsed(pov?.used || false);
    setVetoUsedOnId(pov?.usedOnId);
    setVetoReplacementNomId(pov?.replacementNomId);
    setBlockBusterWinnerId(blockBuster?.winnerId);
    setBlockBusterDate(blockBuster?.airDate ? new Date(blockBuster.airDate) : undefined);
    setEvictedId(eviction?.evictedId);
    setEvictionDate(eviction?.airDate ? new Date(eviction.airDate) : undefined);

  }, [weekEvents, selectedWeek]);


    const handleNomineeChange = (index: number, value: string) => {
        const newNominees = [...nominees];
        newNominees[index] = value;
        setNominees(newNominees);
    };
    
    const addNomineeField = () => {
        setNominees([...nominees, '']);
    };
    
    const removeNomineeField = (index: number) => {
        const newNominees = nominees.filter((_, i) => i !== index);
        setNominees(newNominees);
    };

  const handleAddNewUser = async () => {
    if (!newUserData.displayName || !newUserData.email) {
      toast({ title: "Error", description: "Display Name and Email are required.", variant: 'destructive' });
      return;
    }
    try {
      await addDoc(collection(db, "users"), {
        ...newUserData,
        createdAt: new Date().toISOString(),
        role: 'player',
        status: 'pending'
      });
      toast({ title: "User Invited", description: `An invitation can be sent to ${newUserData.displayName}.` });
      setIsNewUserDialogOpen(false);
      setNewUserData({ displayName: '', email: '' });
    } catch (error) {
      console.error("Error creating user: ", error);
      toast({ title: "Error", description: "Could not invite new user.", variant: "destructive" });
    }
  };

  const handleUpdateUser = async () => {
      if (!editingUser) return;
      const { id, ...dataToSave } = editingUser;
      try {
          await updateDoc(doc(db, 'users', id), dataToSave);
          toast({ title: 'User Updated', description: `${editingUser.displayName}'s details have been saved.` });
      } catch (e) {
          console.error("Error updating user: ", e);
          toast({ title: "Error", description: "Could not update user.", variant: "destructive" });
      } finally {
          setEditingUser(null);
      }
  };
  
  const handleDeleteUser = async () => {
      if (!userToDelete) return;
      try {
          await deleteDoc(doc(db, 'users', userToDelete.id));
          toast({ title: 'User Deleted', description: `${userToDelete.displayName} has been removed.` });
      } catch (e) {
          console.error("Error deleting user: ", e);
          toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
      } finally {
          setUserToDelete(null);
      }
  };
  
  const handleAddUserToLeague = async () => {
     if (!addUserToLeagueData.userId || !selectedLeagueId) {
        toast({ title: "Error", description: "Please select a user.", variant: 'destructive' });
        return;
    }
    const user = users.find(u => u.id === addUserToLeagueData.userId);
    if (!user) return;

    const batch = writeBatch(db);

    // Remove user from any other team first in this league
    teams.forEach(t => {
        if ((t.ownerUserIds || []).includes(user.id)) {
            const teamDocRef = doc(db, 'teams', t.id);
            const updatedOwners = t.ownerUserIds.filter(id => id !== user.id);
            batch.update(teamDocRef, { ownerUserIds: updatedOwners });
        }
    });
    
    let teamToAssign = teams.find(t => t.id === addUserToLeagueData.teamId);

    if (addUserToLeagueData.teamId && teamToAssign) {
        // Add user to the selected team
        const teamDocRef = doc(db, 'teams', teamToAssign.id);
        const newOwners = [...(teamToAssign.ownerUserIds || []), user.id];
        batch.update(teamDocRef, { ownerUserIds: newOwners });
    } else {
        // Create a new team for the user
        const newTeamRef = doc(collection(db, 'teams'));
        const newTeam: Omit<Team, 'id'> = {
            leagueId: selectedLeagueId,
            name: `${user.displayName}'s Team`,
            ownerUserIds: [user.id],
            draftOrder: (teams.length || 0) + 1,
            contestantIds: [],
            faab: 100,
            createdAt: new Date().toISOString(),
            total_score: 0,
            weekly_score: 0,
            weekly_score_breakdown: { week4: [] }, // This is a placeholder
        };
        batch.set(newTeamRef, newTeam);
        teamToAssign = { ...newTeam, id: newTeamRef.id };
    }


    try {
        await batch.commit();
        toast({ title: "User Assigned", description: `${user?.displayName} has been assigned to ${teamToAssign?.name}.` });
        setIsAddUserToLeagueDialogOpen(false);
        setAddUserToLeagueData({ userId: '', teamId: '' });
    } catch(error) {
         console.error("Error assigning user: ", error);
        toast({ title: "Error", description: "Could not assign user to team.", variant: "destructive" });
    }
  };
  
  const handleRemoveUserFromTeam = async (userId: string, teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedOwnerIds = (team.ownerUserIds || []).filter(id => id !== userId);
    try {
        const teamDocRef = doc(db, 'teams', teamId);
        await updateDoc(teamDocRef, { ownerUserIds: updatedOwnerIds });
        const user = users.find(u => u.id === userId);
        toast({ title: "User Unassigned", description: `${user?.displayName} has been unassigned from ${team.name}.` });
    } catch (error) {
        console.error("Error unassigning user: ", error);
        toast({ title: "Error", description: "Could not unassign user.", variant: "destructive" });
    }
  };


  const handleUserAction = (action: 'resend' | 'reset', user: UserType) => {
    // In a real app, these would trigger backend actions (e.g., Cloud Functions)
    // For this mock, we'll just show a toast.
    if (action === 'resend') {
        toast({ title: "Invitation Resent", description: `Invitation has been resent to ${user.email}.` });
    }
    if (action === 'reset') {
        toast({ title: "Password Reset Sent", description: `A password reset link has been sent to ${user.email}.` });
    }
  };

  const handleSaveLeagueSettings = async () => {
    if (!leagueSettings || !activeSeason) return;
    const batch = writeBatch(db);
    try {
        const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
        const leagueDataToSave = {
            ...leagueSettings,
        };
        batch.set(leagueDocRef, leagueDataToSave, { merge: true });
        
        await batch.commit();
        toast({ title: "Changes Saved", description: `League settings have been saved.` });
    } catch (error) {
        console.error(`Error saving league settings: `, error);
        toast({ title: "Error", description: `Could not save league settings.`, variant: "destructive" });
    }
  };
  
  const handleSaveTeamsAndUsers = async () => {
     if (!leagueSettings) return;
     const batch = writeBatch(db);
     try {
        teams.forEach(team => {
            const teamDocRef = doc(db, 'teams', team.id);
            const dataToSave: Partial<Team> = {
                name: teamNames[team.id] || team.name,
                draftOrder: teamDraftOrders[team.id] || team.draftOrder,
            };
            batch.update(teamDocRef, dataToSave);
        });

        await batch.commit();
        
        toast({ title: "Changes Saved", description: `Team and user settings have been saved.` });
    } catch (error) {
        console.error(`Error saving teams/users: `, error);
        toast({ title: "Error", description: `Could not save teams and users.`, variant: "destructive" });
    }
  };

  const handleSaveRules = async () => {
    if (!scoringRuleSet || !leagueSettings) return;
    try {
        const rulesetDocRef = doc(db, 'scoring_rules', scoringRuleSet.id);
        const leagueDocRef = doc(db, 'leagues', leagueSettings.id);

        const updatedSettings = {
            ...leagueSettings.settings,
            scoringBreakdownCategories: leagueSettings.settings.scoringBreakdownCategories
                .map(c => ({...c, ruleCodes: c.ruleCodes.filter(rc => rc)})) // remove empty rule codes
                .filter(c => c.displayName)
        };
        
        const batch = writeBatch(db);
        batch.update(rulesetDocRef, { rules: scoringRuleSet.rules });
        batch.update(leagueDocRef, { settings: updatedSettings });
        
        await batch.commit();
        toast({ title: "Changes Saved", description: `Scoring rules and breakdowns have been saved.` });
    } catch (error) {
        console.error(`Error saving rules: `, error);
        toast({ title: "Error", description: `Could not save scoring rules.`, variant: "destructive" });
    }
};

  const handleSaveWeeklyEvents = async () => {
    if (!activeSeason || !leagueSettings) return;
    const batch = writeBatch(db);

    const createEvent = (type: Competition['type'], data: Omit<Competition, 'id' | 'seasonId' | 'type'>) => {
        const id = `${leagueSettings.id}_wk${selectedWeek}_${type}_${Date.now()}`;
        batch.set(doc(db, 'competitions', id), {
            ...data,
            id,
            seasonId: activeSeason.id,
            week: selectedWeek,
            type,
        });
    };

    if (hohWinnerId) {
        createEvent('HOH', { winnerId: hohWinnerId, airDate: (hohDate || new Date()).toISOString() });
    }
    if (nominees.some(n => n)) {
        createEvent('NOMINATIONS', { nominees: nominees.filter(n => n), airDate: (nomsDate || new Date()).toISOString() });
    }
    if (vetoWinnerId) {
        createEvent('VETO', { winnerId: vetoWinnerId, used: vetoUsed, usedOnId: vetoUsedOnId, replacementNomId: vetoReplacementNomId, airDate: (vetoDate || new Date()).toISOString() });
        if (vetoUsed && vetoUsedOnId) {
             createEvent('SPECIAL_EVENT', {
                specialEventCode: 'SAVED',
                winnerId: vetoUsedOnId,
                airDate: (vetoDate || new Date()).toISOString(),
                notes: 'Saved by Power of Veto'
            });
        }
    }
    if (blockBusterWinnerId) {
        createEvent('BLOCK_BUSTER', { winnerId: blockBusterWinnerId, airDate: (blockBusterDate || new Date()).toISOString() });
    }
    if (evictedId) {
        const juryStartWeek = leagueSettings.settings.juryStartWeek;
        const eventCode = juryStartWeek && selectedWeek >= juryStartWeek ? 'EVICT_POST' : 'EVICT_PRE';
        createEvent('EVICTION', { evictedId: evictedId, airDate: (evictionDate || new Date()).toISOString(), specialEventCode: eventCode });
    }

    try {
        await batch.commit();
        toast({ title: "Events Saved", description: `All event changes for Week ${selectedWeek} have been saved.`});
    } catch (error) {
        console.error("Error saving weekly events: ", error);
        toast({ title: "Error", description: "Could not save event changes.", variant: "destructive" });
    }
  };

  const handleTeamNameChange = (teamId: string, newName: string) => {
    setTeamNames(prev => ({ ...prev, [teamId]: newName }));
  };

  const handleDraftOrderChange = (teamId: string, order: string) => {
    const numOrder = Number(order);
    if (!isNaN(numOrder)) {
        setTeamDraftOrders(prev => ({...prev, [teamId]: numOrder}));
    }
  };

  const handleUpdateRule = (index: number, field: keyof ScoringRule, value: string | number) => {
    if (!scoringRuleSet) return;
    
    if (field === 'code' && typeof value === 'string') {
        const otherCodes = scoringRuleSet.rules.filter((_, i) => i !== index).map(r => r.code);
        if (otherCodes.includes(value)) {
            toast({
                title: "Duplicate Code",
                description: `The event code "${value}" is already in use. Please choose a unique code.`,
                variant: "destructive",
            });
            // This will revert the visual state if a duplicate is entered, as the onUpdate won't fully propagate
            const updatedRules = [...scoringRuleSet.rules];
            setScoringRuleSet(prev => prev ? { ...prev, rules: updatedRules } : null);
            return;
        }
    }
    
    const updatedRules = [...scoringRuleSet.rules];
    (updatedRules[index] as any)[field] = value;
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
};

  const handleAddRule = () => {
    if (!newRuleData.code || !newRuleData.label || !scoringRuleSet) {
        toast({ title: "Error", description: "Rule code and label are required.", variant: 'destructive' });
        return;
    }
    const updatedRules = [...scoringRuleSet.rules, newRuleData];
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
    setIsAddRuleDialogOpen(false);
    setNewRuleData({ code: '', label: '', points: 0 });
    toast({ title: "Rule Added", description: "The new scoring rule has been added. Remember to save changes." });
  };

  const handleRemoveRule = (codeToRemove: string) => {
    if (!scoringRuleSet) return;
    const updatedRules = scoringRuleSet.rules.filter(rule => rule.code !== codeToRemove);
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
    toast({ title: "Rule Removed", description: "The scoring rule has been removed. Remember to save changes." });
  };

  const handleBreakdownCategoryChange = (catIndex: number, field: keyof LeagueScoringBreakdownCategory, value: string | string[]) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      
      let finalValue = value;
      if (field === 'displayName' && typeof value === 'string' && value.length > 12) {
          finalValue = value.substring(0, 12);
          toast({ title: "Character Limit", description: "Display names are limited to 12 characters.", variant: "destructive"});
      }

      (updatedCategories[catIndex] as any)[field] = finalValue;
      
      setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {
          ...l,
          settings: {
              ...l.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      } : l));
  };

  const handleBreakdownRuleCodeChange = (catIndex: number, ruleIndex: number, value: string) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      const newRuleCodes = [...updatedCategories[catIndex].ruleCodes];
      newRuleCodes[ruleIndex] = value;
      updatedCategories[catIndex].ruleCodes = newRuleCodes;
       setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {
          ...l,
          settings: {
              ...l.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      }: l));
  };

  const addBreakdownRuleCode = (catIndex: number) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      updatedCategories[catIndex].ruleCodes.push('');
       setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {
          ...l,
          settings: {
              ...l.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      }: l));
  };
  
  const removeBreakdownRuleCode = (catIndex: number, ruleIndex: number) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      const newRuleCodes = updatedCategories[catIndex].ruleCodes.filter((_, i) => i !== ruleIndex);
      updatedCategories[catIndex].ruleCodes = newRuleCodes;
       setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {
          ...l,
          settings: {
              ...l.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      }: l));
  };
  
  const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) {
        return <LucideIcons.HelpCircle className={className} />;
    }
    return createElement(IconComponent, { className });
  };

  const getUsersForTeam = (teamId: string): UserType[] => {
      const team = teams.find(t => t.id === teamId);
      if (!team || !team.ownerUserIds) return [];
      return users.filter(u => (team.ownerUserIds || []).includes(u.id));
  };
  
  const getPicksForTeam = (teamId: string): Pick[] => {
    return picks.filter(p => p.teamId === teamId);
  };

  const totalDraftPicks = useMemo(() => {
    if (!leagueSettings) return 0;
    return (leagueSettings.maxTeams || 0) * (leagueSettings.settings?.draftRounds || 0);
  }, [leagueSettings]);

  const snakeDraftOrder = useMemo(() => {
    const numTeams = teams.length;
    if (!leagueSettings || numTeams === 0 || totalDraftPicks === 0) return [];
    
    const rounds = leagueSettings.settings.draftRounds || 0;
    const order: { pick: number, team: Team }[] = [];
    const sortedTeams = [...teams].sort((a,b) => a.draftOrder - b.draftOrder);

    for (let round = 0; round < rounds; round++) {
        const pickOrder = (round % 2 === 1) ? [...sortedTeams].reverse() : sortedTeams;
        for (let i = 0; i < pickOrder.length; i++) {
            const team = pickOrder[i];
            const pickNumber = round * numTeams + i + 1;
            if(pickNumber <= totalDraftPicks) {
                order.push({ pick: pickNumber, team: team });
            }
        }
    }
    return order;
  }, [teams, leagueSettings, totalDraftPicks]);
  
  const nextPickDetails = useMemo(() => {
    if (snakeDraftOrder.length === 0 || currentPickNumber > snakeDraftOrder.length) return null;
    return snakeDraftOrder[currentPickNumber - 1];
  }, [snakeDraftOrder, currentPickNumber]);

  const handleOpenDraftDialog = () => {
    if (!nextPickDetails) return;
    setDraftingTeam(nextPickDetails.team);
    setIsDraftDialogOpen(true);
    setDraftSelection('');
  }

  const handleDraftContestant = async () => {
    if (!draftingTeam || !draftSelection || !leagueSettings) {
        toast({ title: "Error", description: "No contestant selected.", variant: "destructive"});
        return;
    }

    const pickData: Pick = {
        id: `pick_${currentPickNumber}`,
        leagueId: leagueSettings.id,
        teamId: draftingTeam.id,
        contestantId: draftSelection,
        pick: currentPickNumber,
        round: Math.ceil(currentPickNumber / teams.length),
        createdAt: new Date().toISOString()
    };
    
    try {
        await setDoc(doc(db, 'picks', pickData.id), pickData);
        toast({ title: "Draft Successful", description: `${getContestantDisplayName(contestants.find(c => c.id === draftSelection), 'full')} has been drafted to ${draftingTeam.name}.`});
        setIsDraftDialogOpen(false);
        setDraftingTeam(null);
    } catch(e) {
        console.error("Error drafting contestant: ", e);
        toast({ title: "Error", description: "Could not draft contestant.", variant: "destructive"});
    }
  };
  
  const handleRemoveContestantFromTeam = async (pickId: string) => {
    try {
        await deleteDoc(doc(db, 'picks', pickId));
        toast({ title: "Pick Removed", description: `The draft pick has been removed.`});
    } catch(e) {
        console.error("Error removing pick: ", e);
        toast({ title: "Error", description: "Could not remove pick.", variant: "destructive"});
    }
  };


  const contestantTerm = leagueSettings?.contestantTerm || { singular: 'Contestant', plural: 'Contestants' };

  const handleOpenContestantDialog = (contestantOrNew: Contestant | 'new') => {
    if (contestantOrNew === 'new') {
        const newContestant: Contestant = {
            id: `new_contestant_${Date.now()}`,
            seasonId: activeSeason?.id || '',
            firstName: '',
            lastName: '',
            nickname: '',
            age: 0,
            hometown: '',
            occupation: '',
            status: 'active',
            enteredDay: 1,
            photoUrl: ''
        };
        setEditingContestant(newContestant);
    } else {
        setEditingContestant(contestantOrNew);
    }
  };
  
  const handleUpdateContestant = (field: keyof Contestant, value: string | number | boolean) => {
    if (editingContestant) {
      setEditingContestant({ ...editingContestant, [field]: value });
    }
  };

  const handleSaveContestant = async () => {
      if (!editingContestant) return;
  
      const contestantData = { ...editingContestant };
      const isNew = contestantData.id.startsWith('new_contestant_');
      
      try {
          if (isNew) {
              const { id, ...dataToSave } = contestantData;
              await addDoc(collection(db, 'contestants'), dataToSave);
              toast({ title: "Contestant Added", description: `${getContestantDisplayName(editingContestant, 'full')} has been added.` });
          } else {
              const { id, ...dataToSave } = contestantData;
              const contestantDoc = doc(db, 'contestants', editingContestant.id);
              await updateDoc(contestantDoc, dataToSave);
              toast({ title: "Contestant Updated", description: `${getContestantDisplayName(editingContestant, 'full')} has been updated.` });
          }
          setEditingContestant(null);
      } catch (error) {
          console.error("Error saving contestant: ", error);
          toast({ title: "Error", description: "Could not save contestant details.", variant: "destructive" });
      }
  };
  
  const handleDeleteContestant = async () => {
    if (!contestantToDelete) return;

    try {
      if (contestantToDelete.photoUrl && contestantToDelete.photoUrl.includes('firebasestorage')) {
          const photoRef = ref(storage, contestantToDelete.photoUrl);
          await deleteObject(photoRef).catch(err => console.warn("Could not delete photo, it might not exist:", err));
      }
      
      await deleteDoc(doc(db, 'contestants', contestantToDelete.id));

      setContestants(prev => prev.filter(c => c.id !== contestantToDelete.id));
      
      toast({ title: "Contestant Deleted", description: `${getContestantDisplayName(contestantToDelete, 'full')} has been permanently removed.` });
    } catch (error) {
        console.error("Error deleting contestant: ", error);
        toast({ title: "Error", description: "Could not delete contestant.", variant: "destructive" });
    } finally {
        setContestantToDelete(null);
    }
  };

  const allAssignedUserIds = useMemo(() => teams.flatMap(t => t.ownerUserIds || []), [teams]);
  const unassignedUsers = useMemo(() => users.filter(u => !(allAssignedUserIds || []).includes(u.id)), [users, allAssignedUserIds]);
  
  const isEditingNewContestant = editingContestant?.id.startsWith('new_contestant_');

  // Image Cropping Handlers
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };
  
  const handlePhotoUpload = async () => {
    if (!croppedAreaPixels || !imageSrc || !editingContestant) return;
    try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (!croppedImage) return;

        const storageRef = ref(storage, `contestant_photos/${editingContestant.id}_${Date.now()}.jpeg`);
        await uploadString(storageRef, croppedImage, 'data_url', {contentType: 'image/jpeg'});
        const downloadURL = await getDownloadURL(storageRef);
        
        handleUpdateContestant('photoUrl', downloadURL);
        
        setImageSrc(null); // Close the cropper
        setZoom(1);
        toast({ title: "Photo Uploaded", description: "New photo is ready. Don't forget to save." });
    } catch (e) {
        console.error("Error uploading photo: ", e);
        toast({ title: "Upload Failed", description: "Could not upload the photo.", variant: "destructive"});
    }
  };

    const isSeasonFinished = useMemo(() => {
        if (!leagueSettings || !leagueSettings.settings.seasonEndDate) return false;
        const endDate = new Date(leagueSettings.settings.seasonEndDate);
        const today = new Date();
        return today > endDate;
    }, [leagueSettings]);

    const handleFinishSeason = async () => {
        if (!winnerId || !runnerUpId || !leagueSettings || !activeSeason) {
            toast({ title: "Error", description: "Please select a winner and a runner-up.", variant: "destructive" });
            return;
        }

        const batch = writeBatch(db);
        const createEvent = (type: Competition['type'], data: Partial<Competition>) => {
            const id = `${leagueSettings.id}_wk${selectedWeek}_${type}_${Date.now()}`;
            batch.set(doc(db, 'competitions', id), {
                ...data,
                id,
                seasonId: activeSeason.id,
                week: activeSeason.currentWeek, // Final week
                type,
                airDate: new Date().toISOString()
            });
        };

        createEvent('SPECIAL_EVENT', { winnerId, specialEventCode: 'WINNER' });
        createEvent('SPECIAL_EVENT', { winnerId: runnerUpId, specialEventCode: 'RUNNER_UP' });

        try {
            await batch.commit();
            toast({ title: "Season Finished!", description: "Winner and runner-up have been recorded."});
            setIsFinishSeasonDialogOpen(false);
        } catch (error) {
            console.error("Error finishing season:", error);
            toast({ title: "Error", description: "Could not finalize season.", variant: "destructive" });
        }
    };

    const snakeDraftPicks = useMemo(() => {
        const numTeams = teams.length;
        if (numTeams === 0 || totalDraftPicks === 0) return {};
        
        const rounds = leagueSettings?.settings.draftRounds || 0;
        const picks: { [teamId: string]: number[] } = {};
        const sortedTeams = [...teams].sort((a,b) => a.draftOrder - b.draftOrder);

        sortedTeams.forEach(team => {
            picks[team.id] = [];
        });

        for (let round = 0; round < rounds; round++) {
            const pickOrder = (round % 2 === 1) ? [...sortedTeams].reverse() : sortedTeams;
            for (let i = 0; i < pickOrder.length; i++) {
                const team = pickOrder[i];
                const pickNumber = round * numTeams + i + 1;
                if(pickNumber <= totalDraftPicks) {
                    picks[team.id].push(pickNumber);
                }
            }
        }
        return picks;

    }, [teams, totalDraftPicks, leagueSettings]);
    
    const handleDeleteLeague = async () => {
        if (!leagueToDelete) return;
        const batch = writeBatch(db);
        try {
            // Delete the league
            const leagueDocRef = doc(db, 'leagues', leagueToDelete.id);
            batch.delete(leagueDocRef);

            // Find and delete associated teams
            const teamsQuery = query(collection(db, 'teams'), where('leagueId', '==', leagueToDelete.id));
            const teamsSnapshot = await getDocs(teamsQuery);
            teamsSnapshot.forEach(doc => batch.delete(doc.ref));

            // Find and delete associated picks
            const picksQuery = query(collection(db, 'picks'), where('leagueId', '==', leagueToDelete.id));
            const picksSnapshot = await getDocs(picksQuery);
            picksSnapshot.forEach(doc => batch.delete(doc.ref));

            await batch.commit();

            toast({
                title: 'League Deleted',
                description: `The league "${leagueToDelete.name}" and all its data have been removed.`,
            });
            
            if (selectedLeagueId === leagueToDelete.id) {
                const nextLeague = allLeagues.find(l => l.id !== leagueToDelete.id);
                setSelectedLeagueId(nextLeague ? nextLeague.id : null);
            }
        } catch (error) {
            console.error('Error deleting league:', error);
            toast({
                title: 'Deletion Failed',
                description: 'Could not delete the league. Check console for errors.',
                variant: 'destructive',
            });
        } finally {
            setLeagueToDelete(null);
        }
    };

    const handleCreateLeague = async () => {
        if (!newLeagueData.name || !newLeagueData.seasonId) {
            toast({ title: "Error", description: "League Name and Season are required.", variant: 'destructive' });
            return;
        }

        const leagueId = newLeagueData.name.toLowerCase().replace(/\s+/g, '_');

        const newLeague: Omit<League, 'id'> = {
            name: newLeagueData.name,
            abbreviatedName: newLeagueData.name,
            show: "Big Brother", // Assuming default for now
            seasonId: newLeagueData.seasonId,
            visibility: 'private',
            maxTeams: newLeagueData.maxTeams || 8,
            waivers: 'FAAB',
            createdAt: new Date().toISOString(),
            contestantTerm: newLeagueData.contestantTerm || { singular: 'Contestant', plural: 'Contestants' },
            settings: {
                draftRounds: newLeagueData.settings?.draftRounds || 4,
                allowMidSeasonDraft: false,
                scoringRuleSetId: 'bb27_ruleset', // Default ruleset for now
                transactionLockDuringEpisodes: true,
                scoringBreakdownCategories: [],
            },
        };

        try {
            await setDoc(doc(db, 'leagues', leagueId), newLeague);
            toast({ title: "League Created!", description: `The league "${newLeague.name}" has been created.` });
            setIsNewLeagueDialogOpen(false);
            setNewLeagueData({ name: '', seasonId: MOCK_SEASONS[0]?.id, maxTeams: 8, contestantTerm: { singular: 'Contestant', plural: 'Contestants' }, settings: { draftRounds: 4 } });
            setSelectedLeagueId(leagueId);
            setActiveTab('league');
        } catch (error) {
            console.error("Error creating league:", error);
            toast({ title: "Error", description: "Could not create the new league.", variant: "destructive" });
        }
    };

  if (!activeSeason || !currentUser) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Admin Panel...</div>
        </div>
    );
  }

  const siteAdminView = (
    <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe /> Site Administration</CardTitle>
            <CardDescription>Manage global users and leagues across the entire application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2"><Package/> Leagues</CardTitle>
                        <Dialog open={isNewLeagueDialogOpen} onOpenChange={setIsNewLeagueDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><PlusCircle className="mr-2"/> New League</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New League</DialogTitle>
                                    <DialogDescription>Set up a new fantasy league for a season.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>League Name</Label>
                                        <Input value={newLeagueData.name} onChange={(e) => setNewLeagueData({...newLeagueData, name: e.target.value})} placeholder="e.g., Big Brother 26" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Season</Label>
                                        <Select value={newLeagueData.seasonId} onValueChange={(val) => setNewLeagueData({...newLeagueData, seasonId: val})}>
                                            <SelectTrigger><SelectValue placeholder="Select a season..." /></SelectTrigger>
                                            <SelectContent>
                                                {MOCK_SEASONS.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Number of Teams</Label>
                                            <Input type="number" value={newLeagueData.maxTeams} onChange={(e) => setNewLeagueData({...newLeagueData, maxTeams: Number(e.target.value)})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Draft Rounds</Label>
                                            <Input type="number" value={newLeagueData.settings?.draftRounds} onChange={(e) => setNewLeagueData({...newLeagueData, settings: {...newLeagueData.settings, draftRounds: Number(e.target.value)}})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Contestant (Singular)</Label>
                                            <Input value={newLeagueData.contestantTerm?.singular} onChange={(e) => setNewLeagueData({...newLeagueData, contestantTerm: {...newLeagueData.contestantTerm, singular: e.target.value}})} placeholder="e.g., Houseguest" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contestant (Plural)</Label>
                                            <Input value={newLeagueData.contestantTerm?.plural} onChange={(e) => setNewLeagueData({...newLeagueData, contestantTerm: {...newLeagueData.contestantTerm, plural: e.target.value}})} placeholder="e.g., Houseguests" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsNewLeagueDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateLeague}>Create League</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>League Name</TableHead>
                                <TableHead>Season</TableHead>
                                <TableHead>Teams</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allLeagues.map(l => (
                            <TableRow key={l.id} className={cn(l.id === selectedLeagueId && "bg-muted/50")}>
                                <TableCell className="font-medium">{l.name}</TableCell>
                                <TableCell>{MOCK_SEASONS.find(s=>s.id === l.seasonId)?.title}</TableCell>
                                <TableCell>{allTeams.filter(t=>t.leagueId === l.id).length} / {l.maxTeams}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => {setSelectedLeagueId(l.id); setActiveTab('scoring');}}>Manage</Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="ml-2" onClick={() => setLeagueToDelete(l)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete League?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the league "{l.name}"? This will also delete all associated teams and draft picks. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setLeagueToDelete(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteLeague}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
             <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2"><Users/> Global Users</CardTitle>
                         <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Invite User</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite New User</DialogTitle>
                                    <DialogDescription>Create a pending user profile. An email will be sent to them to complete registration.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={newUserData.displayName} onChange={(e) => setNewUserData({...newUserData, displayName: e.target.value})} placeholder="e.g., Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="jane@example.com" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddNewUser}><UserPlus className="mr-2" /> Create Invitation</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                 <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or email..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={userSearchTerm}
                            onChange={(e) => {
                                setUserSearchTerm(e.target.value);
                                setUserCurrentPage(1);
                            }}
                        />
                    </div>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>Display Name</TableHead>
                                 <TableHead>Email</TableHead>
                                 <TableHead>Role</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead className="text-right">Actions</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {paginatedUsers.map(u => (
                             <TableRow key={u.id}>
                                 <TableCell className="font-medium">{u.displayName}</TableCell>
                                 <TableCell>{u.email}</TableCell>
                                 <TableCell>{u.role}</TableCell>
                                 <TableCell>
                                     <Badge variant={u.status === 'active' ? 'outline' : 'secondary'}>{u.status}</Badge>
                                 </TableCell>
                                 <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}><Pencil className="h-4 w-4"/></Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" onClick={() => setUserToDelete(u)}>
                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                             </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete {userToDelete?.displayName}. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                 </TableCell>
                             </TableRow>
                             ))}
                         </TableBody>
                     </Table>
                 </CardContent>
                 <CardFooter className="flex items-center justify-end space-x-2 py-4">
                    <span className="text-sm text-muted-foreground">
                        Page {userCurrentPage} of {totalUserPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={userCurrentPage === 1}
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                        disabled={userCurrentPage === totalUserPages}
                    >
                        Next
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </CardFooter>
             </Card>
          </CardContent>
        </Card>
      </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Building className="h-5 w-5" />
          Admin Panel
        </h1>
        <div className="flex items-center gap-2">
            {currentUser?.role === 'site_admin' && (
                 <Button variant="outline" size="sm" onClick={() => handleTabChange('site_admin')}>
                    <Shield className="mr-2 h-4 w-4" /> Site Admin
                </Button>
            )}
            <Button asChild variant="outline" size="sm">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Back to App</Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        {activeTab === 'site_admin' && currentUser?.role === 'site_admin' ? siteAdminView : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="scoring">Scoring</TabsTrigger>
                    <TabsTrigger value="contestants">Contestants</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="league">League Settings</TabsTrigger>
                </TabsList>
                
                {leagueSettings && (
                <>
                <TabsContent value="scoring" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                                <CardDescription>Update results for the selected week for league: {leagueSettings.name}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-32">
                                    <Select value={String(selectedWeek)} onValueChange={handleWeekChange}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                        {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isSeasonFinished ? (
                                    <Dialog open={isFinishSeasonDialogOpen} onOpenChange={setIsFinishSeasonDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trophy className="mr-2 h-4 w-4"/> Finish Season</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Finalize Season</DialogTitle>
                                                <DialogDescription>Select the winner and runner-up to calculate final scores.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Winner</Label>
                                                    <Select value={winnerId} onValueChange={setWinnerId}>
                                                        <SelectTrigger><SelectValue placeholder="Select Winner..."/></SelectTrigger>
                                                        <SelectContent>
                                                            {activeContestants.map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Runner-up</Label>
                                                    <Select value={runnerUpId} onValueChange={setRunnerUpId}>
                                                        <SelectTrigger><SelectValue placeholder="Select Runner-up..."/></SelectTrigger>
                                                        <SelectContent>
                                                            {activeContestants.filter(c => c.id !== winnerId).map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsFinishSeasonDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handleFinishSeason}>Finalize</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={handleStartNewWeek}><Plus className="mr-2 h-4 w-4"/> New Week</Button>
                                )}
                            </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base text-purple-600">
                                            <span className="flex items-center gap-2"><Crown className="h-4 w-4" /> Head of Household</span>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><CalendarIcon className="h-4 w-4"/></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={hohDate} onSelect={setHohDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Label>HOH Winner</Label>
                                        <Select value={hohWinnerId} onValueChange={(val) => setHohWinnerId(val === 'none' ? undefined : val)}>
                                            <SelectTrigger><SelectValue placeholder="Select HOH..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='none'>None</SelectItem>
                                                {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base text-red-500">
                                            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Nominations</span>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><CalendarIcon className="h-4 w-4"/></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={nomsDate} onSelect={setNomsDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {nominees.map((nomineeId, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Select value={nomineeId} onValueChange={(value) => handleNomineeChange(index, value === 'none' ? '' : value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Nominee..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='none'>None</SelectItem>
                                                        {activeContestants
                                                            .filter(c => !nominees.includes(c.id) || nominees[index] === c.id)
                                                            .map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                {index > 1 && (
                                                    <Button variant="ghost" size="icon" onClick={() => removeNomineeField(index)} className="h-9 w-9">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={addNomineeField} className="mt-2">
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Nominee
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base text-amber-500">
                                            <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Power of Veto</span>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><CalendarIcon className="h-4 w-4"/></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={vetoDate} onSelect={setVetoDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Veto Winner</Label>
                                            <Select value={vetoWinnerId} onValueChange={(val) => setVetoWinnerId(val === 'none' ? undefined : val)}>
                                                <SelectTrigger><SelectValue placeholder="Select Veto Winner..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='none'>None</SelectItem>
                                                    {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="veto-used" checked={vetoUsed} onCheckedChange={(checked) => setVetoUsed(!!checked)} />
                                            <Label htmlFor="veto-used">Veto was used</Label>
                                        </div>
                                        {vetoUsed && (
                                            <>
                                                <div>
                                                    <Label>Used On (Saved)</Label>
                                                    <Select value={vetoUsedOnId} onValueChange={(val) => setVetoUsedOnId(val === 'none' ? undefined : val)}>
                                                        <SelectTrigger><SelectValue placeholder="Select Player Saved..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value='none'>None</SelectItem>
                                                            {nominees?.map(nomId => {
                                                                const nom = contestants.find(c => c.id === nomId);
                                                                return nom ? <SelectItem key={nom.id} value={nom.id}>{getContestantDisplayName(nom, 'full')}</SelectItem> : null;
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Replacement Nominee (Renom)</Label>
                                                    <Select value={vetoReplacementNomId} onValueChange={(val) => setVetoReplacementNomId(val === 'none' ? undefined : val)}>
                                                        <SelectTrigger><SelectValue placeholder="Select Replacement..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value='none'>None</SelectItem>
                                                            {activeContestants.filter(c => !nominees?.includes(c.id)).map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base text-sky-500">
                                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Block Buster</span>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><CalendarIcon className="h-4 w-4"/></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={blockBusterDate} onSelect={setBlockBusterDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Label>Winner (Safe)</Label>
                                        <Select value={blockBusterWinnerId} onValueChange={(val) => setBlockBusterWinnerId(val === 'none' ? undefined : val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Winner..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='none'>None</SelectItem>
                                                {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base text-muted-foreground">
                                            <span className="flex items-center gap-2"><UserX className="h-4 w-4" /> Eviction</span>
                                            <Popover>
                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><CalendarIcon className="h-4 w-4"/></Button></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={evictionDate} onSelect={setEvictionDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Label>Evicted Player</Label>
                                        <Select value={evictedId} onValueChange={(val) => setEvictedId(val === 'none' ? undefined : val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Evictee..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='none'>None</SelectItem>
                                                {contestants.filter(c => c.status === 'active').map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-green-500"><ShieldQuestion className="h-4 w-4" /> Special Event</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex h-[calc(100%-4rem)] items-center justify-center">
                                        <Dialog open={isSpecialEventDialogOpen} onOpenChange={setIsSpecialEventDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline"><PlusCircle className="mr-2" /> Add Event</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Log Special Event / Penalty</DialogTitle>
                                                    <DialogDescription>Apply a special scoring rule to a contestant for this week.</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div>
                                                        <Label>Contestant</Label>
                                                        <Select value={specialEventData.contestantId} onValueChange={(val) => setSpecialEventData({...specialEventData, contestantId: val})}>
                                                            <SelectTrigger><SelectValue placeholder="Select Contestant..." /></SelectTrigger>
                                                            <SelectContent>
                                                                {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Event/Rule</Label>
                                                        <Select value={specialEventData.ruleCode} onValueChange={(val) => setSpecialEventData({...specialEventData, ruleCode: val})}>
                                                            <SelectTrigger><SelectValue placeholder="Select Rule..." /></SelectTrigger>
                                                            <SelectContent>
                                                                {specialEventRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label} ({rule.points > 0 ? '+': ''}{rule.points})</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Notes (optional)</Label>
                                                        <Textarea value={specialEventData.notes} onChange={(e) => setSpecialEventData({...specialEventData, notes: e.target.value})} />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsSpecialEventDialogOpen(false)}>Cancel</Button>
                                                    <Button>Log Event</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline">Reset Week {selectedWeek}</Button>
                            <Button onClick={handleSaveWeeklyEvents}><Save className="mr-2"/>Save All Event Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="contestants" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserSquare/> Contestants Management</CardTitle>
                            <CardDescription>Manage contestant details for the league.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Contestants Roster</h3>
                                    <Button size="sm" variant="outline" onClick={() => handleOpenContestantDialog('new')}><PlusCircle className="mr-2"/> Add {contestantTerm.singular}</Button>
                                </div>
                                <div className="space-y-2">
                                    {contestants.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={c.photoUrl || undefined} alt={getContestantDisplayName(c, 'full')} />
                                                    <AvatarFallback>{getContestantDisplayName(c, 'full').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{getContestantDisplayName(c, 'full')}</p>
                                                    <p className="text-sm text-muted-foreground">{c.hometown}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenContestantDialog(c)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setContestantToDelete(c)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete {getContestantDisplayName(contestantToDelete, 'full')} and all their data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setContestantToDelete(null)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteContestant}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Dialog open={!!editingContestant} onOpenChange={(isOpen) => !isOpen && setEditingContestant(null)}>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>{isEditingNewContestant ? `Add New ${contestantTerm.singular}` : `Edit ${getContestantDisplayName(editingContestant, 'full')}`}</DialogTitle>
                                    </DialogHeader>
                                    {editingContestant && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                        {/* Left side: Form */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>First Name</Label>
                                                    <Input value={editingContestant.firstName || ''} onChange={(e) => handleUpdateContestant('firstName', e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Last Name</Label>
                                                    <Input value={editingContestant.lastName || ''} onChange={(e) => handleUpdateContestant('lastName', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nickname (optional)</Label>
                                                    <Input value={editingContestant.nickname || ''} onChange={(e) => handleUpdateContestant('nickname', e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Age</Label>
                                                    <Input type="number" value={editingContestant.age || 0} onChange={(e) => handleUpdateContestant('age', Number(e.target.value))} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select value={editingContestant.status} onValueChange={(val) => handleUpdateContestant('status', val)}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="evicted">Evicted</SelectItem>
                                                        <SelectItem value="jury">Jury</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Hometown</Label>
                                                <Input value={editingContestant.hometown || ''} onChange={(e) => handleUpdateContestant('hometown', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Occupation</Label>
                                                <Input value={editingContestant.occupation || ''} onChange={(e) => handleUpdateContestant('occupation', e.target.value)} />
                                            </div>
                                        </div>
                                        {/* Right side: Photo */}
                                        <div className="space-y-4">
                                            <Label>Photo</Label>
                                            <div className="p-4 border-2 border-dashed rounded-lg text-center">
                                                <Avatar className="mx-auto h-32 w-32 mb-4">
                                                    <AvatarImage src={editingContestant.photoUrl || undefined} />
                                                    <AvatarFallback className="text-3xl">
                                                        {getContestantDisplayName(editingContestant, 'full').charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                                                <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                                                    <Upload className="mr-2 h-4 w-4"/> Change Photo
                                                </Button>
                                                <p className="text-xs text-muted-foreground mt-2">Upload a new photo for this contestant.</p>
                                            </div>
                                        </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingContestant(null)}>Cancel</Button>
                                        <Button onClick={handleSaveContestant}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            
                            <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && setImageSrc(null)}>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Crop Photo</DialogTitle>
                                        <DialogDescription>Adjust the image to fit the circle.</DialogDescription>
                                    </DialogHeader>
                                    <div className="relative h-96 w-full bg-muted">
                                        {imageSrc && (
                                            <Cropper
                                                image={imageSrc}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={1}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={onCropComplete}
                                                cropShape="round"
                                                showGrid={false}
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label>Zoom</Label>
                                        <Slider
                                            value={[zoom]}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            onValueChange={(val) => setZoom(val[0])}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setImageSrc(null)}>Cancel</Button>
                                        <Button onClick={handlePhotoUpload}>Save Photo</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookCopy /> Scoring Rules</CardTitle>
                            <CardDescription>Manage the point values for all events in the league.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Point Values</h3>
                                    <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                                        <DialogTrigger asChild><Button size="sm" variant="outline"><PlusCircle className="mr-2"/> Add Rule</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Scoring Rule</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Event Code</Label>
                                                    <Input value={newRuleData.code} onChange={(e) => setNewRuleData({...newRuleData, code: e.target.value.toUpperCase()})} placeholder="e.g., HOH_WIN" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Label</Label>
                                                    <Input value={newRuleData.label} onChange={(e) => setNewRuleData({...newRuleData, label: e.target.value})} placeholder="e.g., Wins Head of Household" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Points</Label>
                                                    <Input type="number" value={newRuleData.points} onChange={(e) => setNewRuleData({...newRuleData, points: Number(e.target.value)})} placeholder="e.g., 10" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handleAddRule}>Add Rule</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Event Code</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scoringRuleSet?.rules.map((rule, index) => (
                                            <RuleRow 
                                                key={`${rule.code}-${index}`} 
                                                rule={rule} 
                                                index={index} 
                                                onUpdate={handleUpdateRule} 
                                                onRemove={handleRemoveRule} 
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Separator/>
                            <div>
                                <h3 className="text-lg font-medium mb-2">Team Card KPIs</h3>
                                <p className="text-sm text-muted-foreground mb-4">Customize how scores are displayed on team cards. Define up to 6 categories.</p>
                                <div className="space-y-2">
                                    {leagueSettings.settings?.scoringBreakdownCategories?.map((category, catIndex) => (
                                        <div key={catIndex} className="flex items-center gap-2 p-3 border rounded-lg">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="icon" className={cn("w-10 h-10", category.color ? category.color.replace('text-','bg-') : 'bg-gray-500' )}>
                                                        <DynamicIcon name={category.icon} className="h-5 w-5 text-white" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto">
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {iconSelection.map(iconName => (
                                                            <Button key={iconName} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleBreakdownCategoryChange(catIndex, 'icon', iconName)}>
                                                                <DynamicIcon name={iconName} />
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="grid grid-cols-9 gap-1">
                                                        {colorSelection.map(colorClass => (
                                                            <Button key={colorClass} variant="outline" size="icon" className="h-7 w-7 rounded-full p-0" onClick={() => handleBreakdownCategoryChange(catIndex, 'color', colorClass.replace('bg-','text-'))}>
                                                                <div className={cn("h-4 w-4 rounded-full", colorClass)} />
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Input 
                                                placeholder="Display Name"
                                                value={category.displayName} 
                                                onChange={(e) => handleBreakdownCategoryChange(catIndex, 'displayName', e.target.value)}
                                                maxLength={12}
                                                className="w-40"
                                            />
                                            <div className="flex flex-col gap-1 flex-grow">
                                            {category.ruleCodes.map((ruleCode, ruleIndex) => (
                                                <div key={ruleIndex} className="flex items-center gap-1">
                                                    <Select value={ruleCode} onValueChange={(value) => handleBreakdownRuleCodeChange(catIndex, ruleIndex, value)}>
                                                        <SelectTrigger><SelectValue placeholder="Select event code..."/></SelectTrigger>
                                                        <SelectContent>
                                                            {scoringRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeBreakdownRuleCode(catIndex, ruleIndex)}>
                                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                                    </Button>
                                                </div>
                                            ))}
                                            </div>
                                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => addBreakdownRuleCode(catIndex)}>
                                                <Plus className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleSaveRules}><Save className="mr-2"/>Save Rules</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="draft" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">Draft Center</CardTitle>
                                {nextPickDetails ? (
                                    <Button size="sm" onClick={handleOpenDraftDialog}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Make Next Pick ({currentPickNumber})
                                    </Button>
                                ) : (
                                    <Badge variant="outline">Draft Complete</Badge>
                                )}
                            </div>
                            <CardDescription>
                                {nextPickDetails ? 
                                    `On the clock: ${nextPickDetails.team.name} (Pick ${currentPickNumber})` :
                                    `All ${totalDraftPicks > 0 ? totalDraftPicks : contestants.length} draft picks have been made.`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {teams.map(team => (
                                    <Card key={team.id}>
                                        <CardHeader className="flex-row items-center justify-between p-4">
                                            <div>
                                                <CardTitle className="text-lg">{team.name}</CardTitle>
                                                {snakeDraftPicks[team.id] && (
                                                    <CardDescription className="text-xs">
                                                        Picks: {snakeDraftPicks[team.id].join(', ')}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                        {getPicksForTeam(team.id).length > 0 ? (
                                            <div className="space-y-2">
                                                {getPicksForTeam(team.id).map(pick => {
                                                    const contestant = contestants.find(c => c.id === pick.contestantId);
                                                    return (
                                                    <div key={pick.id} className="flex items-center justify-between text-sm">
                                                        <span className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="w-6 justify-center">{pick.pick}</Badge>
                                                            {getContestantDisplayName(contestant, 'full')}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveContestantFromTeam(pick.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                )})}
                                            </div>
                                        ): (
                                            <p className="text-sm text-muted-foreground">No {contestantTerm.plural} drafted yet.</p>
                                        )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Undrafted {contestantTerm.plural}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {undraftedContestants.map(c => (
                                        <div key={c.id} className="flex items-center gap-2 text-sm">
                                            <Image
                                            src={c.photoUrl || "https://placehold.co/100x100.png"}
                                            alt={getContestantDisplayName(c, 'full')}
                                            width={24}
                                            height={24}
                                            className="rounded-full"
                                            data-ai-hint="portrait person"
                                            />
                                            <span>{getContestantDisplayName(c, 'short')}</span>
                                        </div>
                                    ))}
                                    {undraftedContestants.length === 0 && <p className="text-sm text-muted-foreground col-span-2">All {contestantTerm.plural} have been drafted.</p>}
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    <Dialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Pick {currentPickNumber}: {draftingTeam?.name} selects...</DialogTitle>
                                <DialogDescription>Select a {contestantTerm.singular} to add to this team.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Select value={draftSelection} onValueChange={setDraftSelection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select a ${contestantTerm.singular}...`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {undraftedContestants.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDraftDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleDraftContestant}>Draft</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="league" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings /> General League Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leagueName">League Name</Label>
                                    <Input id="leagueName" value={leagueSettings.name} onChange={(e) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, name: e.target.value} : l))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seasonName">Season Name</Label>
                                    <Input id="seasonName" value={activeSeason.title} onChange={(e) => setActiveSeason({...activeSeason, title: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="seasonStart">Season Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !leagueSettings.settings.seasonStartDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                                {leagueSettings.settings.seasonStartDate ? format(new Date(leagueSettings.settings.seasonStartDate), 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(leagueSettings.settings.seasonStartDate || '')} onSelect={(date) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, settings: {...l.settings, seasonStartDate: date?.toISOString()}} : l))}/></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seasonEnd">Season End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !leagueSettings.settings.seasonEndDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                                {leagueSettings.settings.seasonEndDate ? format(new Date(leagueSettings.settings.seasonEndDate), 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(leagueSettings.settings.seasonEndDate || '')} onSelect={(date) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, settings: {...l.settings, seasonEndDate: date?.toISOString()}} : l))}/></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Jury Start Week</Label>
                                    <Select 
                                        value={String(leagueSettings.settings.juryStartWeek || 'none')} 
                                        onValueChange={(val) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, settings: {...l.settings, juryStartWeek: val === 'none' ? undefined : Number(val) }} : l))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select week..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="termSingular">Contestant (Singular)</Label>
                                    <Input id="termSingular" value={leagueSettings.contestantTerm.singular} onChange={(e) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, contestantTerm: {...l.contestantTerm, singular: e.target.value}} : l))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="termPlural">Contestant (Plural)</Label>
                                    <Input id="termPlural" value={leagueSettings.contestantTerm.plural} onChange={(e) => setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, contestantTerm: {...l.contestantTerm, plural: e.target.value}} : l))} />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="space-y-2 w-40">
                                    <Label htmlFor="maxTeams">Number of Teams</Label>
                                    <Input 
                                        id="maxTeams" 
                                        type="number"
                                        min="4"
                                        max="12"
                                        value={leagueSettings.maxTeams} 
                                        onChange={(e) => {
                                            const val = Math.max(4, Math.min(12, Number(e.target.value)));
                                            setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, maxTeams: val} : l));
                                        }}
                                    />
                                </div>
                                <div className="space-y-2 w-40">
                                    <Label htmlFor="draftRounds">Number of Rounds</Label>
                                    <Input 
                                        id="draftRounds" 
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={leagueSettings.settings.draftRounds || 4} 
                                        onChange={(e) => {
                                            const val = Math.max(1, Math.min(10, Number(e.target.value)));
                                            setAllLeagues(allLeagues.map(l => l.id === leagueSettings.id ? {...l, settings: {...l.settings, draftRounds: val}} : l));
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleSaveLeagueSettings}><Save className="mr-2"/>Save Settings</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><UserCog /> Users &amp; Teams</CardTitle>
                            <CardDescription className="text-left">Manage user roles, team names, assignments, and invitations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div className="flex justify-end gap-2">
                            <Dialog open={isAddUserToLeagueDialogOpen} onOpenChange={setIsAddUserToLeagueDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><UserPlus2 className="mr-2 h-4 w-4" /> Add User to League</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add User to League</DialogTitle>
                                        <DialogDescription>Assign an existing user to a team in this league.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>User</Label>
                                            <Select value={addUserToLeagueData.userId} onValueChange={(value) => setAddUserToLeagueData({...addUserToLeagueData, userId: value})}>
                                                <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                                                <SelectContent>
                                                    {unassignedUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.displayName} ({user.email})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Team Assignment</Label>
                                            <Select value={addUserToLeagueData.teamId} onValueChange={(value) => setAddUserToLeagueData({...addUserToLeagueData, teamId: value})}>
                                                <SelectTrigger><SelectValue placeholder="Select a team or create new..." /></SelectTrigger>
                                                <SelectContent>
                                                    {teams.map(team => <SelectItem key={team.id} value={team.id}>{teamNames[team.id]}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddUserToLeagueDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddUserToLeague}><Send className="mr-2" /> Add to League</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {teams.map((team, index) => (
                                        <Card key={team.id}>
                                            <CardHeader className="p-4 flex-row items-center justify-between">
                                                <CardTitle className="text-base flex-grow mr-2">
                                                    <Input 
                                                        value={teamNames[team.id] || `Team ${index + 1}`} 
                                                        placeholder={`Team ${index + 1}`}
                                                        onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                                                        className="border-0 shadow-none focus-visible:ring-0 p-0 text-base font-semibold"
                                                    />
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`draft-order-${team.id}`} className="text-xs text-muted-foreground"><SortAsc className="h-3 w-3 inline-block mr-1"/>Draft</Label>
                                                    <Input 
                                                        id={`draft-order-${team.id}`}
                                                        type="number"
                                                        value={teamDraftOrders[team.id] || ''}
                                                        onChange={(e) => handleDraftOrderChange(team.id, e.target.value)}
                                                        className="w-14 h-8 text-center"
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                {getUsersForTeam(team.id).length > 0 ? (
                                                    getUsersForTeam(team.id).map(user => (
                                                        <div key={user.id} className="flex items-center justify-between text-sm py-1">
                                                            <div className="flex items-center gap-2">
                                                                <span>{user.displayName}</span>
                                                                <Badge variant={user.status === 'active' ? 'outline' : 'secondary'} className={cn(
                                                                    user.status === 'active' && 'text-green-600 border-green-600',
                                                                    user.status === 'pending' && 'bg-white text-amber-600 border-amber-600'
                                                                )}>
                                                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        {user.status === 'pending' && <DropdownMenuItem onClick={() => handleUserAction('resend', user)}><MailQuestion className="mr-2" /> Resend Invitation</DropdownMenuItem>}
                                                                        <DropdownMenuItem onClick={() => handleUserAction('reset', user)}><KeyRound className="mr-2" /> Send Password Reset</DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveUserFromTeam(user.id, team.id)}><UserX className="mr-2"/> Unassign Team</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No members assigned.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleSaveTeamsAndUsers}><Save className="mr-2"/>Save Teams &amp; Users</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                </>
                )}
            </Tabs>
        )}
      </main>
      
        <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update the details for {editingUser?.displayName}.</DialogDescription>
                </DialogHeader>
                {editingUser && (
                     <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input value={editingUser.displayName} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value as UserRole})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="player">Player</SelectItem>
                                    <SelectItem value="league_admin">League Admin</SelectItem>
                                    <SelectItem value="site_admin">Site Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                    <Button onClick={handleUpdateUser}><Save className="mr-2" /> Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default withAuth(AdminPage, ['site_admin', 'league_admin']);
