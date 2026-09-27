/**
 * Mock service layer.
 *
 * Every function here is a placeholder for a future backend call. Signatures are
 * intentionally shaped like an API client (getContacts, createContact, ...) so the
 * implementation can be swapped for real requests without changing the UI.
 *
 * Nothing in this file talks to a network, a database, a telephony carrier, or a
 * calendar provider. All state lives in the in-memory demo store.
 */
import { getState, nextId, setState } from "@/store/demo-store";
import type {
  Activity,
  ActivityKind,
  Appointment,
  AppointmentStatus,
  Call,
  Campaign,
  CampaignStatus,
  Company,
  Contact,
  ContactList,
  CrmState,
  DialerPhase,
  Disposition,
  Id,
  PhoneNumber,
  Settings,
  SmsMessage,
  Task,
  User,
  UserRole,
} from "@/types/crm";

/* ------------------------------------------------------------------ helpers */

function logActivity(entry: {
  kind: ActivityKind;
  title: string;
  detail: string;
  contactId?: Id;
  companyId?: Id;
  userId?: Id;
  refId?: Id;
  at?: string;
}): Activity {
  const activity: Activity = {
    id: nextId("act"),
    at: entry.at ?? new Date().toISOString(),
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    contactId: entry.contactId,
    companyId: entry.companyId,
    userId: entry.userId ?? getState().currentUserId,
    refId: entry.refId,
  };
  setState((s) => ({ ...s, activities: [activity, ...s.activities] }));
  return activity;
}

function touchContact(contactId: Id | undefined, patch: Partial<Contact> = {}): void {
  if (!contactId) return;
  setState((s) => ({
    ...s,
    contacts: s.contacts.map((c) =>
      c.id === contactId ? { ...c, lastActivityAt: new Date().toISOString(), ...patch } : c,
    ),
  }));
}

export const mockActivityService = {
  getActivities(): Activity[] {
    return getState().activities;
  },
  getForContact(contactId: Id): Activity[] {
    return getState().activities.filter((a) => a.contactId === contactId);
  },
  getForCompany(companyId: Id): Activity[] {
    return getState().activities.filter((a) => a.companyId === companyId);
  },
  log: logActivity,
};

/* ----------------------------------------------------------------- contacts */

export interface ContactInput {
  firstName: string;
  lastName: string;
  companyId?: Id;
  companyName?: string;
  jobTitle?: string;
  phone: string;
  additionalPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  leadSource?: string;
  status?: Contact["status"];
  assignedUserId?: Id;
  tags?: string[];
  notes?: string;
}

export const mockContactService = {
  getContacts(): Contact[] {
    return getState().contacts;
  },
  getContact(id: Id): Contact | undefined {
    return getState().contacts.find((c) => c.id === id);
  },
  createContact(input: ContactInput): Contact {
    const s = getState();
    let companyId = input.companyId;
    if (!companyId && input.companyName?.trim()) {
      const existing = s.companies.find(
        (co) => co.name.toLowerCase() === input.companyName!.trim().toLowerCase(),
      );
      companyId = existing?.id;
    }
    const contact: Contact = {
      id: nextId("c"),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      companyId,
      jobTitle: input.jobTitle ?? "",
      phone: input.phone.trim(),
      additionalPhone: input.additionalPhone,
      email: input.email ?? "",
      address: input.address ?? "",
      city: input.city ?? "",
      state: input.state ?? "",
      zip: input.zip ?? "",
      country: input.country ?? s.settings.organization.defaultCountry,
      leadSource: input.leadSource ?? "Manual Entry",
      status: input.status ?? "New",
      assignedUserId: input.assignedUserId ?? s.currentUserId,
      tags: input.tags ?? [],
      notes: input.notes ?? "",
      archived: false,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, contacts: [contact, ...current.contacts] }));
    logActivity({
      kind: "contact",
      title: "Contact created",
      detail: `${contact.firstName} ${contact.lastName} added`,
      contactId: contact.id,
      companyId: contact.companyId,
    });
    return contact;
  },
  updateContact(id: Id, patch: Partial<Contact>): void {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },
  archiveContacts(ids: Id[]): void {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) => (ids.includes(c.id) ? { ...c, archived: true } : c)),
    }));
  },
  assignContacts(ids: Id[], userId: Id): void {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) =>
        ids.includes(c.id) ? { ...c, assignedUserId: userId } : c,
      ),
    }));
  },
  addTag(ids: Id[], tag: string): void {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) =>
        ids.includes(c.id) && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c,
      ),
    }));
  },
  removeTag(ids: Id[], tag: string): void {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) =>
        ids.includes(c.id) ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c,
      ),
    }));
  },
  addNote(contactId: Id, note: string): void {
    const trimmed = note.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) =>
        c.id === contactId
          ? { ...c, notes: c.notes ? `${c.notes}\n\n${trimmed}` : trimmed }
          : c,
      ),
    }));
    const contact = getState().contacts.find((c) => c.id === contactId);
    logActivity({
      kind: "note",
      title: "Note added",
      detail: trimmed,
      contactId,
      companyId: contact?.companyId,
    });
  },
  markDoNotContact(contactId: Id): void {
    mockContactService.updateContact(contactId, { status: "DNC" });
    mockContactService.addTag([contactId], "Do Not Contact");
    const contact = getState().contacts.find((c) => c.id === contactId);
    logActivity({
      kind: "system",
      title: "Marked Do Not Contact",
      detail: "Contact removed from all calling queues",
      contactId,
      companyId: contact?.companyId,
    });
  },
};

