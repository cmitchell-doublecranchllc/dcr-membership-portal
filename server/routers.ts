import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { sendEmail, getEventRsvpConfirmationEmail } from "./_core/email";
import { format } from "date-fns";

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
      return member;
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
          return { success: true, memberId: Number(result[0].insertId) };
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

        return { success: true, childId: Number(result[0].insertId) };
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
        eventType: z.enum(["competition", "show", "clinic", "social", "other"]),
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
});

export type AppRouter = typeof appRouter;
