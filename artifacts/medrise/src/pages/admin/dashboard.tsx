import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminMe,
  useAdminLogout,
  useGetAppointmentStats,
  useListAppointments,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
  useListPatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useGetPatientStats,
  useListStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useChangePassword,
  useListAttendance,
  useRecordAttendance,
  useUpdateAttendance,
  useGetAttendanceStats,
  useAddToQueue,
  getListAttendanceQueryKey,
  getGetAttendanceStatsQueryKey,
  getListAppointmentsQueryKey,
  getGetAppointmentStatsQueryKey,
  getListPatientsQueryKey,
  getGetPatientStatsQueryKey,
  getListStaffQueryKey,
  getListQueueQueryKey,
  AttendanceInputStatus,
  AttendanceUpdateInputStatus,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LogOut, Calendar as CalendarIcon, Clock, CheckCircle2, Clock3,
  Trash2, User, Loader2, FileText, Users, Search, Plus, Edit2,
  Phone, Mail, MapPin, Droplets, AlertCircle, Stethoscope, ShieldCheck,
  Eye, EyeOff, UserCog, ClipboardList, ChevronLeft, ChevronRight,
  XCircle, AlertTriangle, Umbrella, Coffee,
  Receipt, Pill, FlaskConical, BarChart3, Activity, ScrollText,
  MessageSquareHeart, CalendarCheck, MessageCircle,
} from "lucide-react";

import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";
import { NotificationBell } from "@/components/NotificationBell";
import { buildConfirmationUrl, buildReminderUrl, isToday, isTomorrow } from "@/lib/whatsapp-utils";
import EhrTab from "./ehr-tab";
import BillingTab from "./billing-tab";
import PharmacyTab from "./pharmacy-tab";
import LabTab from "./lab-tab";
import SchedulesTab from "./schedules-tab";
import ReportsTab from "./reports-tab";
import AuditLogTab from "./audit-log-tab";
import QueueTab from "./queue-tab";
import FollowUpTab from "./followup-tab";
import FeedbackTab from "./feedback-tab";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
type DashboardTab = "appointments" | "patients" | "staff" | "attendance" | "ehr" | "billing" | "pharmacy" | "lab" | "schedules" | "reports" | "audit-log" | "queue" | "followup" | "feedback";

const ALL_ROLES = ["owner", "admin", "doctor", "nurse", "midwife", "receptionist", "staff"];
const CLINICAL_ROLES = ["owner", "admin", "doctor", "nurse", "midwife"];
const FRONT_DESK_ROLES = ["owner", "admin", "doctor", "nurse", "midwife", "receptionist", "staff"];

const TAB_CONFIG: {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
  roles: string[];
}[] = [
  // --- All staff / front-desk tabs ---
  { id: "queue",        label: "Triage Queue",    icon: Activity,           roles: FRONT_DESK_ROLES },
  { id: "appointments", label: "Appointments",    icon: CalendarIcon,       roles: FRONT_DESK_ROLES },
  { id: "patients",     label: "Patient Database",icon: Users,              roles: [...FRONT_DESK_ROLES] },
  // --- Clinical tabs (admin + clinical staff) ---
  { id: "ehr",          label: "EHR / Diagnosis", icon: Stethoscope,        roles: CLINICAL_ROLES },
  { id: "lab",          label: "Lab",             icon: FlaskConical,       roles: CLINICAL_ROLES },
  { id: "pharmacy",     label: "Pharmacy",        icon: Pill,               roles: CLINICAL_ROLES },
  // --- Scheduling / follow-up (all) ---
  { id: "schedules",    label: "Schedules",       icon: CalendarIcon,       roles: FRONT_DESK_ROLES },
  { id: "followup",     label: "Follow-Ups",      icon: CalendarCheck,      roles: FRONT_DESK_ROLES },
  { id: "feedback",     label: "Feedback",        icon: MessageSquareHeart, roles: ALL_ROLES },
  // --- Admin/Owner-only tabs ---
  { id: "billing",      label: "Billing",         icon: Receipt,            roles: ["owner", "admin"] },
  { id: "attendance",   label: "Attendance",      icon: ClipboardList,      roles: ["owner", "admin"] },
  { id: "staff",        label: "Staff Accounts",  icon: UserCog,            roles: ["owner", "admin"] },
  { id: "reports",      label: "Reports",         icon: BarChart3,          roles: ["owner", "admin"] },
  { id: "audit-log",    label: "Audit Log",       icon: ScrollText,         roles: ["owner", "admin"] },
];
type ApptFilter = string;

const staffSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "doctor", "nurse", "midwife", "receptionist", "staff"]),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
});

const staffEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")).optional(),
  role: z.enum(["admin", "doctor", "nurse", "midwife", "receptionist", "staff"]),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;
type StaffEditFormValues = z.infer<typeof staffEditSchema>;

const ROLE_LABELS: Record<string, string> = {
  owner: "Medical Director / Proprietor",
  admin: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  midwife: "Midwife",
  receptionist: "Receptionist",
  staff: "Staff",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  doctor: "bg-blue-50 text-blue-700 border-blue-200",
  nurse: "bg-green-50 text-green-700 border-green-200",
  midwife: "bg-pink-50 text-pink-700 border-pink-200",
  receptionist: "bg-orange-50 text-orange-700 border-orange-200",
  staff: "bg-gray-50 text-gray-700 border-gray-200",
};

const patientSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).or(z.literal("")).optional(),
  address: z.string().optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]).or(z.literal("")).optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

const changePwdSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePwdValues = z.infer<typeof changePwdSchema>;

function ChangePasswordForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (values: ChangePwdValues) => void;
  isPending: boolean;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const form = useForm<ChangePwdValues>({
    resolver: zodResolver(changePwdSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
        <FormField control={form.control} name="currentPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Current Password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showCurrent ? "text" : "password"} placeholder="Enter current password" {...field} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="newPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>New Password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} placeholder="Min. 6 characters" {...field} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm New Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Repeat new password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="pt-1">
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</> : "Change Password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AddStaffForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (values: StaffFormValues) => void;
  isPending: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { username: "", password: "", name: "", role: "staff", title: "", phone: "", email: "" },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl><Input placeholder="Dr. Jane Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl><Input placeholder="e.g. General Practitioner" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl><Input placeholder="dr.janedoe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password *</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} placeholder="Min. 6 characters" {...field} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input placeholder="+256 700 000000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="staff@medrise.ug" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}

function EditStaffForm({
  defaultValues,
  username,
  onSubmit,
  isPending,
  showPasswords,
  setShowPasswords,
  staffId,
}: {
  defaultValues: StaffEditFormValues;
  username: string;
  onSubmit: (values: StaffEditFormValues) => void;
  isPending: boolean;
  showPasswords: Record<number, boolean>;
  setShowPasswords: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  staffId: number;
}) {
  const form = useForm<StaffEditFormValues>({
    resolver: zodResolver(staffEditSchema),
    defaultValues,
  });
  const showPwd = showPasswords[staffId] ?? false;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>Username: <span className="font-mono font-medium text-gray-800">{username}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl><Input placeholder="e.g. Senior Nurse" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Role *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} placeholder="Leave blank to keep current" {...field} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswords(prev => ({ ...prev, [staffId]: !prev[staffId] }))}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input placeholder="+256 700 000000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="staff@medrise.ug" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}

function PatientForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: Partial<PatientFormValues>;
  onSubmit: (values: PatientFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "", phone: "", email: "", dateOfBirth: "",
      gender: "", address: "", bloodType: "", allergies: "", medicalNotes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl><Input placeholder="Patient full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl><Input placeholder="+256 700 000000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl><Input placeholder="patient@email.com" type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="bloodType" render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select blood type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map(bt => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl><Input placeholder="Village, District" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="allergies" render={({ field }) => (
          <FormItem>
            <FormLabel>Known Allergies</FormLabel>
            <FormControl><Input placeholder="e.g. Penicillin, Sulfa drugs" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="medicalNotes" render={({ field }) => (
          <FormItem>
            <FormLabel>Medical Notes</FormLabel>
            <FormControl>
              <Textarea placeholder="Diagnosis, ongoing treatment, important notes..." className="min-h-[100px] resize-none" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

export default function AdminDashboard({ isStaffPortal = false }: { isStaffPortal?: boolean }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<DashboardTab>("appointments");
  const [apptFilter, setApptFilter] = useState<ApptFilter>("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<null | { id: number; data: PatientFormValues }>(null);
  const [viewPatient, setViewPatient] = useState<null | { id: number }>(null);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<null | { id: number; data: StaffEditFormValues; username: string }>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceMonth, setAttendanceMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [attendanceView, setAttendanceView] = useState<"daily" | "monthly">("daily");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminMe, isLoading: isAuthLoading, error: authError } = useGetAdminMe({ query: { retry: false } as any });
  const logoutMutation = useAdminLogout();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: apptStats, isLoading: isApptStatsLoading } = useGetAppointmentStats({ query: { enabled: !!adminMe } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments, isLoading: isApptsLoading } = useListAppointments({ query: { enabled: !!adminMe } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patientStats, isLoading: isPatientStatsLoading } = useGetPatientStats({ query: { enabled: !!adminMe } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList, isLoading: isStaffLoading } = useListStaff({ query: { enabled: !!adminMe } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dailyAttendance, isLoading: isDailyLoading } = useListAttendance(
    { date: attendanceDate },
    { query: { enabled: !!adminMe && mainTab === "attendance" } as any }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: monthlyAttendance, isLoading: isMonthlyLoading } = useListAttendance(
    { month: attendanceMonth },
    { query: { enabled: !!adminMe && mainTab === "attendance" && attendanceView === "monthly" } as any }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attendanceStats, isLoading: isAttendanceStatsLoading } = useGetAttendanceStats(
    { month: attendanceMonth },
    { query: { enabled: !!adminMe && mainTab === "attendance" } as any }
  );
  const { data: patients, isLoading: isPatientsLoading } = useListPatients(
    patientSearch ? { search: patientSearch } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!adminMe } as any }
  );

  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const updateStatusMutation = useUpdateAppointmentStatus();
  const deleteApptMutation = useDeleteAppointment();
  const addToQueueMutation = useAddToQueue();
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();
  const changePasswordMutation = useChangePassword();
  const recordAttendanceMutation = useRecordAttendance();
  const updateAttendanceMutation = useUpdateAttendance();

  React.useEffect(() => {
    if (!isAuthLoading && (authError || !adminMe)) {
      setLocation(isStaffPortal ? "/staff/login" : "/admin/login");
      return;
    }
    if (!isAuthLoading && adminMe) {
      const role = (adminMe as { role?: string }).role ?? "";
      const isAdminRole = role === "admin" || role === "owner";
      if (isStaffPortal && isAdminRole) {
        setLocation("/admin/login");
      } else if (!isStaffPortal && !isAdminRole) {
        setLocation("/staff/dashboard");
      }
    }
  }, [adminMe, isAuthLoading, authError, setLocation, isStaffPortal]);

  // If the current tab isn't allowed for this role, switch to first allowed tab
  React.useEffect(() => {
    if (!adminMe?.role) return;
    const allowed = TAB_CONFIG.filter(t => t.roles.includes(adminMe.role ?? ""));
    if (allowed.length > 0 && !allowed.find(t => t.id === mainTab)) {
      setMainTab(allowed[0].id);
    }
  }, [adminMe?.role, mainTab]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("medrise_admin_token");
        queryClient.clear();
        setLocation(isStaffPortal ? "/staff/login" : "/admin/login");
      },
    });
  };

  const handleStatusUpdate = (id: number, status: AppointmentStatus) => {
    updateStatusMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Appointment marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  const handleDeleteAppt = (id: number) => {
    deleteApptMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Appointment deleted" });
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to delete appointment", variant: "destructive" }),
    });
  };

  const handleCheckIn = (appt: { id: number; patientName: string; phone?: string | null; service: string }) => {
    setCheckingInId(appt.id);
    addToQueueMutation.mutate(
      {
        data: {
          patientName: appt.patientName,
          queueDate: new Date().toISOString().slice(0, 10),
          priority: "non-urgent",
          referralSource: "home",
          notes: `Appointment: ${appt.service}`,
          notificationPhone: appt.phone ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: `${appt.patientName} checked in`,
            description: "Added to Triage Queue — switch to the Queue tab to see them.",
          });
          queryClient.invalidateQueries({ queryKey: getListQueueQueryKey() });
          updateStatusMutation.mutate({ id: appt.id, data: { status: "completed" } }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
              queryClient.invalidateQueries({ queryKey: getGetAppointmentStatsQueryKey() });
            },
          });
          setCheckingInId(null);
        },
        onError: () => {
          toast({ title: "Check-in failed", variant: "destructive" });
          setCheckingInId(null);
        },
      }
    );
  };

  const handleMarkAttendance = (staffId: number, status: AttendanceInputStatus) => {
    recordAttendanceMutation.mutate(
      { data: { staffId, date: attendanceDate, status, shift: "day" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ date: attendanceDate }) });
          queryClient.invalidateQueries({ queryKey: getGetAttendanceStatsQueryKey({ month: attendanceMonth }) });
        },
        onError: () => toast({ title: "Failed to record attendance", variant: "destructive" }),
      }
    );
  };

  const handleUpdateAttendanceField = (id: number, data: { checkIn?: string; checkOut?: string; notes?: string; status?: AttendanceUpdateInputStatus }) => {
    updateAttendanceMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey({ date: attendanceDate }) });
          queryClient.invalidateQueries({ queryKey: getGetAttendanceStatsQueryKey({ month: attendanceMonth }) });
        },
        onError: () => toast({ title: "Failed to update attendance", variant: "destructive" }),
      }
    );
  };

  const handleChangePassword = (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    changePasswordMutation.mutate(
      { data: { currentPassword: values.currentPassword, newPassword: values.newPassword } },
      {
        onSuccess: () => {
          toast({ title: "Password changed successfully" });
          setChangePwdOpen(false);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          toast({ title: msg ?? "Failed to change password", variant: "destructive" });
        },
      }
    );
  };

  const handleAddStaff = (values: StaffFormValues) => {
    createStaffMutation.mutate(
      { data: { username: values.username, password: values.password, name: values.name, role: values.role as any, title: values.title || undefined, phone: values.phone || undefined, email: values.email || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Staff account created" });
          setAddStaffOpen(false);
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          toast({ title: msg === "Username already exists" ? "That username is already taken" : "Failed to create staff account", variant: "destructive" });
        },
      }
    );
  };

  const handleEditStaff = (values: StaffEditFormValues) => {
    if (!editStaff) return;
    const payload: Record<string, string> = { name: values.name, role: values.role };
    if (values.password) payload.password = values.password;
    if (values.title !== undefined) payload.title = values.title;
    if (values.phone !== undefined) payload.phone = values.phone;
    if (values.email !== undefined) payload.email = values.email;
    updateStaffMutation.mutate(
      { id: editStaff.id, data: payload as Parameters<typeof updateStaffMutation.mutate>[0]["data"] },
      {
        onSuccess: () => {
          toast({ title: "Staff account updated" });
          setEditStaff(null);
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
        },
        onError: () => toast({ title: "Failed to update staff account", variant: "destructive" }),
      }
    );
  };

  const handleDeleteStaff = (id: number) => {
    deleteStaffMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Staff account removed" });
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
      },
      onError: () => toast({ title: "Failed to remove staff account", variant: "destructive" }),
    });
  };

  const handleAddPatient = (values: PatientFormValues) => {
    createPatientMutation.mutate(
      { data: { fullName: values.fullName, phone: values.phone, email: values.email || undefined, dateOfBirth: values.dateOfBirth || undefined, gender: (values.gender as "male" | "female" | "other") || undefined, address: values.address || undefined, bloodType: (values.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown") || undefined, allergies: values.allergies || undefined, medicalNotes: values.medicalNotes || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Patient registered successfully" });
          setAddPatientOpen(false);
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
        },
        onError: () => toast({ title: "Failed to register patient", variant: "destructive" }),
      }
    );
  };

  const handleEditPatient = (values: PatientFormValues) => {
    if (!editPatient) return;
    updatePatientMutation.mutate(
      { id: editPatient.id, data: { fullName: values.fullName, phone: values.phone, email: values.email || undefined, dateOfBirth: values.dateOfBirth || undefined, gender: (values.gender as "male" | "female" | "other") || undefined, address: values.address || undefined, bloodType: (values.bloodType as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown") || undefined, allergies: values.allergies || undefined, medicalNotes: values.medicalNotes || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Patient record updated" });
          setEditPatient(null);
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        },
        onError: () => toast({ title: "Failed to update patient", variant: "destructive" }),
      }
    );
  };

  const handleDeletePatient = (id: number) => {
    deletePatientMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Patient record deleted" });
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to delete patient", variant: "destructive" }),
    });
  };

  const handleSearch = () => setPatientSearch(searchInput);

  if (isAuthLoading || !adminMe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const filteredAppointments = appointments?.filter(a => apptFilter === "all" || a.status === apptFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "confirmed": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case "completed": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const viewedPatient = viewPatient ? patients?.find(p => p.id === viewPatient.id) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img src={logoBannerPath} alt="MedRise" className="h-8 object-contain" />
            </Link>
            <div className="h-6 w-px bg-gray-200 hidden md:block" />
            <span className="font-semibold text-gray-900 hidden md:block">
              {isStaffPortal ? "Medical Staff Portal" : "Admin Portal"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-full cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>{adminMe.name}</span>
                  <span className="text-gray-400 text-xs hidden md:inline">· Change Password</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Change Your Password
                  </DialogTitle>
                </DialogHeader>
                <ChangePasswordForm onSubmit={handleChangePassword} isPending={changePasswordMutation.isPending} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TAB_CONFIG.filter(t => !adminMe?.role || t.roles.includes(adminMe.role)).map(t => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${mainTab === t.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">

        {/* ===================== APPOINTMENTS TAB ===================== */}
        {mainTab === "appointments" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Appointments</h1>
              <p className="text-gray-500 text-sm">Manage and track all patient appointment requests.</p>
            </div>

            {/* Appointment Stats */}
            {isApptStatsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1,2,3,4].map(i => <Card key={i} className="animate-pulse h-24" />)}
              </div>
            ) : apptStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Total</p>
                        <h3 className="text-3xl font-bold text-gray-900">{apptStats.total}</h3>
                      </div>
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-400">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Pending</p>
                        <h3 className="text-3xl font-bold text-gray-900">{apptStats.pending}</h3>
                      </div>
                      <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock3 className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Confirmed</p>
                        <h3 className="text-3xl font-bold text-gray-900">{apptStats.confirmed}</h3>
                      </div>
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Today</p>
                        <h3 className="text-3xl font-bold text-gray-900">{apptStats.todayCount}</h3>
                      </div>
                      <div className="h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Reminders Due Banner */}
            {(() => {
              const todayConfirmed = (appointments ?? []).filter(a => a.status === "confirmed" && isToday(a.preferredDate));
              const tomorrowConfirmed = (appointments ?? []).filter(a => a.status === "confirmed" && isTomorrow(a.preferredDate));
              if (todayConfirmed.length === 0 && tomorrowConfirmed.length === 0) return null;
              return (
                <div className="mb-6 rounded-xl border border-[#25D366]/30 bg-[#f0fdf4] p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">WhatsApp Reminders Due</p>
                      <p className="text-xs text-gray-600 mb-3">
                        {todayConfirmed.length > 0 && <span>{todayConfirmed.length} appointment{todayConfirmed.length > 1 ? "s" : ""} <strong>today</strong> — send reminders now. </span>}
                        {tomorrowConfirmed.length > 0 && <span>{tomorrowConfirmed.length} appointment{tomorrowConfirmed.length > 1 ? "s" : ""} <strong>tomorrow</strong> — remind patients tonight.</span>}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[...todayConfirmed, ...tomorrowConfirmed].slice(0, 5).map(a => (
                          <a
                            key={a.id}
                            href={buildReminderUrl({ patientName: a.patientName, phone: a.phone ?? "", service: a.service, preferredDate: a.preferredDate, preferredTime: a.preferredTime })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#20b858] transition-colors"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {a.patientName.split(" ")[0]} · {isToday(a.preferredDate) ? "Today" : "Tomorrow"} {a.preferredTime}
                          </a>
                        ))}
                        {[...todayConfirmed, ...tomorrowConfirmed].length > 5 && (
                          <span className="text-xs text-gray-500 self-center">+{[...todayConfirmed, ...tomorrowConfirmed].length - 5} more in table below</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Appointments Table */}
            <Card className="shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg">Appointment List</CardTitle>
                  <Tabs defaultValue="all" value={apptFilter} onValueChange={setApptFilter}>
                    <TabsList className="h-auto p-1 bg-gray-100/80">
                      {["all","pending","confirmed","completed","cancelled"].map(v => (
                        <TabsTrigger key={v} value={v} className="px-4 py-2 capitalize">{v}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isApptsLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-gray-300 animate-spin" /></div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No appointments found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/60">
                          <TableHead>Patient</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date / Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map(app => (
                          <TableRow key={app.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="font-medium text-gray-900">{app.patientName}</div>
                              <div className="text-sm text-gray-500">{app.phone}</div>
                              {app.email && <div className="text-xs text-gray-400">{app.email}</div>}
                            </TableCell>
                            <TableCell className="text-gray-700">{app.service}</TableCell>
                            <TableCell>
                              <div className="flex items-center text-gray-900 font-medium text-sm">
                                <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                {format(new Date(app.preferredDate), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                {app.preferredTime}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 flex-wrap">
                                {app.message && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8">Note</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Note from {app.patientName}</DialogTitle>
                                      </DialogHeader>
                                      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap">{app.message}</div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                {app.status === "pending" && (
                                  <>
                                    <Button variant="outline" size="sm" className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                      onClick={() => handleStatusUpdate(app.id, "confirmed")} disabled={updateStatusMutation.isPending}>Confirm</Button>
                                    <Button variant="outline" size="sm" className="h-8 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                      onClick={() => handleStatusUpdate(app.id, "cancelled")} disabled={updateStatusMutation.isPending}>Cancel</Button>
                                  </>
                                )}
                                {app.status === "confirmed" && (
                                  <>
                                    <Button
                                      variant="outline" size="sm"
                                      className="h-8 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 font-medium"
                                      onClick={() => handleCheckIn({ id: app.id, patientName: app.patientName, phone: app.phone, service: app.service })}
                                      disabled={checkingInId === app.id}
                                    >
                                      {checkingInId === app.id
                                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Checking in…</>
                                        : <><Activity className="h-3.5 w-3.5 mr-1.5" />Check In</>
                                      }
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                      onClick={() => handleStatusUpdate(app.id, "completed")} disabled={updateStatusMutation.isPending}>Complete</Button>
                                    {app.phone && (
                                      <a
                                        href={buildReminderUrl({ patientName: app.patientName, phone: app.phone, service: app.service, preferredDate: app.preferredDate, preferredTime: app.preferredTime })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Send WhatsApp reminder"
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#25D366]/40 bg-[#f0fdf4] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </>
                                )}
                                {app.status === "pending" && app.phone && (
                                  <a
                                    href={buildConfirmationUrl({ patientName: app.patientName, phone: app.phone, service: app.service, preferredDate: app.preferredDate, preferredTime: app.preferredTime })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Send WhatsApp confirmation"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#25D366]/40 bg-[#f0fdf4] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the appointment for {app.patientName}. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteAppt(app.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===================== PATIENTS TAB ===================== */}
        {mainTab === "patients" && (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Database</h1>
                <p className="text-gray-500 text-sm">Complete records of all registered patients.</p>
              </div>
              <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                    <Plus className="h-4 w-4" /> Register New Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Register New Patient</DialogTitle>
                  </DialogHeader>
                  <PatientForm
                    onSubmit={handleAddPatient}
                    isPending={createPatientMutation.isPending}
                    submitLabel="Register Patient"
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Patient Stats */}
            {isPatientStatsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1,2,3,4].map(i => <Card key={i} className="animate-pulse h-24" />)}
              </div>
            ) : patientStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Total Patients</p>
                        <h3 className="text-3xl font-bold text-gray-900">{patientStats.total}</h3>
                      </div>
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Registered Today</p>
                        <h3 className="text-3xl font-bold text-gray-900">{patientStats.today}</h3>
                      </div>
                      <div className="h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">This Week</p>
                        <h3 className="text-3xl font-bold text-gray-900">{patientStats.thisWeek}</h3>
                      </div>
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">This Month</p>
                        <h3 className="text-3xl font-bold text-gray-900">{patientStats.thisMonth}</h3>
                      </div>
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Search */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone or email..."
                  className="pl-9 h-10"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white h-10 px-5">Search</Button>
              {patientSearch && (
                <Button variant="outline" onClick={() => { setPatientSearch(""); setSearchInput(""); }} className="h-10">Clear</Button>
              )}
            </div>

            {/* Patients Table */}
            <Card className="shadow-sm">
              <CardContent className="p-0">
                {isPatientsLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-gray-300 animate-spin" /></div>
                ) : !patients || patients.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">{patientSearch ? "No patients found matching your search" : "No patients registered yet"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/60">
                          <TableHead>Patient</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Blood Type</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients.map(patient => (
                          <TableRow key={patient.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{patient.fullName}</div>
                                  {patient.gender && <div className="text-xs text-gray-500 capitalize">{patient.gender}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Phone className="h-3.5 w-3.5 text-gray-400" /> {patient.phone}
                              </div>
                              {patient.email && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <Mail className="h-3 w-3 text-gray-400" /> {patient.email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {patient.dateOfBirth && (
                                <div className="text-sm text-gray-700">DOB: {patient.dateOfBirth}</div>
                              )}
                              {patient.address && (
                                <div className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
                                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" /> {patient.address}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {patient.bloodType ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">
                                  <Droplets className="h-3 w-3 mr-1" />{patient.bloodType}
                                </Badge>
                              ) : <span className="text-gray-400 text-xs">Unknown</span>}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {format(new Date(patient.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {/* View */}
                                <Dialog open={viewPatient?.id === patient.id} onOpenChange={open => setViewPatient(open ? { id: patient.id } : null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1">
                                      <Stethoscope className="h-3.5 w-3.5" /> View
                                    </Button>
                                  </DialogTrigger>
                                  {viewedPatient && (
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <User className="h-5 w-5 text-primary" /> {viewedPatient.fullName}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 mt-2">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Phone</p>
                                            <p className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" /> {viewedPatient.phone}</p>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Email</p>
                                            <p className="font-medium">{viewedPatient.email || "—"}</p>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Date of Birth</p>
                                            <p className="font-medium">{viewedPatient.dateOfBirth || "—"}</p>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Gender</p>
                                            <p className="font-medium capitalize">{viewedPatient.gender || "—"}</p>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Blood Type</p>
                                            <p className="font-bold text-red-700 flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{viewedPatient.bloodType || "Unknown"}</p>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Address</p>
                                            <p className="font-medium">{viewedPatient.address || "—"}</p>
                                          </div>
                                        </div>
                                        {viewedPatient.allergies && (
                                          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                            <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Allergies</p>
                                            <p className="text-sm text-orange-800">{viewedPatient.allergies}</p>
                                          </div>
                                        )}
                                        {viewedPatient.medicalNotes && (
                                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" /> Medical Notes</p>
                                            <p className="text-sm text-blue-900 whitespace-pre-wrap">{viewedPatient.medicalNotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  )}
                                </Dialog>

                                {/* Edit */}
                                <Dialog open={editPatient?.id === patient.id} onOpenChange={open => setEditPatient(open ? {
                                  id: patient.id,
                                  data: {
                                    fullName: patient.fullName, phone: patient.phone,
                                    email: patient.email ?? "", dateOfBirth: patient.dateOfBirth ?? "",
                                    gender: (patient.gender as "male" | "female" | "other") ?? "",
                                    address: patient.address ?? "",
                                    bloodType: (patient.bloodType as "A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-"|"Unknown") ?? "",
                                    allergies: patient.allergies ?? "",
                                    medicalNotes: patient.medicalNotes ?? "",
                                  }
                                } : null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary">
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  {editPatient?.id === patient.id && (
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Patient — {patient.fullName}</DialogTitle>
                                      </DialogHeader>
                                      <PatientForm
                                        defaultValues={editPatient.data}
                                        onSubmit={handleEditPatient}
                                        isPending={updatePatientMutation.isPending}
                                        submitLabel="Save Changes"
                                      />
                                    </DialogContent>
                                  )}
                                </Dialog>

                                {/* Delete */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete patient record?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove {patient.fullName}'s record. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeletePatient(patient.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        {/* ===================== ATTENDANCE TAB ===================== */}
        {mainTab === "attendance" && (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Attendance</h1>
                <p className="text-gray-500 text-sm">Track daily duty records — present, absent, late, on leave.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAttendanceView("daily")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${attendanceView === "daily" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Daily Sheet
                </button>
                <button onClick={() => setAttendanceView("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${attendanceView === "monthly" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Monthly Report
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {!isAttendanceStatsLoading && attendanceStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: "Present", value: attendanceStats.totalPresent, color: "border-l-secondary bg-green-50", text: "text-green-700", icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
                  { label: "Absent", value: attendanceStats.totalAbsent, color: "border-l-red-500 bg-red-50", text: "text-red-700", icon: <XCircle className="h-4 w-4 text-red-600" /> },
                  { label: "Late", value: attendanceStats.totalLate, color: "border-l-yellow-500 bg-yellow-50", text: "text-yellow-700", icon: <Clock3 className="h-4 w-4 text-yellow-600" /> },
                  { label: "On Leave", value: attendanceStats.totalLeave, color: "border-l-blue-500 bg-blue-50", text: "text-blue-700", icon: <Umbrella className="h-4 w-4 text-blue-600" /> },
                  { label: "Day Off", value: attendanceStats.totalOff, color: "border-l-gray-400 bg-gray-50", text: "text-gray-600", icon: <Coffee className="h-4 w-4 text-gray-500" /> },
                ].map(s => (
                  <div key={s.label} className={`border-l-4 ${s.color} rounded-lg p-4 flex items-center justify-between`}>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                    </div>
                    {s.icon}
                  </div>
                ))}
              </div>
            )}

            {/* ---- DAILY VIEW ---- */}
            {attendanceView === "daily" && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      Duty Sheet — {format(new Date(attendanceDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50"
                        onClick={() => {
                          const d = new Date(attendanceDate + "T00:00:00");
                          d.setDate(d.getDate() - 1);
                          setAttendanceDate(d.toISOString().slice(0, 10));
                        }}
                      ><ChevronLeft className="h-4 w-4" /></button>
                      <Input
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="h-9 w-40 text-sm"
                        max={new Date().toISOString().slice(0, 10)}
                      />
                      <button
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                        disabled={attendanceDate >= new Date().toISOString().slice(0, 10)}
                        onClick={() => {
                          const d = new Date(attendanceDate + "T00:00:00");
                          d.setDate(d.getDate() + 1);
                          setAttendanceDate(d.toISOString().slice(0, 10));
                        }}
                      ><ChevronRight className="h-4 w-4" /></button>
                      <button
                        className="text-xs text-primary hover:underline px-2"
                        onClick={() => setAttendanceDate(new Date().toISOString().slice(0, 10))}
                      >Today</button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isDailyLoading || !staffList ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 text-gray-300 animate-spin" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/60">
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Mark</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffList.map(member => {
                            const rec = dailyAttendance?.find(r => r.staffId === member.id);
                            const status = rec?.status ?? null;
                            return (
                              <TableRow key={member.id} className="hover:bg-gray-50/40">
                                <TableCell>
                                  <div className="font-medium text-gray-900">{member.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">{member.title ?? member.role}</div>
                                </TableCell>
                                <TableCell>
                                  {status ? (
                                    <Badge variant="outline" className={
                                      status === "present" ? "bg-green-50 text-green-700 border-green-200" :
                                      status === "absent" ? "bg-red-50 text-red-700 border-red-200" :
                                      status === "late" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                      status === "leave" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      "bg-gray-50 text-gray-600 border-gray-200"
                                    }>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200">Not Marked</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {rec ? (
                                    <Input
                                      type="time"
                                      defaultValue={rec.checkIn ?? ""}
                                      className="h-8 w-28 text-xs"
                                      onBlur={e => { if (rec && e.target.value !== rec.checkIn) handleUpdateAttendanceField(rec.id, { checkIn: e.target.value }); }}
                                    />
                                  ) : <span className="text-gray-300 text-xs">—</span>}
                                </TableCell>
                                <TableCell>
                                  {rec ? (
                                    <Input
                                      type="time"
                                      defaultValue={rec.checkOut ?? ""}
                                      className="h-8 w-28 text-xs"
                                      onBlur={e => { if (rec && e.target.value !== rec.checkOut) handleUpdateAttendanceField(rec.id, { checkOut: e.target.value }); }}
                                    />
                                  ) : <span className="text-gray-300 text-xs">—</span>}
                                </TableCell>
                                <TableCell>
                                  {rec ? (
                                    <Input
                                      defaultValue={rec.notes ?? ""}
                                      placeholder="Add note..."
                                      className="h-8 text-xs min-w-[120px]"
                                      onBlur={e => { if (rec && e.target.value !== rec.notes) handleUpdateAttendanceField(rec.id, { notes: e.target.value }); }}
                                    />
                                  ) : <span className="text-gray-300 text-xs">—</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1 flex-wrap">
                                    {[
                                      { s: AttendanceInputStatus.present, label: "P", cls: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
                                      { s: AttendanceInputStatus.late,    label: "L", cls: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
                                      { s: AttendanceInputStatus.absent,  label: "A", cls: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
                                      { s: AttendanceInputStatus.leave,   label: "LV", cls: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                                      { s: AttendanceInputStatus.off,     label: "O", cls: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" },
                                    ].map(({ s, label, cls }) => (
                                      <button
                                        key={s}
                                        onClick={() => handleMarkAttendance(member.id, s)}
                                        disabled={recordAttendanceMutation.isPending}
                                        className={`h-7 w-8 text-xs font-bold rounded border transition-colors ${cls} ${status === s ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                                        title={s.charAt(0).toUpperCase() + s.slice(1)}
                                      >{label}</button>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ---- MONTHLY REPORT VIEW ---- */}
            {attendanceView === "monthly" && (
              <Card className="shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      Monthly Report — {format(new Date(attendanceMonth + "-01"), "MMMM yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50"
                        onClick={() => {
                          const [y, m] = attendanceMonth.split("-").map(Number);
                          const prev = new Date(y, m - 2, 1);
                          setAttendanceMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
                        }}
                      ><ChevronLeft className="h-4 w-4" /></button>
                      <Input
                        type="month"
                        value={attendanceMonth}
                        onChange={e => setAttendanceMonth(e.target.value)}
                        className="h-9 w-36 text-sm"
                        max={new Date().toISOString().slice(0, 7)}
                      />
                      <button
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                        disabled={attendanceMonth >= new Date().toISOString().slice(0, 7)}
                        onClick={() => {
                          const [y, m] = attendanceMonth.split("-").map(Number);
                          const next = new Date(y, m, 1);
                          setAttendanceMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
                        }}
                      ><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isMonthlyLoading || isAttendanceStatsLoading || !staffList ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 text-gray-300 animate-spin" /></div>
                  ) : !attendanceStats || attendanceStats.staffSummary.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No attendance records for this month</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/60">
                            <TableHead>Staff Member</TableHead>
                            <TableHead className="text-center text-green-700">Present</TableHead>
                            <TableHead className="text-center text-yellow-700">Late</TableHead>
                            <TableHead className="text-center text-red-700">Absent</TableHead>
                            <TableHead className="text-center text-blue-700">Leave</TableHead>
                            <TableHead className="text-center text-gray-500">Off</TableHead>
                            <TableHead className="text-center">Attendance %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceStats.staffSummary.map(s => {
                            const member = staffList.find(m => m.id === s.staffId);
                            const workDays = s.present + s.late + s.absent;
                            const pct = workDays > 0 ? Math.round(((s.present + s.late) / workDays) * 100) : 0;
                            return (
                              <TableRow key={s.staffId} className="hover:bg-gray-50/40">
                                <TableCell>
                                  <div className="font-medium text-gray-900">{s.staffName}</div>
                                  <div className="text-xs text-gray-500 capitalize">{member?.title ?? s.staffRole}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-bold text-green-700">{s.present}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-bold text-yellow-700">{s.late}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-bold text-red-700">{s.absent}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-bold text-blue-700">{s.leave}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-bold text-gray-500">{s.off}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className={`text-sm font-bold ${pct >= 80 ? "text-green-700" : pct >= 60 ? "text-yellow-700" : "text-red-700"}`}>{pct}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===================== STAFF ACCOUNTS TAB ===================== */}
        {mainTab === "staff" && (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Accounts</h1>
                <p className="text-gray-500 text-sm">Manage login credentials for all medical staff and administrators.</p>
              </div>
              <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                    <Plus className="h-4 w-4" /> Add Staff Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Staff Account</DialogTitle>
                  </DialogHeader>
                  <AddStaffForm onSubmit={handleAddStaff} isPending={createStaffMutation.isPending} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Staff", value: staffList?.length ?? 0, color: "border-l-primary", bg: "bg-primary/10", icon: <Users className="h-5 w-5 text-primary" /> },
                { label: "Doctors", value: staffList?.filter(s => s.role === "doctor").length ?? 0, color: "border-l-blue-500", bg: "bg-blue-100", icon: <Stethoscope className="h-5 w-5 text-blue-600" /> },
                { label: "Nurses", value: staffList?.filter(s => s.role === "nurse").length ?? 0, color: "border-l-secondary", bg: "bg-secondary/10", icon: <User className="h-5 w-5 text-secondary" /> },
                { label: "Admins", value: staffList?.filter(s => s.role === "admin").length ?? 0, color: "border-l-purple-500", bg: "bg-purple-100", icon: <ShieldCheck className="h-5 w-5 text-purple-600" /> },
              ].map(stat => (
                <Card key={stat.label} className={`border-l-4 ${stat.color}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      </div>
                      <div className={`h-10 w-10 ${stat.bg} rounded-full flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Staff Cards Grid */}
            {isStaffLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-gray-300 animate-spin" /></div>
            ) : !staffList || staffList.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <UserCog className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No staff accounts found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {staffList.map(member => (
                  <Card key={member.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{member.name}</div>
                            {member.title && <div className="text-xs text-gray-500">{member.title}</div>}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs font-medium capitalize ${ROLE_COLORS[member.role] ?? ROLE_COLORS.staff}`}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{member.username}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400" /> {member.phone}
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-2 text-gray-600 text-xs">
                            <Mail className="h-3 w-3 text-gray-400" /> {member.email}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {/* Edit */}
                        <Dialog open={editStaff?.id === member.id} onOpenChange={open => setEditStaff(open ? {
                          id: member.id,
                          username: member.username,
                          data: { name: member.name, role: member.role as "admin" | "doctor" | "nurse" | "receptionist" | "staff", password: "", title: member.title ?? "", phone: member.phone ?? "", email: member.email ?? "" }
                        } : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Button>
                          </DialogTrigger>
                          {editStaff?.id === member.id && (
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Edit — {member.name}</DialogTitle>
                              </DialogHeader>
                              <EditStaffForm
                                defaultValues={editStaff.data}
                                username={editStaff.username}
                                onSubmit={handleEditStaff}
                                isPending={updateStaffMutation.isPending}
                                showPasswords={showPasswords}
                                setShowPasswords={setShowPasswords}
                                staffId={member.id}
                              />
                            </DialogContent>
                          )}
                        </Dialog>

                        {/* Delete — prevent deleting own account */}
                        {adminMe?.id !== member.id ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 px-3">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove staff account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{member.name}</strong>'s login. They will no longer be able to access the dashboard.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteStaff(member.id)}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-300 cursor-not-allowed" disabled title="You cannot delete your own account">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===================== EHR TAB ===================== */}
        {mainTab === "ehr" && <EhrTab adminId={adminMe?.id} />}

        {/* ===================== BILLING TAB ===================== */}
        {mainTab === "billing" && <BillingTab />}

        {/* ===================== PHARMACY TAB ===================== */}
        {mainTab === "pharmacy" && <PharmacyTab />}

        {/* ===================== LAB TAB ===================== */}
        {mainTab === "lab" && <LabTab adminId={adminMe?.id} />}

        {/* ===================== SCHEDULES TAB ===================== */}
        {mainTab === "schedules" && <SchedulesTab adminId={adminMe?.id} />}

        {/* ===================== REPORTS TAB ===================== */}
        {mainTab === "reports" && <ReportsTab />}

        {/* ===================== AUDIT LOG TAB ===================== */}
        {mainTab === "audit-log" && <AuditLogTab />}

        {/* ===================== TRIAGE QUEUE TAB ===================== */}
        {mainTab === "queue" && <QueueTab staffId={adminMe?.id} />}

        {/* ===================== FOLLOW-UP TAB ===================== */}
        {mainTab === "followup" && <FollowUpTab />}

        {/* ===================== FEEDBACK TAB ===================== */}
        {mainTab === "feedback" && <FeedbackTab />}

      </main>
    </div>
  );
}