/* ---------------------------------------------------------------- companies */

export const mockCompanyService = {
  getCompanies(): Company[] {
    return getState().companies;
  },
  getCompany(id: Id): Company | undefined {
    return getState().companies.find((c) => c.id === id);
  },
  createCompany(input: Partial<Company> & { name: string }): Company {
    const s = getState();
    const company: Company = {
      id: nextId("co"),
      name: input.name.trim(),
      industry: input.industry ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      website: input.website ?? "",
      city: input.city ?? "",
      state: input.state ?? "",
      status: input.status ?? "Prospect",
      assignedUserId: input.assignedUserId ?? s.currentUserId,
      notes: input.notes ?? "",
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, companies: [company, ...current.companies] }));
    logActivity({
      kind: "system",
      title: "Company created",
      detail: company.name,
      companyId: company.id,
    });
    return company;
  },
  updateCompany(id: Id, patch: Partial<Company>): void {
    setState((s) => ({
      ...s,
      companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },
  getContacts(companyId: Id): Contact[] {
    return getState().contacts.filter((c) => c.companyId === companyId && !c.archived);
  },
};

/* -------------------------------------------------------------------- calls */

export const mockCallService = {
  getCalls(): Call[] {
    return getState().calls;
  },
  getCall(id: Id): Call | undefined {
    return getState().calls.find((c) => c.id === id);
  },
  getForContact(contactId: Id): Call[] {
    return getState().calls.filter((c) => c.contactId === contactId);
  },
  /** Records a simulated call. No carrier is contacted. */
  logCall(input: {
    contactId?: Id;
    phone: string;
    fromNumber: string;
    direction?: Call["direction"];
    durationSeconds: number;
    status: Call["status"];
    notes?: string;
    campaignId?: Id;
    listId?: Id;
  }): Call {
    const s = getState();
    const contact = input.contactId
      ? s.contacts.find((c) => c.id === input.contactId)
      : undefined;
    const call: Call = {
      id: nextId("call"),
      contactId: input.contactId,
      companyId: contact?.companyId,
      userId: s.currentUserId,
      direction: input.direction ?? "Outbound",
      phone: input.phone,
      fromNumber: input.fromNumber,
      startedAt: new Date().toISOString(),
      durationSeconds: input.durationSeconds,
      status: input.status,
      notes: input.notes ?? "",
      campaignId: input.campaignId,
      listId: input.listId,
      hasRecording: s.settings.recording.enabled && input.durationSeconds > 0,
    };
    setState((current) => ({ ...current, calls: [call, ...current.calls] }));
    return call;
  },
  saveDisposition(callId: Id, disposition: Disposition, notes?: string): void {
    setState((s) => ({
      ...s,
      calls: s.calls.map((c) =>
        c.id === callId
          ? { ...c, disposition, notes: notes !== undefined ? notes : c.notes }
          : c,
      ),
    }));
    const call = getState().calls.find((c) => c.id === callId);
    if (!call) return;
    logActivity({
      kind: "call",
      title: call.durationSeconds > 0 ? "Call completed" : "Call attempted",
      detail: `Duration ${formatDuration(call.durationSeconds)} · Disposition: ${disposition}`,
      contactId: call.contactId,
      companyId: call.companyId,
      refId: call.id,
    });
    touchContact(call.contactId);
    if (disposition === "Do Not Contact" && call.contactId) {
      mockContactService.markDoNotContact(call.contactId);
    }
    if (disposition === "Interested" && call.contactId) {
      mockContactService.updateContact(call.contactId, { status: "Qualified" });
    }
  },
  linkTask(callId: Id, taskId: Id): void {
    setState((s) => ({
      ...s,
      calls: s.calls.map((c) => (c.id === callId ? { ...c, relatedTaskId: taskId } : c)),
    }));
  },
  linkAppointment(callId: Id, appointmentId: Id): void {
    setState((s) => ({
      ...s,
      calls: s.calls.map((c) =>
        c.id === callId ? { ...c, relatedAppointmentId: appointmentId } : c,
      ),
    }));
  },
  logMissedCall(contactId: Id | undefined, phone: string): Call {
    const call = mockCallService.logCall({
      contactId,
      phone,
      fromNumber: getState().settings.calling.callerIdNumber,
      direction: "Inbound",
      durationSeconds: 0,
      status: "Missed",
      notes: "Declined — missed call logged.",
    });
    logActivity({
      kind: "call",
      title: "Missed call",
      detail: `Inbound call from ${phone} declined`,
      contactId,
      companyId: call.companyId,
      refId: call.id,
    });
    return call;
  },
};

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/* --------------------------------------------------------------------- SMS */

export const mockSmsService = {
  getThread(contactId: Id): SmsMessage[] {
    return getState()
      .sms.filter((m) => m.contactId === contactId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  },
  /** Adds a message to local state only — no carrier is contacted. */
  sendSms(contactId: Id, body: string): SmsMessage {
    const message: SmsMessage = {
      id: nextId("s"),
      contactId,
      direction: "Outbound",
      body,
      sentAt: new Date().toISOString(),
      status: "Sending",
      userId: getState().currentUserId,
    };
    setState((s) => ({ ...s, sms: [...s.sms, message] }));
    const contact = getState().contacts.find((c) => c.id === contactId);
    logActivity({
      kind: "sms",
      title: "SMS sent",
      detail: body,
      contactId,
      companyId: contact?.companyId,
      refId: message.id,
    });
    touchContact(contactId);
    // Simulated delivery progression for the prototype.
    setTimeout(() => mockSmsService.setStatus(message.id, "Sent"), 500);
    setTimeout(() => mockSmsService.setStatus(message.id, "Delivered"), 1600);
    return message;
  },
  setStatus(id: Id, status: SmsMessage["status"]): void {
    setState((s) => ({
      ...s,
      sms: s.sms.map((m) => (m.id === id ? { ...m, status } : m)),
    }));
  },
};

/* -------------------------------------------------------------------- tasks */

export interface TaskInput {
  type: Task["type"];
  title?: string;
  contactId?: Id;
  companyId?: Id;
  assignedUserId?: Id;
  dueAt: string;
  priority?: Task["priority"];
  notes?: string;
}

export const mockTaskService = {
  getTasks(): Task[] {
    return getState().tasks;
  },
  getForContact(contactId: Id): Task[] {
    return getState().tasks.filter((t) => t.contactId === contactId);
  },
  createTask(input: TaskInput): Task {
    const s = getState();
    const contact = input.contactId
      ? s.contacts.find((c) => c.id === input.contactId)
      : undefined;
    const title =
      input.title?.trim() ||
      `${input.type} ${contact ? `${contact.firstName} ${contact.lastName}` : "task"}`;
    const task: Task = {
      id: nextId("t"),
      type: input.type,
      title,
      contactId: input.contactId,
      companyId: input.companyId ?? contact?.companyId,
      assignedUserId: input.assignedUserId ?? s.currentUserId,
      dueAt: input.dueAt,
      priority: input.priority ?? "Normal",
      status: "Open",
      notes: input.notes ?? "",
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    logActivity({
      kind: "task",
      title: "Follow-up created",
      detail: `${task.title} · due ${new Date(task.dueAt).toLocaleString()}`,
      contactId: task.contactId,
      companyId: task.companyId,
      refId: task.id,
    });
    if (task.contactId && task.type === "Call") {
      touchContact(task.contactId, { nextFollowUpAt: task.dueAt });
    } else {
      touchContact(task.contactId);
    }
    return task;
  },
  completeTask(id: Id): void {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)),
    }));
    const task = getState().tasks.find((t) => t.id === id);
    if (task) {
      logActivity({
        kind: "task",
        title: "Task completed",
        detail: task.title,
        contactId: task.contactId,
        companyId: task.companyId,
        refId: task.id,
      });
    }
  },
  reopenTask(id: Id): void {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "Open" } : t)),
    }));
  },
  updateTask(id: Id, patch: Partial<Task>): void {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },
};

