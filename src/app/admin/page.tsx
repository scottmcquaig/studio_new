
"use client";

import { useState, useEffect, createElement, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion, ChevronsUpDown, Plus, BookCopy, Palette, Smile, Trophy, Star, TrendingUp, TrendingDown, Swords, Handshake, Angry, GripVertical, Home, Ban, Gem, Gift, HeartPulse, Medal, DollarSign, Rocket, Cctv, Skull, CloudSun, XCircle, ShieldPlus, Calendar as CalendarIcon, Package, Globe, UserSquare, Database, Search, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ShieldAlert, Tv, AlertTriangle } from "lucide-react";
import * as LucideIcons from "lucide-react";
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
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDoc, writeBatch, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import { useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
  
  const manageableLeagues = useMemo(() => {
    if (currentUser?.role === 'site_admin') {
      return allLeagues;
    }
    if (currentUser?.role === 'league_admin') {
      return allLeagues.filter(l => l.adminUserIds?.includes(currentUser.id));
    }
    return [];
  }, [allLeagues, currentUser]);

  const leagueSettings = useMemo(() => manageableLeagues.find(l => l.id === selectedLeagueId), [manageableLeagues, selectedLeagueId]);
  const [leagueToDelete, setLeagueToDelete] = useState<League | null>(null);

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [scoringRuleSet, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isAddUserToLeagueDialogOpen, setIsAddUserToLeagueDialogOpen] = useState(false);
  const [isNewLeagueDialogOpen, setIsNewLeagueDialogOpen] = useState(false);
  const [isManageAdminsDialogOpen, setIsManageAdminsDialogOpen] = useState(false);
  const [leagueToManageAdmins, setLeagueToManageAdmins] = useState<League | null>(null);
  const [isNewSeasonDialogOpen, setIsNewSeasonDialogOpen] = useState(false);

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
      seasonId: '',
      maxTeams: 8,
      contestantTerm: { singular: 'Contestant', plural: 'Contestants' },
      settings: { draftRounds: 4 },
      adminUserIds: [],
  });
  const [newSeasonData, setNewSeasonData] = useState<Partial<Season>>({
      franchise: 'Big Brother US',
      status: 'upcoming',
      currentWeek: 1,
      year: new Date().getFullYear(),
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
        user