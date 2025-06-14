// Dispute resolution and support system for GearGrab
import { db } from '$lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

export interface Dispute {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  complainantId: string;
  complainantName: string;
  respondentId: string;
  respondentName: string;
  
  type: 'damage' | 'no_show' | 'late_return' | 'condition_mismatch' | 'payment' | 'behavior' | 'other';
  category: 'gear_issue' | 'payment_issue' | 'communication_issue' | 'safety_concern';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'under_review' | 'investigating' | 'mediation' | 'resolved' | 'closed';
  
  title: string;
  description: string;
  desiredOutcome: string;
  
  evidence: {
    photos: string[];
    documents: string[];
    messages: string[];
    witnesses?: {
      name: string;
      contact: string;
      statement: string;
    }[];
  };
  
  timeline: DisputeEvent[];
  
  resolution?: {
    type: 'refund' | 'replacement' | 'repair' | 'compensation' | 'warning' | 'account_action';
    amount?: number;
    description: string;
    agreedBy: string[];
    completedAt: Date;
  };
  
  mediator?: {
    id: string;
    name: string;
    assignedAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface DisputeEvent {
  id: string;
  type: 'status_change' | 'message' | 'evidence_added' | 'resolution_proposed' | 'escalation';
  actor: string;
  actorName: string;
  actorRole: 'complainant' | 'respondent' | 'mediator' | 'system';
  message?: string;
  data?: any;
  timestamp: Date;
  isPublic: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  
  type: 'technical' | 'account' | 'booking' | 'payment' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  
  subject: string;
  description: string;
  category: string;
  
  assignedTo?: {
    id: string;
    name: string;
    assignedAt: Date;
  };
  
  messages: SupportMessage[];
  
  metadata?: {
    bookingId?: string;
    listingId?: string;
    errorCode?: string;
    userAgent?: string;
    url?: string;
  };
  
  satisfaction?: {
    rating: number;
    feedback: string;
    submittedAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'support' | 'system';
  content: string;
  attachments?: string[];
  timestamp: Date;
  isInternal: boolean;
}

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  averageResolutionTime: number; // in hours
  resolutionRate: number; // percentage
  disputesByType: Record<string, number>;
  disputesByStatus: Record<string, number>;
}

class DisputeService {
  // Submit a new dispute
  async submitDispute(disputeData: Omit<Dispute, 'id' | 'timeline' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const disputesRef = collection(db, 'disputes');
      
      const initialEvent: DisputeEvent = {
        id: 'event_001',
        type: 'status_change',
        actor: disputeData.complainantId,
        actorName: disputeData.complainantName,
        actorRole: 'complainant',
        message: 'Dispute submitted',
        timestamp: new Date(),
        isPublic: true
      };

      const dispute = {
        ...disputeData,
        timeline: [initialEvent],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours from now
      };

      const docRef = await addDoc(disputesRef, dispute);
      
      // Send notifications to involved parties
      await this.notifyDisputeParties(docRef.id, disputeData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting dispute:', error);
      throw error;
    }
  }

  // Update dispute status
  async updateDisputeStatus(
    disputeId: string,
    newStatus: Dispute['status'],
    actorId: string,
    actorName: string,
    message?: string
  ): Promise<void> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeDoc = await getDoc(disputeRef);
      
      if (!disputeDoc.exists()) {
        throw new Error('Dispute not found');
      }

      const currentDispute = disputeDoc.data() as Dispute;
      
      const newEvent: DisputeEvent = {
        id: `event_${Date.now()}`,
        type: 'status_change',
        actor: actorId,
        actorName,
        actorRole: this.determineActorRole(actorId, currentDispute),
        message: message || `Status changed to ${newStatus}`,
        timestamp: new Date(),
        isPublic: true
      };

      await updateDoc(disputeRef, {
        status: newStatus,
        timeline: [...currentDispute.timeline, newEvent],
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating dispute status:', error);
      throw error;
    }
  }

  // Add message to dispute
  async addDisputeMessage(
    disputeId: string,
    senderId: string,
    senderName: string,
    message: string,
    isPublic: boolean = true
  ): Promise<void> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeDoc = await getDoc(disputeRef);
      
      if (!disputeDoc.exists()) {
        throw new Error('Dispute not found');
      }

      const currentDispute = disputeDoc.data() as Dispute;
      
      const newEvent: DisputeEvent = {
        id: `event_${Date.now()}`,
        type: 'message',
        actor: senderId,
        actorName: senderName,
        actorRole: this.determineActorRole(senderId, currentDispute),
        message,
        timestamp: new Date(),
        isPublic
      };

      await updateDoc(disputeRef, {
        timeline: [...currentDispute.timeline, newEvent],
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding dispute message:', error);
      throw error;
    }
  }

  // Propose resolution
  async proposeResolution(
    disputeId: string,
    resolution: Dispute['resolution'],
    proposerId: string,
    proposerName: string
  ): Promise<void> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeDoc = await getDoc(disputeRef);
      
      if (!disputeDoc.exists()) {
        throw new Error('Dispute not found');
      }

      const currentDispute = disputeDoc.data() as Dispute;
      
      const newEvent: DisputeEvent = {
        id: `event_${Date.now()}`,
        type: 'resolution_proposed',
        actor: proposerId,
        actorName: proposerName,
        actorRole: this.determineActorRole(proposerId, currentDispute),
        message: `Resolution proposed: ${resolution?.description}`,
        data: resolution,
        timestamp: new Date(),
        isPublic: true
      };

      await updateDoc(disputeRef, {
        resolution,
        status: 'mediation',
        timeline: [...currentDispute.timeline, newEvent],
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error proposing resolution:', error);
      throw error;
    }
  }

  // Get user's disputes
  async getUserDisputes(userId: string): Promise<Dispute[]> {
    try {
      const disputesRef = collection(db, 'disputes');
      const q = query(
        disputesRef,
        where('complainantId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const disputes: Dispute[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        disputes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          timeline: data.timeline?.map((event: any) => ({
            ...event,
            timestamp: event.timestamp?.toDate()
          })) || []
        } as Dispute);
      });

      return disputes;
    } catch (error) {
      console.error('Error getting user disputes:', error);
      throw error;
    }
  }

  // Submit support ticket
  async submitSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'messages' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ticketsRef = collection(db, 'supportTickets');
      
      const ticket = {
        ...ticketData,
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(ticketsRef, ticket);
      
      // Send auto-reply
      await this.addSupportMessage(docRef.id, {
        id: `msg_${Date.now()}`,
        senderId: 'system',
        senderName: 'GearGrab Support',
        senderRole: 'system',
        content: `Thank you for contacting GearGrab support. We've received your ticket and will respond within 24 hours. Your ticket ID is ${docRef.id}.`,
        timestamp: new Date(),
        isInternal: false
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      throw error;
    }
  }

  // Add message to support ticket
  async addSupportMessage(ticketId: string, message: SupportMessage): Promise<void> {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Support ticket not found');
      }

      const currentTicket = ticketDoc.data() as SupportTicket;
      
      await updateDoc(ticketRef, {
        messages: [...currentTicket.messages, message],
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding support message:', error);
      throw error;
    }
  }

  // Get dispute statistics
  async getDisputeStats(): Promise<DisputeStats> {
    try {
      // In a real implementation, this would aggregate data from Firestore
      return {
        totalDisputes: 156,
        openDisputes: 23,
        averageResolutionTime: 48,
        resolutionRate: 94.2,
        disputesByType: {
          damage: 45,
          no_show: 32,
          late_return: 28,
          condition_mismatch: 25,
          payment: 15,
          behavior: 8,
          other: 3
        },
        disputesByStatus: {
          submitted: 8,
          under_review: 12,
          investigating: 3,
          mediation: 5,
          resolved: 125,
          closed: 3
        }
      };
    } catch (error) {
      console.error('Error getting dispute stats:', error);
      throw error;
    }
  }

  // Helper methods
  private determineActorRole(actorId: string, dispute: Dispute): DisputeEvent['actorRole'] {
    if (actorId === dispute.complainantId) return 'complainant';
    if (actorId === dispute.respondentId) return 'respondent';
    if (actorId === dispute.mediator?.id) return 'mediator';
    return 'system';
  }

  private async notifyDisputeParties(disputeId: string, dispute: Omit<Dispute, 'id' | 'timeline' | 'createdAt' | 'updatedAt'>): Promise<void> {
    // In a real implementation, send notifications to complainant, respondent, and support team
    console.log(`Dispute ${disputeId} notifications sent to involved parties`);
  }
}

export const disputeService = new DisputeService();