/* ------------------------------------------------------------- appointments */

export interface AppointmentInput {
  contactId?: Id;
  companyId?: Id;
  assignedUserId?: Id;
  type: Appointment["type"];
  startAt: string;
  endAt: string;
  timeZone?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export const mockAppointmentService = {
  getAppointments(): Appointment[] {
    return getState().appointments;
  },
  getForContact(contactId: Id): Appointment[] {
    return getState().appointments.filter((a) => a.contactId === contactId);
  },
  createAppointment(input: AppointmentInput): Appointment {
    const s = getState();
    const contact = input.contactId
      ? s.contacts.find((c) => c.id === input.contactId)
      : undefined;
    const appointment: Appointment = {
      id: nextId("ap"),
      contactId: input.contactId,
      companyId: input.companyId ?? contact?.companyId,
      assignedUserId: input.assignedUserId ?? s.currentUserId,
      type: input.type,
      startAt: input.startAt,
      endAt: input.endAt,
      timeZone: input.timeZone ?? s.settings.organization.timeZone,
      location: input.location ?? "Phone",
      meetingLink: input.meetingLink ?? "",
      notes: input.notes ?? "",
      status: input.status ?? "Scheduled",
    };
    setState((current) => ({
      ...current,
      appointments: [appointment, ...current.appointments],
    }));
    logActivity({
      kind: "appointment",
      title: "Appointment booked",
      detail: `${appointment.type} · ${new Date(appointment.startAt).toLocaleString()}`,
      contactId: appointment.contactId,
      companyId: appointment.companyId,
      refId: appointment.id,
    });
    if (appointment.contactId) {
      mockContactService.updateContact(appointment.contactId, { status: "Appointment" });
      touchContact(appointment.contactId);
    }
    return appointment;
  },
  updateAppointment(id: Id, patch: Partial<Appointment>): void {
    setState((s) => ({
      ...s,
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },
  setStatus(id: Id, status: AppointmentStatus): void {
    mockAppointmentService.updateAppointment(id, { status });
  },
};

/* ------------------------------------------------------------------- lists */

export const mockListService = {
  getLists(): ContactList[] {
    return getState().lists;
  },
  getList(id: Id): ContactList | undefined {
    return getState().lists.find((l) => l.id === id);
  },
  createList(input: { name: string; description?: string; contactIds?: Id[] }): ContactList {
    const list: ContactList = {
      id: nextId("l"),
      name: input.name.trim(),
      description: input.description ?? "",
      contactIds: input.contactIds ?? [],
      assignedUserIds: [getState().currentUserId],
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, lists: [list, ...s.lists] }));
    return list;
  },
  updateList(id: Id, patch: Partial<ContactList>): void {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  },
  addContacts(listId: Id, contactIds: Id[]): void {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, contactIds: Array.from(new Set([...l.contactIds, ...contactIds])) }
          : l,
      ),
    }));
  },
  removeContacts(listId: Id, contactIds: Id[]): void {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, contactIds: l.contactIds.filter((id) => !contactIds.includes(id)) }
          : l,
      ),
    }));
  },
};

