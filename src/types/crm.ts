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
  primaryContactId?: Id;
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: Id;
  firstName: string;
  lastName: string;
  companyId?: Id;
  jobTitle: string;
  phone: string;
  additionalPhone?: string;
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
  lastActivityAt?: string;
  nextFollowUpAt?: string;
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
  contactId?: Id;
  companyId?: Id;
  userId: Id;
  direction: CallDirection;
  phone: string;
  fromNumber: string;
  startedAt: string;
  durationSeconds: number;
  status: CallStatus;
  disposition?: Disposition;
  notes: string;
  campaignId?: Id;
  listId?: Id;
  hasRecording: boolean;
  relatedTaskId?: Id;
  relatedAppointmentId?: Id;
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
  userId?: Id;
}

export type TaskType = "Call" | "SMS" | "Email" | "Appointment" | "General";
export type TaskPriority = "Low" | "Normal" | "High";
export type TaskStatus = "Open" | "Completed";

export interface Task {
  id: Id;
  type: TaskType;
  title: string;
  contactId?: Id;
  companyId?: Id;
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
  contactId?: Id;
  companyId?: Id;
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
  listId?: Id;
  contactIds: Id[];
  assignedUserIds: Id[];
  callingNumber: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  goal: string;
}

export interface PhoneNumber {
  id: Id;
  number: string;
  label: string;
  assignedUserId?: Id;
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
  connectionName?: string;
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
  contactId?: Id;
  companyId?: Id;
  userId?: Id;
  refId?: Id;
}

export interface OrganizationSettings {
  name: string;
  website: string;
  industry: string;
  timeZone: string;
  defaultCountry: string;
  defaultCallingNumber: string;
  logoName?: string;
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
  googleCalendarName?: string;
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
  activeContactId?: Id;
  manualNumber?: string;
  fromNumber: string;
  muted: boolean;
  transferring: boolean;
  seconds: number;
  notes: string;
  disposition?: Disposition;
  queueContactIds: Id[];
  queueIndex: number;
  queueSourceLabel?: string;
  lastCallId?: Id;
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
