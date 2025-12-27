import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { sendEmail, getEventRsvpConfirmationEmail } from "./_core/email";
import { format } from "date-fns";
import * as recurringEvents from "./recurringEvents";
import { generateCalendarExport } from "./calendarExport";
import * as lessonScheduling from "./lessonScheduling";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or staff access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  members: router({
    // Get current member profile
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      return member || null;
    }),

    // Create or update member profile
    upsertProfile: protectedProcedure
      .input(z.object({
        membershipTier: z.enum(["bronze", "silver", "gold"]).optional(),
        phone: z.string().optional(),
        emergencyContact: z.string().optional(),
        acuityClientId: z.string().optional(),
        dateOfBirth: z.number().optional(), // Unix timestamp
      }))
      .mutation(async ({ ctx, input }) => {
        const existingMember = await db.getMemberByUserId(ctx.user.id);
        
        if (existingMember) {
          await db.updateMember(existingMember.id, {
            ...input,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          });
          return { success: true, memberId: existingMember.id };
        } else {
          const result = await db.createMember({
            userId: ctx.user.id,
            membershipTier: input.membershipTier || "bronze",
            phone: input.phone,
            emergencyContact: input.emergencyContact,
            acuityClientId: input.acuityClientId,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            isChild: false,
          });
          return { success: true, memberId: result };
        }
      }),

    // Get children for parent
    getMyChildren: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getChildrenByParentId(member.id);
    }),

    // Add a child
    addChild: protectedProcedure
      .input(z.object({
        name: z.string(),
        dateOfBirth: z.number().optional(),
        emergencyContact: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const parentMember = await db.getMemberByUserId(ctx.user.id);
        if (!parentMember) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent member profile not found' });
        }

        // Create a placeholder user for the child
        const childUser = await db.getUserById(0); // This is a placeholder, we'll need to handle child accounts differently
        
        const result = await db.createMember({
          userId: ctx.user.id, // Link to parent's user ID for now
          parentId: parentMember.id,
          isChild: true,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          emergencyContact: input.emergencyContact,
          membershipTier: parentMember.membershipTier, // Inherit parent's tier
        });

        return { success: true, childId: result };
      }),

    // Admin: Get all members
    getAllMembers: adminProcedure.query(async () => {
      return await db.getAllMembers();
    }),

    // Admin: Update member tier
    updateMemberTier: adminProcedure
      .input(z.object({
        memberId: z.number(),
        tier: z.enum(["bronze", "silver", "gold"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateMember(input.memberId, { membershipTier: input.tier });
        return { success: true };
      }),

    // Instructor: Get all students with riding experience info
    getAllStudentsWithRidingInfo: adminProcedure.query(async () => {
      return await db.getAllStudentsWithRidingInfo();
    }),
  }),

  checkIns: router({
    // Member checks in
    checkIn: protectedProcedure
      .input(z.object({
        memberId: z.number().optional(), // If parent is checking in a child
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        const targetMemberId = input.memberId || member.id;
        
        // Verify parent can check in this child
        if (input.memberId) {
          const child = await db.getMemberById(input.memberId);
          if (!child || child.parentId !== member.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot check in this member' });
          }
        }

        await db.createCheckIn({
          memberId: targetMemberId,
          checkedInBy: ctx.user.id,
          checkInTime: Date.now(),
          notes: input.notes,
        });

        return { success: true, checkInTime: Date.now() };
      }),

    // Get my check-in history
    getMyCheckIns: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getCheckInsByMemberId(member.id);
    }),

    // Admin: Get today's check-ins
    getTodayCheckIns: adminProcedure.query(async () => {
      return await db.getTodayCheckIns();
    }),

    // Admin: Get recent check-ins
    getRecentCheckIns: adminProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await db.getRecentCheckIns(input.limit);
      }),
  }),

  contracts: router({
    // Get my assigned contracts
    getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getAssignmentsByMemberId(member.id);
    }),

    // Get unsigned contracts
    getUnsignedContracts: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getUnsignedAssignmentsByMemberId(member.id);
    }),

    // Get contract details
    getContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContractById(input.contractId);
      }),

    // Sign a contract
    signContract: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        assignmentId: z.number(),
        signatureData: z.string(), // Base64 encoded signature
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Create signature record
        await db.createSignature({
          contractId: input.contractId,
          memberId: member.id,
          signedBy: ctx.user.id,
          signatureData: input.signatureData,
          signedAt: Date.now(),
          ipAddress: ctx.req.ip,
        });

        // Update assignment as signed
        await db.updateAssignment(input.assignmentId, { isSigned: true });

        return { success: true };
      }),

    // Get my signed contracts
    getMySignatures: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getSignaturesByMemberId(member.id);
    }),

    // Admin: Create contract
    createContract: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        googleDocId: z.string().optional(),
        googleDocUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createContract({
          title: input.title,
          description: input.description,
          googleDocId: input.googleDocId,
          googleDocUrl: input.googleDocUrl,
          isActive: true,
          requiresSignature: true,
        });
        return { success: true, contractId: Number(result[0].insertId) };
      }),

    // Admin: Assign contract to member
    assignContract: adminProcedure
      .input(z.object({
        contractId: z.number(),
        memberId: z.number(),
        dueDate: z.number().optional(), // Unix timestamp
      }))
      .mutation(async ({ ctx, input }) => {
        await db.assignContract({
          contractId: input.contractId,
          memberId: input.memberId,
          assignedBy: ctx.user.id,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          isSigned: false,
          reminderSent: false,
        });
        return { success: true };
      }),

    // Admin: Get all contracts
    getAllContracts: adminProcedure.query(async () => {
      return await db.getActiveContracts();
    }),
  }),

  announcements: router({
    // Get published announcements
    getAnnouncements: protectedProcedure.query(async () => {
      return await db.getPublishedAnnouncements();
    }),

    // Admin: Create announcement
    createAnnouncement: adminProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        targetTiers: z.array(z.enum(["bronze", "silver", "gold"])).optional(),
        publish: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createAnnouncement({
          title: input.title,
          content: input.content,
          authorId: ctx.user.id,
          targetTiers: input.targetTiers ? JSON.stringify(input.targetTiers) : null,
          isPublished: input.publish,
          publishedAt: input.publish ? new Date() : undefined,
        });
        return { success: true, announcementId: Number(result[0].insertId) };
      }),

    // Admin: Publish announcement
    publishAnnouncement: adminProcedure
      .input(z.object({ announcementId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAnnouncement(input.announcementId, {
          isPublished: true,
          publishedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  messages: router({
    // Get my messages
    getMyMessages: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMessagesByUserId(ctx.user.id);
    }),

    // Send a message
    sendMessage: protectedProcedure
      .input(z.object({
        recipientId: z.number(),
        subject: z.string().optional(),
        content: z.string(),
        parentMessageId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          subject: input.subject,
          content: input.content,
          parentMessageId: input.parentMessageId,
          sentAt: Date.now(),
          isRead: false,
        });
        return { success: true };
      }),

    // Mark message as read
    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.messageId);
        return { success: true };
      }),

    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadMessageCount(ctx.user.id);
    }),
  }),

  events: router({
    // Get upcoming published events
    getUpcomingEvents: protectedProcedure.query(async () => {
      return await db.getUpcomingEvents();
    }),

    // Get all published events
    getPublishedEvents: protectedProcedure.query(async () => {
      return await db.getPublishedEvents();
    }),

    // Get event details
    getEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventById(input.eventId);
      }),

    // Get calendar export links for an event
    getCalendarExport: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        const calendarEvent = {
          title: event.title,
          description: event.description || undefined,
          location: event.location || undefined,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
        };

        return generateCalendarExport(calendarEvent);
      }),

    // Get my RSVPs
    getMyRsvps: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getRsvpsByMemberId(member.id);
    }),

    // Get RSVP status for an event
    getMyRsvpForEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) return null;
        return await db.getRsvpByEventAndMember(input.eventId, member.id);
      }),

    // Create or update RSVP
    rsvpToEvent: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        status: z.enum(["attending", "not_attending", "maybe"]),
        guestCount: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        // Check if RSVP already exists
        const existingRsvp = await db.getRsvpByEventAndMember(input.eventId, member.id);

        if (existingRsvp) {
          // Update existing RSVP
          await db.updateRsvp(existingRsvp.id, {
            status: input.status,
            guestCount: input.guestCount,
            notes: input.notes,
          });
          return { success: true, rsvpId: existingRsvp.id };
        } else {
          // Check capacity if attending
          if (input.status === "attending" && event.capacity) {
            const currentCount = await db.getEventAttendeeCount(input.eventId);
            const requestedSpots = 1 + input.guestCount;
            
            if (currentCount + requestedSpots > event.capacity) {
              // Add to waitlist
              const result = await db.createRsvp({
                eventId: input.eventId,
                memberId: member.id,
                userId: ctx.user.id,
                status: "waitlist",
                guestCount: input.guestCount,
                notes: input.notes,
                rsvpedAt: Date.now(),
              });
              // Send waitlist email
          if (ctx.user.email) {
            const eventDate = format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
            const eventTime = format(new Date(event.startTime), 'h:mm a');
            const emailData = getEventRsvpConfirmationEmail({
              memberName: ctx.user.name || 'Member',
              eventTitle: event.title,
              eventDate,
              eventTime,
              eventLocation: event.location || undefined,
              guestCount: input.guestCount || 0,
              status: 'waitlist',
            });
            sendEmail({
              to: ctx.user.email,
              subject: emailData.subject,
              html: emailData.html,
            }).catch(err => console.error('[RSVP] Failed to send email:', err));
          }
          return { success: true, rsvpId: Number(result[0].insertId), waitlisted: true };
            }
          }

          // Create new RSVP
          const result = await db.createRsvp({
            eventId: input.eventId,
            memberId: member.id,
            userId: ctx.user.id,
            status: input.status,
            guestCount: input.guestCount,
            notes: input.notes,
            rsvpedAt: Date.now(),
          });
          // Send confirmation email
          if (ctx.user.email && input.status === 'attending') {
            const eventDate = format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
            const eventTime = format(new Date(event.startTime), 'h:mm a');
            const emailData = getEventRsvpConfirmationEmail({
              memberName: ctx.user.name || 'Member',
              eventTitle: event.title,
              eventDate,
              eventTime,
              eventLocation: event.location || undefined,
              guestCount: input.guestCount || 0,
              status: input.status,
            });
            sendEmail({
              to: ctx.user.email,
              subject: emailData.subject,
              html: emailData.html,
            }).catch(err => console.error('[RSVP] Failed to send email:', err));
          }
          return { success: true, rsvpId: Number(result[0].insertId) };
        }
      }),

    // Cancel RSVP
    cancelRsvp: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        const rsvp = await db.getRsvpByEventAndMember(input.eventId, member.id);
        if (!rsvp) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'RSVP not found' });
        }

        await db.deleteRsvp(rsvp.id);
        return { success: true };
      }),

    // Get event attendee count
    getEventAttendeeCount: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventAttendeeCount(input.eventId);
      }),

    // Admin: Create event
    createEvent: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        eventType: z.enum(["competition", "show", "clinic", "social", "riding_lesson", "horsemanship_lesson", "other"]),
        location: z.string().optional(),
        startTime: z.number(),
        endTime: z.number(),
        capacity: z.number().optional(),
        requiresRsvp: z.boolean().default(true),
        publish: z.boolean().default(false),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createEvent({
          title: input.title,
          description: input.description,
          eventType: input.eventType,
          location: input.location,
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
          requiresRsvp: input.requiresRsvp,
          isPublished: input.publish,
          createdBy: ctx.user.id,
          imageUrl: input.imageUrl,
        });
        return { success: true, eventId: Number(result[0].insertId) };
      }),

    // Admin: Update event
    updateEvent: adminProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(["competition", "show", "clinic", "social", "other"]).optional(),
        location: z.string().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        capacity: z.number().optional(),
        requiresRsvp: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { eventId, ...updates } = input;
        await db.updateEvent(eventId, updates);
        return { success: true };
      }),

    // Admin: Get all events
    getAllEvents: adminProcedure.query(async () => {
      return await db.getAllEvents();
    }),

    // Admin: Get event RSVPs
    getEventRsvps: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRsvpsByEventId(input.eventId);
      }),
  }),

  recurringEvents: router({
    // Admin: Get all recurring series
    getAllSeries: adminProcedure.query(async () => {
      return await db.getAllRecurringSeries();
    }),

    // Admin: Get series by ID
    getSeries: adminProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRecurringSeriesById(input.seriesId);
      }),

    // Admin: Create recurring series and generate events
    createSeries: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        eventType: z.enum(["competition", "show", "clinic", "social", "riding_lesson", "horsemanship_lesson", "other"]),
        location: z.string().optional(),
        capacity: z.number().optional(),
        requiresRsvp: z.boolean().default(true),
        recurrencePattern: z.enum(["daily", "weekly", "biweekly", "monthly"]),
        daysOfWeek: z.string().optional(), // "1,3,5" for Mon,Wed,Fri
        startTimeOfDay: z.string(), // "09:00:00"
        durationMinutes: z.number(),
        seriesStartDate: z.number(), // Unix timestamp
        seriesEndDate: z.number().optional(),
        maxOccurrences: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createRecurringSeries({
          ...input,
          createdBy: ctx.user.id,
          isActive: true,
        });
        const seriesId = Number(result[0].insertId);

        // Generate event occurrences
        const generated = await recurringEvents.generateRecurringEvents(seriesId);

        return { success: true, seriesId, eventsGenerated: generated };
      }),

    // Admin: Update entire series
    updateSeries: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(["competition", "show", "clinic", "social", "other"]).optional(),
        location: z.string().optional(),
        capacity: z.number().optional(),
        requiresRsvp: z.boolean().optional(),
        recurrencePattern: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
        daysOfWeek: z.string().optional(),
        startTimeOfDay: z.string().optional(),
        durationMinutes: z.number().optional(),
        seriesEndDate: z.number().optional(),
        maxOccurrences: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { seriesId, ...updates } = input;
        const generated = await recurringEvents.updateEntireSeries(seriesId, updates);
        return { success: true, eventsRegenerated: generated };
      }),

    // Admin: Delete entire series
    deleteSeries: adminProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input }) => {
        await recurringEvents.deleteEntireSeries(input.seriesId);
        return { success: true };
      }),

    // Admin: Delete single occurrence
    deleteOccurrence: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        await recurringEvents.deleteSingleOccurrence(input.eventId);
        return { success: true };
      }),

    // Admin: Update single occurrence (marks as exception)
    updateOccurrence: adminProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        capacity: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { eventId, ...updates } = input;
        await recurringEvents.updateSingleOccurrence(eventId, updates);
        return { success: true };
      }),
  }),

  appointments: router({
    // Get my upcoming appointments
    getMyAppointments: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getUpcomingAppointments(member.id);
    }),

    // Get all my appointments (including past)
    getAllMyAppointments: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getAppointmentsByMemberId(member.id);
    }),

    // Admin: Create appointment
    createAppointment: adminProcedure
      .input(z.object({
        memberId: z.number(),
        appointmentType: z.string(),
        startTime: z.number(), // Unix timestamp in ms
        endTime: z.number(), // Unix timestamp in ms
        status: z.string().optional(),
        notes: z.string().optional(),
        acuityAppointmentId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createAppointment({
          memberId: input.memberId,
          acuityAppointmentId: input.acuityAppointmentId || `manual-${Date.now()}`,
          appointmentType: input.appointmentType,
          startTime: input.startTime,
          endTime: input.endTime,
          status: input.status || "scheduled",
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  lessons: router({
    // Student: Get my upcoming lessons
    getMyLessons: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await lessonScheduling.getStudentUpcomingLessons(member.id);
    }),

    // Student: Get available slots for booking/rescheduling
    getAvailableSlots: protectedProcedure
      .input(z.object({
        fromTime: z.number().optional(), // Unix timestamp in ms
      }))
      .query(async ({ input }) => {
        const fromTime = input.fromTime || Date.now();
        return await db.getAvailableLessonSlots(fromTime);
      }),

    // Student: Book a lesson slot
    bookLesson: protectedProcedure
      .input(z.object({
        slotId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Check if student can book this slot
        const canBook = await lessonScheduling.canStudentBookSlot(member.id, input.slotId);
        if (!canBook.canBook) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: canBook.reason || 'Cannot book this slot' });
        }

        const result = await lessonScheduling.bookLessonSlot(
          input.slotId,
          member.id,
          ctx.user.id
        );

        if (!result.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: result.message });
        }

        return { success: true, bookingId: result.bookingId };
      }),

    // Student: Reschedule a lesson (24-hour rule enforced)
    rescheduleLesson: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        newSlotId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Verify booking belongs to this member
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || booking.memberId !== member.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to reschedule this lesson' });
        }

        const result = await lessonScheduling.rescheduleLessonBooking(
          input.bookingId,
          input.newSlotId,
          ctx.user.id
        );

        if (!result.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: result.message });
        }

        return { success: true };
      }),

    // Student: Cancel a lesson (24-hour rule enforced)
    cancelLesson: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Verify booking belongs to this member
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || booking.memberId !== member.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to cancel this lesson' });
        }

        const result = await lessonScheduling.cancelLesson(input.bookingId);

        if (!result.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: result.message });
        }

        return { success: true };
      }),

    // Staff: Get all lesson slots
    getAllSlots: adminProcedure.query(async () => {
      return await db.getAllLessonSlots();
    }),

    // Staff: Get bookings for a specific slot
    getSlotBookings: adminProcedure
      .input(z.object({ slotId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBookingsBySlot(input.slotId);
      }),

    // Staff: Create a new lesson slot
    createSlot: adminProcedure
      .input(z.object({
        startTime: z.number(), // Unix timestamp in ms
        endTime: z.number(), // Unix timestamp in ms
        lessonType: z.enum(["private", "group", "horsemanship"]),
        maxStudents: z.number(),
        instructorName: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slotId = await db.createLessonSlot({
          ...input,
          currentStudents: 0,
          createdBy: ctx.user.id,
        });
        return { success: true, slotId };
      }),

    // Staff: Update a lesson slot
    updateSlot: adminProcedure
      .input(z.object({
        slotId: z.number(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        lessonType: z.enum(["private", "group", "horsemanship"]).optional(),
        maxStudents: z.number().optional(),
        instructorName: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { slotId, ...updates } = input;
        await db.updateLessonSlot(slotId, updates);
        return { success: true };
      }),

    // Staff: Delete a lesson slot
    deleteSlot: adminProcedure
      .input(z.object({ slotId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLessonSlot(input.slotId);
        return { success: true };
      }),

    // Staff: Mark attendance for a booking
    markAttendance: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        attendanceStatus: z.enum(["present", "absent", "late"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.markLessonAttendance(
          input.bookingId,
          input.attendanceStatus,
          ctx.user.id,
          input.notes
        );
        return { success: true };
      }),

    // Staff: Get attendance history for a student
    getStudentAttendance: adminProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentAttendanceHistory(input.memberId);
      }),

    // Student: Get my attendance history
    getMyAttendance: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getStudentAttendanceHistory(member.id);
    }),

    // Staff: Add progress note for a student
    addProgressNote: adminProcedure
      .input(z.object({
        memberId: z.number(),
        lessonBookingId: z.number().optional(),
        category: z.enum(["skill_progress", "behavior", "achievement", "goal", "concern", "general"]),
        title: z.string(),
        content: z.string(),
        isVisibleToParent: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const noteId = await db.createProgressNote({
          ...input,
          createdBy: ctx.user.id,
          noteDate: Date.now(),
        });
        return { success: true, noteId };
      }),

    // Staff: Get all progress notes for a student
    getStudentProgressNotes: adminProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentProgressNotes(input.memberId);
      }),

    // Student/Parent: Get my progress notes (only visible ones)
    getMyProgressNotes: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getStudentProgressNotes(member.id, true); // Only visible to parent
    }),

    // Staff: Update progress note
    updateProgressNote: adminProcedure
      .input(z.object({
        noteId: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.enum(["skill_progress", "behavior", "achievement", "goal", "concern", "general"]).optional(),
        isVisibleToParent: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { noteId, ...updates } = input;
        await db.updateProgressNote(noteId, updates);
        return { success: true };
      }),

    // Staff: Delete progress note
    deleteProgressNote: adminProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProgressNote(input.noteId);
        return { success: true };
      }),

    // Attendance Reports
    getAttendanceStatsByStudent: adminProcedure
      .input(z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getAttendanceStatsByStudent(startDate, endDate);
      }),

    getMonthlyAttendanceSummary: adminProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return await db.getMonthlyAttendanceSummary(input.year, input.month);
      }),

    getOverallAttendanceStats: adminProcedure
      .input(z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getOverallAttendanceStats(startDate, endDate);
      }),

    getDetailedAttendanceRecords: adminProcedure
      .input(z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getDetailedAttendanceRecords(startDate, endDate);
      }),
  }),

  horses: router({
    // Get my horses
    getMyHorses: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) return [];
      return await db.getHorsesByOwnerId(member.id);
    }),

    // Add a horse
    addHorse: protectedProcedure
      .input(z.object({
        name: z.string(),
        breed: z.string().optional(),
        age: z.number().optional(),
        color: z.string().optional(),
        gender: z.enum(["mare", "gelding", "stallion"]).optional(),
        height: z.string().optional(),
        temperament: z.string().optional(),
        specialNeeds: z.string().optional(),
        vetInfo: z.string().optional(),
        photoUrl: z.string().optional(),
        isBoarded: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Member profile not found" });
        
        const horseId = await db.createHorse({
          ownerId: member.id,
          ...input,
        });
        return { success: true, horseId };
      }),

    // Update a horse
    updateHorse: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        breed: z.string().optional(),
        age: z.number().optional(),
        color: z.string().optional(),
        gender: z.enum(["mare", "gelding", "stallion"]).optional(),
        height: z.string().optional(),
        temperament: z.string().optional(),
        specialNeeds: z.string().optional(),
        vetInfo: z.string().optional(),
        photoUrl: z.string().optional(),
        isBoarded: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const horse = await db.getHorseById(id);
        if (!horse) throw new TRPCError({ code: "NOT_FOUND", message: "Horse not found" });
        
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member || horse.ownerId !== member.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own horses" });
        }
        
        await db.updateHorse(id, updates);
        return { success: true };
      }),

    // Delete a horse
    deleteHorse: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const horse = await db.getHorseById(input.id);
        if (!horse) throw new TRPCError({ code: "NOT_FOUND", message: "Horse not found" });
        
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member || horse.ownerId !== member.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own horses" });
        }
        
        await db.deleteHorse(input.id);
        return { success: true };
      }),
  }),

  profile: router({
    // Upload profile photo
    uploadProfilePhoto: protectedProcedure
      .input(z.object({
        photoData: z.string(), // Base64 encoded image data
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.photoData, 'base64');
        
        // Generate unique filename
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.mimeType.split('/')[1];
        const fileKey = `profile-photos/${ctx.user.id}-${randomSuffix}.${extension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update user profile
        await db.updateUserProfilePhoto(ctx.user.id, url);
        
        return { success: true, photoUrl: url };
      }),

    // Update student riding experience (instructor only)
    updateStudentRidingInfo: adminProcedure
      .input(z.object({
        memberId: z.number(),
        horseManagementLevel: z.enum(["d1", "d2", "d3", "c1", "c2", "c3", "hb", "ha"]).optional(),
        ridingCertifications: z.string().optional(),
        otherCertifications: z.string().optional(),
        ridingGoals: z.string().optional(),
        medicalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { memberId, ...updateData } = input;
        await db.updateMemberRidingInfo(memberId, updateData);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
