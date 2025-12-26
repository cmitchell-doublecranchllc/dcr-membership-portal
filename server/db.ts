import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  members, InsertMember,
  checkIns, InsertCheckIn,
  contracts, InsertContract,
  contractSignatures, InsertContractSignature,
  contractAssignments, InsertContractAssignment,
  announcements, InsertAnnouncement,
  messages, InsertMessage,
  appointments, InsertAppointment
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Member Functions ============

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(members).values(member);
  return result;
}

export async function getMemberByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMember(id: number, updates: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(updates).where(eq(members.id, id));
}

export async function getChildrenByParentId(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(members).where(eq(members.parentId, parentId));
}

export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(members).orderBy(desc(members.createdAt));
}

// ============ Check-in Functions ============

export async function createCheckIn(checkIn: InsertCheckIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(checkIns).values(checkIn);
  return result;
}

export async function getRecentCheckIns(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(checkIns).orderBy(desc(checkIns.checkInTime)).limit(limit);
}

export async function getCheckInsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(checkIns).where(eq(checkIns.memberId, memberId)).orderBy(desc(checkIns.checkInTime));
}

export async function getTodayCheckIns() {
  const db = await getDb();
  if (!db) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  return await db.select().from(checkIns).where(gte(checkIns.checkInTime, todayStartMs)).orderBy(desc(checkIns.checkInTime));
}

// ============ Contract Functions ============

export async function createContract(contract: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contracts).values(contract);
  return result;
}

export async function getActiveContracts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.isActive, true)).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContract(id: number, updates: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contracts).set(updates).where(eq(contracts.id, id));
}

// ============ Contract Assignment Functions ============

export async function assignContract(assignment: InsertContractAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractAssignments).values(assignment);
  return result;
}

export async function getAssignmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractAssignments).where(eq(contractAssignments.memberId, memberId)).orderBy(desc(contractAssignments.createdAt));
}

export async function getUnsignedAssignmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractAssignments)
    .where(and(
      eq(contractAssignments.memberId, memberId),
      eq(contractAssignments.isSigned, false)
    ))
    .orderBy(desc(contractAssignments.createdAt));
}

export async function updateAssignment(id: number, updates: Partial<InsertContractAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractAssignments).set(updates).where(eq(contractAssignments.id, id));
}

// ============ Contract Signature Functions ============

export async function createSignature(signature: InsertContractSignature) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractSignatures).values(signature);
  return result;
}

export async function getSignaturesByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractSignatures).where(eq(contractSignatures.memberId, memberId)).orderBy(desc(contractSignatures.signedAt));
}

export async function getSignatureByContractAndMember(contractId: number, memberId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contractSignatures)
    .where(and(
      eq(contractSignatures.contractId, contractId),
      eq(contractSignatures.memberId, memberId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Announcement Functions ============

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(announcement);
  return result;
}

export async function getPublishedAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt));
}

export async function getAnnouncementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(updates).where(eq(announcements.id, id));
}

// ============ Message Functions ============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(eq(messages.recipientId, userId))
    .orderBy(desc(messages.sentAt));
}

export async function getConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(
      and(
        eq(messages.senderId, userId1),
        eq(messages.recipientId, userId2)
      )
    )
    .orderBy(desc(messages.sentAt));
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(messages)
    .where(and(
      eq(messages.recipientId, userId),
      eq(messages.isRead, false)
    ));
  return result.length;
}

// ============ Appointment Functions ============

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(appointment);
  return result;
}

export async function getAppointmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointments).where(eq(appointments.memberId, memberId)).orderBy(appointments.startTime);
}

export async function getUpcomingAppointments(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return await db.select().from(appointments)
    .where(and(
      eq(appointments.memberId, memberId),
      gte(appointments.startTime, now)
    ))
    .orderBy(appointments.startTime);
}

export async function upsertAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(appointments).values(appointment).onDuplicateKeyUpdate({
    set: {
      appointmentType: appointment.appointmentType,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      syncedAt: new Date(),
    }
  });
}