/* --------------------------------------------------------------- campaigns */

export const mockCampaignService = {
  getCampaigns(): Campaign[] {
    return getState().campaigns;
  },
  getCampaign(id: Id): Campaign | undefined {
    return getState().campaigns.find((c) => c.id === id);
  },
  createCampaign(input: {
    name: string;
    listId?: Id;
    callingNumber: string;
    goal?: string;
    startDate?: string;
  }): Campaign {
    const s = getState();
    const list = input.listId ? s.lists.find((l) => l.id === input.listId) : undefined;
    const campaign: Campaign = {
      id: nextId("cmp"),
      name: input.name.trim(),
      listId: input.listId,
      contactIds: list ? [...list.contactIds] : [],
      assignedUserIds: [s.currentUserId],
      callingNumber: input.callingNumber,
      status: "Draft",
      startDate: input.startDate ?? new Date().toISOString(),
      goal: input.goal ?? "",
    };
    setState((current) => ({ ...current, campaigns: [campaign, ...current.campaigns] }));
    return campaign;
  },
  setStatus(id: Id, status: CampaignStatus): void {
    setState((s) => ({
      ...s,
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  },
  addContacts(id: Id, contactIds: Id[]): void {
    setState((s) => ({
      ...s,
      campaigns: s.campaigns.map((c) =>
        c.id === id
          ? { ...c, contactIds: Array.from(new Set([...c.contactIds, ...contactIds])) }
          : c,
      ),
    }));
  },
  getMetrics(id: Id) {
    const s = getState();
    const campaign = s.campaigns.find((c) => c.id === id);
    if (!campaign) return { contacts: 0, calls: 0, connections: 0, appointments: 0 };
    const calls = s.calls.filter((c) => c.campaignId === id);
    return {
      contacts: campaign.contactIds.length,
      calls: calls.length,
      connections: calls.filter((c) => c.durationSeconds > 0).length,
      appointments: s.appointments.filter(
        (a) => a.contactId && campaign.contactIds.includes(a.contactId),
      ).length,
    };
  },
};

/* --------------------------------------------------------------- telephony */

/**
 * Simulated dialer. Phase transitions are driven by timers in the UI; no
 * telephony provider is involved at any point.
 */
export const mockDialerService = {
  setPhase(phase: DialerPhase): void {
    setState((s) => ({ ...s, dialer: { ...s.dialer, phase } }));
  },
  patch(patch: Partial<CrmState["dialer"]>): void {
    setState((s) => ({ ...s, dialer: { ...s.dialer, ...patch } }));
  },
  selectContact(contactId: Id): void {
    setState((s) => ({
      ...s,
      dialer: {
        ...s.dialer,
        activeContactId: contactId,
        manualNumber: undefined,
        phase: "idle",
        seconds: 0,
        notes: "",
        disposition: undefined,
        muted: false,
        transferring: false,
        lastCallId: undefined,
        queueIndex: s.dialer.queueContactIds.includes(contactId)
          ? s.dialer.queueContactIds.indexOf(contactId)
          : s.dialer.queueIndex,
        queueContactIds: s.dialer.queueContactIds.includes(contactId)
          ? s.dialer.queueContactIds
          : [contactId, ...s.dialer.queueContactIds],
      },
    }));
  },
  setQueue(contactIds: Id[], sourceLabel: string, fromNumber?: string): void {
    setState((s) => ({
      ...s,
      dialer: {
        ...s.dialer,
        queueContactIds: contactIds,
        queueIndex: 0,
        queueSourceLabel: sourceLabel,
        activeContactId: contactIds[0],
        fromNumber: fromNumber ?? s.dialer.fromNumber,
        phase: "idle",
        seconds: 0,
        notes: "",
        disposition: undefined,
        lastCallId: undefined,
      },
    }));
  },
  nextContact(): void {
    setState((s) => {
      const nextIndex = Math.min(s.dialer.queueIndex + 1, s.dialer.queueContactIds.length - 1);
      return {
        ...s,
        dialer: {
          ...s.dialer,
          queueIndex: nextIndex,
          activeContactId: s.dialer.queueContactIds[nextIndex],
          phase: "idle",
          seconds: 0,
          notes: "",
          disposition: undefined,
          muted: false,
          transferring: false,
          lastCallId: undefined,
          manualNumber: undefined,
        },
      };
    });
  },
  endCall(status: Call["status"] = "Completed"): Call | undefined {
    const s = getState();
    const d = s.dialer;
    const contact = d.activeContactId
      ? s.contacts.find((c) => c.id === d.activeContactId)
      : undefined;
    const phone = d.manualNumber ?? contact?.phone;
    if (!phone) {
      mockDialerService.patch({ phase: "ended" });
      return undefined;
    }
    const call = mockCallService.logCall({
      contactId: contact?.id,
      phone,
      fromNumber: d.fromNumber,
      durationSeconds: status === "Completed" ? d.seconds : 0,
      status,
      notes: d.notes,
    });
    mockDialerService.patch({
      phase: status === "Failed" ? "failed" : "ended",
      lastCallId: call.id,
    });
    return call;
  },
  reset(): void {
    setState((s) => ({
      ...s,
      dialer: {
        ...s.dialer,
        phase: "idle",
        seconds: 0,
        muted: false,
        transferring: false,
        notes: "",
        disposition: undefined,
        lastCallId: undefined,
      },
    }));
  },
};

/* --------------------------------------------------------------- providers */

export const mockProviderService = {
  getProviders() {
    return getState().providers;
  },
  /**
   * Simulates a provider connection. Credentials entered in the UI are never
   * stored or transmitted — only a "Demo Connected" flag is set locally.
   */
  connectProvider(providerId: Id, connectionName: string): void {
    setState((s) => ({
      ...s,
      providers: s.providers.map((p) =>
        p.id === providerId
          ? { ...p, connection: "Demo Connected", connectionName }
          : p,
      ),
    }));
  },
  disconnectProvider(providerId: Id): void {
    setState((s) => ({
      ...s,
      providers: s.providers.map((p) =>
        p.id === providerId
          ? { ...p, connection: "Not Connected", connectionName: undefined }
          : p,
      ),
    }));
  },
  getPhoneNumbers(): PhoneNumber[] {
    return getState().phoneNumbers;
  },
  /** Returns fabricated inventory — no provider search is performed. */
  searchAvailableNumbers(query: { country: string; areaCode: string; locality: string }) {
    const seeds = ["1188", "2240", "3317", "4409", "5521", "6673"];
    const area = query.areaCode || "303";
    return seeds.map((seed, i) => ({
      id: `avail_${area}${seed}`,
      number: `+1 ${area} 555 ${seed}`,
      locality: query.locality || ["Denver", "Boulder", "Aurora"][i % 3],
      monthlyPrice: i % 2 === 0 ? "$1.15" : "$1.40",
      capabilities: ["Voice", "SMS"] as Array<"Voice" | "SMS">,
    }));
  },
  buyNumber(input: { number: string; label: string }): PhoneNumber {
    const pn: PhoneNumber = {
      id: nextId("pn"),
      number: input.number,
      label: input.label || "New Number",
      status: "Active",
      capabilities: ["Voice", "SMS"],
      provider: "Demo Inventory",
    };
    setState((s) => ({ ...s, phoneNumbers: [...s.phoneNumbers, pn] }));
    return pn;
  },
  assignNumber(id: Id, userId?: Id): void {
    setState((s) => ({
      ...s,
      phoneNumbers: s.phoneNumbers.map((p) =>
        p.id === id ? { ...p, assignedUserId: userId } : p,
      ),
    }));
  },
  releaseNumber(id: Id): void {
    setState((s) => ({
      ...s,
      phoneNumbers: s.phoneNumbers.filter((p) => p.id !== id),
    }));
  },
  updateNumber(id: Id, patch: Partial<PhoneNumber>): void {
    setState((s) => ({
      ...s,
      phoneNumbers: s.phoneNumbers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },
};

/* ---------------------------------------------------------------- calendar */

export const mockCalendarService = {
  getIntegration() {
    return getState().settings.calendar;
  },
  /** Simulated connection only — no OAuth flow is performed. */
  connectGoogle(calendarName = "Melissa's Calendar"): void {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        calendar: {
          ...s.settings.calendar,
          google: "Demo Connected",
          googleCalendarName: calendarName,
          googleSyncEnabled: true,
        },
      },
    }));
  },
  disconnectGoogle(): void {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        calendar: {
          ...s.settings.calendar,
          google: "Not Connected",
          googleCalendarName: undefined,
          googleSyncEnabled: false,
        },
      },
    }));
  },
  setSync(enabled: boolean): void {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        calendar: { ...s.settings.calendar, googleSyncEnabled: enabled },
      },
    }));
  },
};

