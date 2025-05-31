import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Create a new booking
export const POST: RequestHandler = async ({ request }) => {
  try {
    const bookingData = await request.json();
    
    // Validate required fields
    const requiredFields = ['listingId', 'startDate', 'endDate', 'contactInfo', 'totalPrice'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate contact info
    const { contactInfo } = bookingData;
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone) {
      return json({ error: 'Missing required contact information' }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    
    if (startDate >= endDate) {
      return json({ error: 'End date must be after start date' }, { status: 400 });
    }

    if (startDate < new Date()) {
      return json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real application, you would:
    // 1. Check listing availability
    // 2. Validate the listing exists and is active
    // 3. Create the booking in the database
    // 4. Send notifications to owner and renter
    // 5. Handle payment processing

    // Simulate booking creation
    const booking = {
      id: bookingId,
      listingId: bookingData.listingId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      deliveryMethod: bookingData.deliveryMethod || 'pickup',
      insuranceTier: bookingData.insuranceTier || 'standard',
      totalPrice: bookingData.totalPrice,
      contactInfo: bookingData.contactInfo,
      specialRequests: bookingData.specialRequests || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      confirmationNumber: `GG-${Date.now().toString().slice(-6)}`
    };

    // Simulate database save delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Booking created:', booking);

    // Send booking confirmation emails
    try {
      const emailData = {
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
        listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
        listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        startDate: new Date(bookingData.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        endDate: new Date(bookingData.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalPrice: bookingData.totalPrice,
        renterName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
        renterEmail: bookingData.contactInfo.email,
        ownerName: 'David Wilson',
        ownerEmail: 'david.wilson@example.com',
        deliveryMethod: bookingData.deliveryMethod,
        pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
      };

      // Send emails via internal API
      const emailResponse = await fetch('/api/emails/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (emailResponse.ok) {
        console.log('Booking emails sent successfully');
      } else {
        console.error('Failed to send booking emails');
      }
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError);
      // Don't fail the booking if emails fail
    }

    return json({
      success: true,
      bookingId: booking.id,
      confirmationNumber: booking.confirmationNumber,
      message: 'Booking request submitted successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return json({ error: 'Failed to create booking' }, { status: 500 });
  }
};

// Get booking details
export const GET: RequestHandler = async ({ url }) => {
  try {
    const bookingId = url.searchParams.get('bookingId');
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // In a real application, you would fetch from database
    // For now, return mock data
    const booking = {
      id: bookingId,
      listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
      listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      startDate: '2024-02-15',
      endDate: '2024-02-18',
      totalPrice: 165,
      status: 'pending',
      owner: {
        name: 'David Wilson',
        email: 'david@example.com',
        phone: '(555) 123-4567'
      },
      confirmationNumber: bookingId.replace('booking_', 'GG-'),
      deliveryMethod: 'pickup',
      pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)',
      createdAt: new Date().toISOString()
    };

    return json({ booking });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
};
