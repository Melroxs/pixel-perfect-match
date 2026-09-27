/**
 * Domain types for the Atlas CRM + Dialer prototype.
 * These mirror the shapes a future backend API is expected to return.
 */

export type Id = string;

export type ContactStatus =
  | "New"
  | "Working"
  | "Qualified"
  | "Appointment"
  | "Customer"
  | "Unqualified"
  | "DNC";

export type CompanyStatus = "Prospect" | "Active" | "Customer" | "Inactive";

export type UserRole = "Admin" | "Manager" | "Agent";

export interface User {
  id: Id;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Invited" | "Disabled";
  lastActive: string;
  initials: string;
}

export interface Company {
  id: Id;
  name: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  status: CompanyStatus;
  assignedUserId: Id;
  primaryContactId?: Id | undefined;
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: Id;
  firstName: string;
  lastName: string;
  companyId?: Id | undefined;
  jobTitle: string;
  phone: string;
  additionalPhone?: string | undefined;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  leadSource: string;
  status: ContactStatus;
  assignedUserId: Id;
  tags: string[];
  notes: string;
  archived: boolean;
  createdAt: string;
  lastActivityAt?: string | undefined;
  nextFollowUpAt?: string | undefined;
}

export type CallDirection = "Outbound" | "Inbound";

export type CallStatus = "Completed" | "Missed" | "Failed" | "No Answer" | "Voicemail";

export type Disposition =
  | "Connected"
  | "No Answer"
  | "Busy"
  | "Voicemail"
  | "Wrong Number"
  | "Interested"
  | "Not Interested"
  | "Callback Requested"
  | "Appointment Booked"
  | "Do Not Contact";

export interface Call {
  id: Id;
  contactId?: Id | undefined;
  companyId?: Id | undefined;
  userId: Id;
  direction: CallDirection;
  phone: string;
  fromNumber: string;
  startedAt: string;
  durationSeconds: number;
  status: CallStatus;
  disposition?: Disposition | undefined;
  notes: string;
  campaignId?: Id | undefined;
  listId?: Id | undefined;
  hasRecording: boolean;
  relatedTaskId?: Id | undefined;
  relatedAppointmentId?: Id | undefined;
}

export type SmsDirection = "Outbound" | "Inbound";
export type SmsStatus = "Sending" | "Sent" | "Delivered" | "Failed" | "Received";

export interface SmsMessage {
  id: Id;
  contactId: Id;
  direction: SmsDirection;
  body: string;
  sentAt: string;
  status: SmsStatus;
  userId?: Id | undefined;
}

export type TaskType = "Call" | "SMS" | "Email" | "Appointment" | "General";
export type TaskPriority = "Low" | "Normal" | "High";
export type TaskStatus = "Open" | "Completed";

export interface Task {
  id: Id;
  type: TaskType;
  title: string;
  contactId?: Id | undefined;
  companyId?: Id | undefined;
  assignedUserId: Id;
  dueAt: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
  createdAt: string;
}

export type AppointmentStatus =
  | "Scheduled"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type AppointmentType =
  | "Discovery Call"
  | "Estimate"
  | "Site Visit"
  | "Demo"
  | "Follow-up"
  | "Closing Call";

export interface Appointment {
  id: Id;
  contactId?: Id | undefined;
  companyId?: Id | undefined;
  assignedUserId: Id;
  type: AppointmentType;
  startAt: string;
  endAt: string;
  timeZone: string;
  location: string;
  meetingLink: string;
  notes: string;
  status: AppointmentStatus;
}

export interface ContactList {
  id: Id;
  name: string;
  description: string;
  contactIds: Id[];
  assignedUserIds: Id[];
  status: "Active" | "Paused" | "Archived";
  createdAt: string;
}

export type CampaignStatus = "Draft" | "Active" | "Paused" | "Completed";

export interface Campaign {
  id: Id;
  name: string;
  listId?: Id | undefined;
  contactIds: Id[];
  assignedUserIds: Id[];
  callingNumber: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string | undefined;
  goal: string;
}

export interface PhoneNumber {
  id: Id;
  number: string;
  label: string;
  assignedUserId?: Id | undefined;
  status: "Active" | "Inactive";
  capabilities: Array<"Voice" | "SMS">;
  provider: string;
}

export interface Provider {
  id: Id;
  name: string;
  description: string;
  /** "Demo Connected" means simulated in this prototype — never a real connection. */
  connection: "Not Connected" | "Demo Connected" | "Coming Soon";
  connectionName?: string | undefined;
}

export type ActivityKind =
  | "call"
  | "sms"
  | "task"
  | "appointment"
  | "note"
  | "contact"
  | "system";

export interface Activity {
  id: Id;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: string;
  contactId?: Id | undefined;
  companyId?: Id | undefined;
  userId?: Id | undefined;
  refId?: Id | undefined;
}

export interface OrganizationSettings {
  name: string;
  website: string;
  industry: string;
  timeZone: string;
  defaultCountry: string;
  defaultCallingNumber: string;
  logoName?: string | undefined;
}

export interface CallingSettings {
  callerIdNumber: string;
  ringTimeoutSeconds: number;
  wrapUpSeconds: number;
  autoNextContact: boolean;
  voicemailDetection: boolean;
}

export interface SmsSettings {
  enabled: boolean;
  sendingNumber: string;
  signature: string;
  quietHours: boolean;
}

export interface RecordingSettings {
  enabled: boolean;
  recordInbound: boolean;
  recordOutbound: boolean;
  retentionDays: number;
  accessRole: UserRole;
}

export interface CalendarIntegration {
  /** "Demo Connected" is a simulated state — no real OAuth happens here. */
  google: "Not Connected" | "Demo Connected";
  googleCalendarName?: string | undefined;
  googleSyncEnabled: boolean;
  outlook: "Coming Soon";
}

export interface BillingInfo {
  plan: string;
  seats: number;
  seatsUsed: number;
  minutesIncluded: number;
  minutesUsed: number;
  smsIncluded: number;
  smsUsed: number;
  renewsOn: string;
  status: "Demo" ;
}

export interface Settings {
  organization: OrganizationSettings;
  calling: CallingSettings;
  sms: SmsSettings;
  recording: RecordingSettings;
  calendar: CalendarIntegration;
  billing: BillingInfo;
}

export type DialerPhase =
  | "idle"
  | "dialing"
  | "ringing"
  | "connected"
  | "hold"
  | "ended"
  | "failed"
  | "incoming";

export interface DialerState {
  phase: DialerPhase;
  activeContactId?: Id | undefined;
  manualNumber?: string | undefined;
  fromNumber: string;
  muted: boolean;
  transferring: boolean;
  seconds: number;
  notes: string;
  disposition?: Disposition | undefined;
  queueContactIds: Id[];
  queueIndex: number;
  queueSourceLabel?: string | undefined;
  lastCallId?: Id | undefined;
}

export interface CrmState {
  users: User[];
  currentUserId: Id;
  companies: Company[];
  contacts: Contact[];
  calls: Call[];
  sms: SmsMessage[];
  tasks: Task[];
  appointments: Appointment[];
  lists: ContactList[];
  campaigns: Campaign[];
  phoneNumbers: PhoneNumber[];
  providers: Provider[];
  activities: Activity[];
  settings: Settings;
  dialer: DialerState;
}