/* ----------------------------------------------------------------- users */

export const mockUserService = {
  getUsers(): User[] {
    return getState().users;
  },
  getUser(id: Id): User | undefined {
    return getState().users.find((u) => u.id === id);
  },
  inviteUser(input: { name: string; email: string; role: UserRole }): User {
    const user: User = {
      id: nextId("u"),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      status: "Invited",
      lastActive: new Date().toISOString(),
      initials: input.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    setState((s) => ({ ...s, users: [...s.users, user] }));
    return user;
  },
  updateUser(id: Id, patch: Partial<User>): void {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  },
  removeUser(id: Id): void {
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  },
};

/* -------------------------------------------------------------- settings */

export const mockSettingsService = {
  getSettings(): Settings {
    return getState().settings;
  },
  updateOrganization(patch: Partial<Settings["organization"]>): void {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, organization: { ...s.settings.organization, ...patch } },
    }));
  },
  updateCalling(patch: Partial<Settings["calling"]>): void {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, calling: { ...s.settings.calling, ...patch } },
    }));
  },
  updateSms(patch: Partial<Settings["sms"]>): void {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, sms: { ...s.settings.sms, ...patch } },
    }));
  },
  updateRecording(patch: Partial<Settings["recording"]>): void {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, recording: { ...s.settings.recording, ...patch } },
    }));
  },
};

