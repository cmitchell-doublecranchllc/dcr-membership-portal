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
    signup: publicProcedure
      .input(z.object({
        studentName: z.string(),
        studentDOB: z.string(),
        allergies: z.string().optional(),
        medications: z.string().optional(),
        medicalNotes: z.string().optional(),
        email: z.string().email(),
        phone: z.string(),
        emergencyContactName: z.string(),
        emergencyContactPhone: z.string(),
        emergencyContactRelationship: z.string(),
        ridingExperience: z.string(),
        membershipTier: z.enum(["bronze", "silver", "gold"]),
        photoConsent: z.boolean(),
        smsConsent: z.boolean(),
        liabilityWaiverSigned: z.boolean(),
        liabilityWaiverSignatureData: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Create user account with pending status
        const user = await db.createUser({
          email: input.email,
          name: input.studentName,
          accountStatus: "pending",
          role: "user",
        });

        // Create member profile
        await db.createMember({
          userId: user.id,
          membershipTier: input.membershipTier,
          phone: input.phone,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          emergencyContactRelationship: input.emergencyContactRelationship,
          dateOfBirth: new Date(input.studentDOB),
          allergies: input.allergies || null,
          medications: input.medications || null,
          medicalNotes: input.medicalNotes || null,
          photoConsent: input.photoConsent,
          smsConsent: input.smsConsent,
          liabilityWaiverSigned: input.liabilityWaiverSigned,
          liabilityWaiverSignedAt: new Date(),
          liabilityWaiverSignatureData: input.liabilityWaiverSignatureData,
          isChild: false,
        });

        // Send confirmation email to applicant
        await sendEmail({
          to: input.email,
          subject: "Registration Received - Double C Ranch",
          html: `
            <h2>Thank you for registering!</h2>
            <p>Dear ${input.studentName},</p>
            <p>We have received your registration for Double C Ranch. Your application is currently pending approval.</p>
            <p>You will receive an email notification once your account has been reviewed and approved by our staff.</p>
            <p>If you have any questions, please contact us at support@doublecranchllc.com</p>
            <p>Best regards,<br/>Double C Ranch Team</p>
          `,
        });

        // Send admin notification email
        const adminEmail = process.env.GMAIL_USER || 'support@doublecranchllc.com';
        await sendEmail({
          to: adminEmail,
          subject: `New Member Registration: ${input.studentName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7f1d1d;">New Member Registration Pending</h2>
              <p>A new member has submitted a registration request and is waiting for your approval.</p>
              
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Member Details:</h3>
                <p><strong>Name:</strong> ${input.studentName}</p>
                <p><strong>Email:</strong> ${input.email}</p>
                <p><strong>Phone:</strong> ${input.phone}</p>
                <p><strong>Date of Birth:</strong> ${input.studentDOB}</p>
                <p><strong>Membership Tier:</strong> ${input.membershipTier.toUpperCase()}</p>
                <p><strong>Emergency Contact:</strong> ${input.emergencyContactName} (${input.emergencyContactRelationship}) - ${input.emergencyContactPhone}</p>
                ${input.allergies ? `<p><strong>Allergies:</strong> ${input.allergies}</p>` : ''}
                ${input.medications ? `<p><strong>Medications:</strong> ${input.medications}</p>` : ''}
                <p><strong>Riding Experience:</strong> ${input.ridingExperience}</p>
              </div>
              
              <p><a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://memberdoublecranchllc.com'}/staff/pending-members" style="background-color: #7f1d1d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Review & Approve Registration</a></p>
              
              <p style="color: #6b7280; font-size: 14px;">Log in to the staff dashboard to review the full application and approve or reject this member.</p>
            </div>
          `,
        });

        return { success: true };
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

  documents: router({
    // Upload a document
    uploadDocument: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file
        documentType: z.enum(['medical_form', 'insurance_certificate', 'photo_release', 'emergency_contact', 'other']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileSize = fileBuffer.length;
        
        // Determine MIME type from file extension
        const ext = input.fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `member-documents/${member.id}/${input.documentType}/${timestamp}-${randomSuffix}-${input.fileName}`;

        // Upload to S3
        const { storagePut } = await import('./storage');
        const { url } = await storagePut(fileKey, fileBuffer, mimeType);

        // Save to database
        await db.createMemberDocument({
          memberId: member.id,
          documentType: input.documentType,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType,
          uploadedBy: ctx.user.id,
          notes: input.notes,
        });

        return { success: true, fileUrl: url };
      }),

    // Get my documents
    getMyDocuments: protectedProcedure.query(async ({ ctx }) => {
      const member = await db.getMemberByUserId(ctx.user.id);
      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
      }
      return await db.getMemberDocuments(member.id);
    }),

    // Get documents by type
    getDocumentsByType: protectedProcedure
      .input(z.object({
        documentType: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }
        return await db.getMemberDocumentsByType(member.id, input.documentType);
      }),

    // Delete a document
    deleteDocument: protectedProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getMemberByUserId(ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member profile not found' });
        }

        // Verify document belongs to this member
        const document = await db.getMemberDocumentById(input.documentId);
        if (!document || document.memberId !== member.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete this document' });
        }

        await db.deleteMemberDocument(input.documentId);
        return { success: true };
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

        // Get lesson details for calendar file and notifications
        const lessonSlot = await db.getLessonSlotById(input.slotId);
        if (lessonSlot) {
          const { generateLessonICS } = await import('./_core/icsGenerator');
          const { sendGmailEmail } = await import('./_core/gmailService');
          const { format } = await import('date-fns');

          const icsContent = generateLessonICS({
            lessonType: lessonSlot.lessonType,
            startTime: new Date(lessonSlot.startTime),
            endTime: new Date(lessonSlot.endTime),
            instructorName: lessonSlot.instructorName,
            location: lessonSlot.location,
            studentEmail: ctx.user.email,
            studentName: ctx.user.name,
          });

          // Send confirmation email to student with calendar file
          await sendGmailEmail({
            to: ctx.user.email,
            subject: 'Lesson Booking Confirmed - Double C Ranch',
            html: `
              <h2>Lesson Booking Confirmed!</h2>
              <p>Hi ${ctx.user.name},</p>
              <p>Your riding lesson has been successfully booked.</p>
              <h3>Lesson Details:</h3>
              <ul>
                <li><strong>Type:</strong> ${lessonSlot.lessonType.charAt(0).toUpperCase() + lessonSlot.lessonType.slice(1)} Lesson</li>
                <li><strong>Date:</strong> ${format(new Date(lessonSlot.startTime), 'EEEE, MMMM d, yyyy')}</li>
                <li><strong>Time:</strong> ${format(new Date(lessonSlot.startTime), 'h:mm a')} - ${format(new Date(lessonSlot.endTime), 'h:mm a')}</li>
                ${lessonSlot.instructorName ? `<li><strong>Instructor:</strong> ${lessonSlot.instructorName}</li>` : ''}
                ${lessonSlot.location ? `<li><strong>Location:</strong> ${lessonSlot.location}</li>` : ''}
              </ul>
              <p><strong>Click the attached calendar file to add this lesson to your calendar.</strong></p>
              <p>If you need to reschedule or have any questions, please contact us at support@doublecranchllc.com</p>
              <p>See you at the ranch!</p>
              <p>- Double C Ranch Team</p>
            `,
            attachments: [{
              filename: 'lesson.ics',
              content: icsContent,
              contentType: 'text/calendar',
            }],
          });

          // Send notification to admin with calendar file
          await sendGmailEmail({
            to: 'support@doublecranchllc.com',
            subject: `New Lesson Booking: ${ctx.user.name}`,
            html: `
              <h2>New Lesson Booked</h2>
              <p><strong>${ctx.user.name}</strong> has booked a lesson.</p>
              <h3>Lesson Details:</h3>
              <ul>
                <li><strong>Student:</strong> ${ctx.user.name} (${ctx.user.email})</li>
                <li><strong>Type:</strong> ${lessonSlot.lessonType.charAt(0).toUpperCase() + lessonSlot.lessonType.slice(1)} Lesson</li>
                <li><strong>Date:</strong> ${format(new Date(lessonSlot.startTime), 'EEEE, MMMM d, yyyy')}</li>
                <li><strong>Time:</strong> ${format(new Date(lessonSlot.startTime), 'h:mm a')} - ${format(new Date(lessonSlot.endTime), 'h:mm a')}</li>
                ${lessonSlot.instructorName ? `<li><strong>Instructor:</strong> ${lessonSlot.instructorName}</li>` : ''}
                ${lessonSlot.location ? `<li><strong>Location:</strong> ${lessonSlot.location}</li>` : ''}
              </ul>
              <p><strong>Click the attached calendar file to add this lesson to your Google Calendar.</strong></p>
            `,
            attachments: [{
              filename: 'lesson.ics',
              content: icsContent,
              contentType: 'text/calendar',
            }],
          });
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

    // Staff: Duplicate a lesson slot for X weeks
    duplicateSlotForWeeks: adminProcedure
      .input(z.object({
        slotId: z.number(),
        numberOfWeeks: z.number().min(1).max(52),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the original slot
        const slots = await db.getAllLessonSlots();
        const originalSlot = slots.find(s => s.id === input.slotId);
        if (!originalSlot) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Lesson slot not found' });
        }

        // Create duplicates for each week
        const createdSlots = [];
        for (let week = 1; week <= input.numberOfWeeks; week++) {
          const weekOffset = week * 7 * 24 * 60 * 60 * 1000; // milliseconds in a week
          const newStartTime = originalSlot.startTime + weekOffset;
          const newEndTime = originalSlot.endTime + weekOffset;

          const slotId = await db.createLessonSlot({
            startTime: newStartTime,
            endTime: newEndTime,
            lessonType: originalSlot.lessonType,
            maxStudents: originalSlot.maxStudents,
            currentStudents: 0,
            instructorName: originalSlot.instructorName || undefined,
            location: originalSlot.location || undefined,
            notes: originalSlot.notes || undefined,
            createdBy: ctx.user.id,
          });
          createdSlots.push(slotId);
        }

        return { success: true, createdCount: createdSlots.length, slotIds: createdSlots };
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

  // Admin approval system
  admin: router({
    // Get all pending users
    getPendingUsers: adminProcedure.query(async () => {
      const pendingUsers = await db.getPendingUsers();
      return pendingUsers;
    }),

    // Approve a user
    approveUser: adminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        // Update user status to approved
        await db.updateUserAccountStatus(input.userId, 'approved');

        // Get user's member profile
        const member = await db.getMemberByUserId(input.userId);
        if (member) {
          // Automatically assign Riding Lesson Agreement contract
          const ridingAgreementContract = await db.getContractById(1); // ID 1 is Riding Lesson Agreement
          if (ridingAgreementContract) {
            await db.assignContract({
              contractId: ridingAgreementContract.id,
              memberId: member.id,
              assignedBy: input.userId, // System assignment
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
              isSigned: false,
            });
          }
        }

        // Send approval email
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: 'Welcome to Double C Ranch Pony Club!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7f1d1d;">Welcome to Double C Ranch Pony Club!</h2>
                <p>Hi ${user.name},</p>
                <p>Great news! Your membership application has been approved. You now have full access to the member portal.</p>
                <p><strong>What you can do now:</strong></p>
                <ul>
                  <li>View and reschedule your riding lessons</li>
                  <li>Sign up for events and competitions</li>
                  <li>View your progress notes from instructors</li>
                  <li>Sign and manage contracts</li>
                  <li>Message staff members</li>
                </ul>
                <p><a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://memberdoubleranchllc.com'}" style="background-color: #7f1d1d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Access Member Portal</a></p>
                <p>If you have any questions, feel free to reach out to us.</p>
                <p>Happy riding!<br/>The Double C Ranch Team</p>
              </div>
            `,
          });
        }

        return { success: true };
      }),

    // Reject a user
    rejectUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        // Update user status to rejected
        await db.updateUserAccountStatus(input.userId, 'rejected');

        // Send rejection email
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: 'Double C Ranch Pony Club Membership Application',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7f1d1d;">Membership Application Update</h2>
                <p>Hi ${user.name},</p>
                <p>Thank you for your interest in Double C Ranch Pony Club. Unfortunately, we are unable to approve your membership application at this time.</p>
                ${input.reason ? `<p><strong>Reason:</strong> ${input.reason}</p>` : ''}
                <p>If you have any questions or would like to discuss this decision, please feel free to contact us:</p>
                <ul>
                  <li>Email: c.mitchell@doubleranchllc.com</li>
                  <li>Phone: Contact us through the website</li>
                </ul>
                <p>Thank you for your understanding.</p>
                <p>Best regards,<br/>The Double C Ranch Team</p>
              </div>
            `,
          });
        }

        return { success: true };
      }),

    // Delete a user (and their member profile)
    deleteUser: adminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        // Delete user and member records
        await db.deleteUserAndMember(input.userId);

        return { success: true };
      }),
  }),

  // QR Code Check-In System
  qrCode: router({
    // Generate QR code for a member (admin only)
    generate: adminProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ input }) => {
        const qrCode = await db.generateMemberQRCode(input.memberId);
        return { qrCode };
      }),

    // Get member by QR code (for scanning)
    scan: protectedProcedure
      .input(z.object({ qrCode: z.string() }))
      .mutation(async ({ input }) => {
        const result = await db.getMemberByQRCode(input.qrCode);
        
        if (!result) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid QR code' });
        }

        // Create check-in record
        await db.createCheckIn({
          memberId: result.members.id,
          checkInTime: Date.now(),
          checkInType: 'lesson',
          notes: 'QR code check-in',
        });

        return {
          member: result.members,
          user: result.users,
        };
      }),

    // Get all members with QR codes (for printing)
    getAllWithQR: adminProcedure
      .query(async () => {
        const members = await db.getAllMembersWithQRCodes();
        return members;
      }),

    // Generate QR codes for all members without one
    generateAll: adminProcedure
      .mutation(async () => {
        const allMembers = await db.getAllMembers();
        let generated = 0;
        
        for (const memberData of allMembers) {
          if (!memberData.members.qrCode) {
            await db.generateMemberQRCode(memberData.members.id);
            generated++;
          }
        }
        
        return { generated };
      }),
  }),

  // Student Goals System
  goals: router({
    // Create a new goal
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        goalTitle: z.string(),
        goalDescription: z.string().optional(),
        category: z.enum(["riding_skill", "horse_care", "competition", "certification", "other"]).optional(),
        targetDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const goalId = await db.createStudentGoal({
          ...input,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
          createdBy: ctx.user.id,
        });
        
        return { goalId };
      }),

    // Get goals for a student
    getByMember: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        status: z.enum(["active", "completed", "archived"]).optional(),
      }))
      .query(async ({ input }) => {
        const goals = await db.getStudentGoals(input.memberId, input.status);
        return goals;
      }),

    // Update goal progress (instructors)
    updateProgress: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        progressPercentage: z.number().min(0).max(100),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateGoalProgress(
          input.goalId,
          input.progressPercentage,
          ctx.user.id,
          input.notes
        );
        
        return { success: true };
      }),

    // Get progress history for a goal
    getProgressHistory: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input }) => {
        const history = await db.getGoalProgressHistory(input.goalId);
        return history;
      }),

    // Delete a goal
    delete: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStudentGoal(input.goalId);
        return { success: true };
      }),
  }),

  // Student Dashboard Stats
  studentStats: router({
    // Get attendance stats for a student
    getAttendance: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        const stats = await db.getStudentAttendanceStats(input.memberId);
        return stats;
      }),
  }),
});

export type AppRouter = typeof appRouter;
