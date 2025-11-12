import type { RequestHandler } from "./$types";
import { json } from '@sveltejs/kit';
import { adminFirestore } from '$lib/firebase/server';
import { authenticateRequest } from '$lib/security/middleware';
import crypto from 'crypto';

export async function POST({ request }) {
  try {
    const formData = await request.json();
    const {
      name,
      email,
      subject,
      message,
      category = 'general'
    } = formData;

    // Validate required fields
    if (!name?.trim()) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email?.trim()) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    if (!subject?.trim()) {
      return json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!message?.trim()) {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Try to get authenticated user (optional for support requests)
    let userId = null;
    try {
      const auth = await authenticateRequest(request);
      if (auth.success) {
        userId = auth.userId;
      }
    } catch {
      // Not authenticated, that's okay for support requests
    }

    // Generate ticket ID
    const ticketId = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Create support ticket
    const supportTicket = {
      id: ticketId,
      userId: userId || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      category,
      status: 'open',
      priority: determinePriority(category, message),
      source: 'faq_contact_form',
      
      // Metadata
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: getClientIP(request),
        referrer: request.headers.get('referer') || null,
        submittedVia: 'web_form'
      },
      
      // Timestamps
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now(),
      
      // Response tracking
      responses: [],
      assignedTo: null,
      resolvedAt: null,
      
      // Auto-categorization
      tags: generateTags(category, subject, message)
    };

    // Save support ticket
    await adminFirestore.collection('supportTickets').doc(ticketId).set(supportTicket);

    // Send auto-reply email (in production, this would trigger an email service)
    console.log(`📧 Support ticket ${ticketId} created for ${email}`);
    
    // Log for admin notification
    await adminFirestore.collection('adminNotifications').add({
      type: 'new_support_ticket',
      title: 'New Support Ticket',
      message: `New ${category} support ticket from ${name} (${email})`,
      data: {
        ticketId,
        category,
        priority: supportTicket.priority,
        subject
      },
      createdAt: adminFirestore.Timestamp.now(),
      read: false
    });

    return json({
      success: true,
      ticketId,
      message: 'Your support request has been submitted successfully. We\'ll get back to you within 24 hours.',
      estimatedResponse: getEstimatedResponseTime(supportTicket.priority)
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return json({ 
      error: 'Failed to submit support request. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET({ url, request }) {
  try {
    // Authenticate request (admin only for viewing tickets)
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminFirestore.collection('users').doc(auth.userId).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const status = url.searchParams.get('status') || 'open';
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Build query
    let query = adminFirestore.collection('supportTickets').orderBy('createdAt', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    query = query.limit(limit);

    const ticketsSnapshot = await query.get();
    const tickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate()
    }));

    // Get ticket statistics
    const statsQuery = await adminFirestore.collection('supportTickets').get();
    const allTickets = statsQuery.docs.map(doc => doc.data());
    
    const stats = {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in_progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      byCategory: allTickets.reduce((acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      }, {}),
      byPriority: allTickets.reduce((acc, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
      }, {})
    };

    return json({
      success: true,
      tickets,
      stats,
      pagination: {
        limit,
        hasMore: tickets.length === limit
      }
    });

  } catch (error) {
    console.error('Error getting support tickets:', error);
    return json({ 
      error: 'Failed to get support tickets',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Determine priority based on category and message content
 */
function determinePriority(category: string, message: string): 'low' | 'medium' | 'high' | 'urgent' {
  const urgentKeywords = ['urgent', 'emergency', 'critical', 'broken', 'not working', 'can\'t access', 'payment failed'];
  const highKeywords = ['bug', 'error', 'problem', 'issue', 'help', 'support'];
  
  const messageText = message.toLowerCase();
  
  // Check for urgent keywords
  if (urgentKeywords.some(keyword => messageText.includes(keyword))) {
    return 'urgent';
  }
  
  // Category-based priority
  if (category === 'payment' || category === 'safety') {
    return 'high';
  }
  
  if (category === 'technical' || category === 'booking') {
    return 'medium';
  }
  
  // Check for high priority keywords
  if (highKeywords.some(keyword => messageText.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate tags for categorization
 */
function generateTags(category: string, subject: string, message: string): string[] {
  const tags = [category];
  const text = `${subject} ${message}`.toLowerCase();
  
  // Common issue tags
  const tagMap = {
    'payment': ['billing', 'charge', 'refund', 'card'],
    'booking': ['reservation', 'rental', 'dates'],
    'verification': ['verify', 'id', 'photo'],
    'technical': ['bug', 'error', 'website', 'app'],
    'account': ['login', 'password', 'profile'],
    'gear': ['equipment', 'item', 'listing']
  };
  
  Object.entries(tagMap).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Get estimated response time based on priority
 */
function getEstimatedResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent': return '2-4 hours';
    case 'high': return '4-8 hours';
    case 'medium': return '8-24 hours';
    case 'low': return '24-48 hours';
    default: return '24 hours';
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