/* ----------------------------------------------------------------- search */

export interface SearchResult {
  id: string;
  group: "Contacts" | "Companies" | "Tasks" | "Appointments";
  title: string;
  subtitle: string;
  to: string;
  params?: Record<string, string>;
}

export const mockSearchService = {
  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const s = getState();
    const results: SearchResult[] = [];

    for (const c of s.contacts) {
      const company = s.companies.find((co) => co.id === c.companyId);
      const haystack = `${c.firstName} ${c.lastName} ${c.phone} ${c.email} ${company?.name ?? ""}`;
      if (haystack.toLowerCase().includes(q)) {
        results.push({
          id: c.id,
          group: "Contacts",
          title: `${c.firstName} ${c.lastName}`,
          subtitle: `${company?.name ?? "No company"} · ${c.phone}`,
          to: "/contacts/$contactId",
          params: { contactId: c.id },
        });
      }
    }
    for (const co of s.companies) {
      if (`${co.name} ${co.phone} ${co.email}`.toLowerCase().includes(q)) {
        results.push({
          id: co.id,
          group: "Companies",
          title: co.name,
          subtitle: `${co.industry} · ${co.phone}`,
          to: "/companies/$companyId",
          params: { companyId: co.id },
        });
      }
    }
    for (const t of s.tasks) {
      if (t.title.toLowerCase().includes(q)) {
        results.push({
          id: t.id,
          group: "Tasks",
          title: t.title,
          subtitle: `${t.type} · due ${new Date(t.dueAt).toLocaleString()}`,
          to: "/tasks",
        });
      }
    }
    for (const a of s.appointments) {
      const contact = s.contacts.find((c) => c.id === a.contactId);
      const label = contact ? `${contact.firstName} ${contact.lastName}` : a.type;
      if (`${label} ${a.type}`.toLowerCase().includes(q)) {
        results.push({
          id: a.id,
          group: "Appointments",
          title: `${label} — ${a.type}`,
          subtitle: new Date(a.startAt).toLocaleString(),
          to: "/appointments",
        });
      }
    }
    return results.slice(0, 12);
  },
};
