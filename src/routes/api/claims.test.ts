import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, PUT } from './api/claims/+server'; // Adjust path
import { json, error } from '@sveltejs/kit'; // Mocked
import { adminDb, Timestamp } from '$firebase/server'; // Mocked

// --- MOCK SETUP (Simplified, assume a global setup) ---
vi.mock('@sveltejs/kit', async () => ({
  json: vi.fn((data, init) => ({ data, status: init?.status || 200, ...init })),
  error: vi.fn((status, body) => ({ status, body })),
}));
vi.mock('$firebase/server', () => {
  const mockDoc = (data) => ({
    exists: true,
    id: data?.id || 'mockId',
    data: vi.fn(() => data),
  });
  const mockCollection = {
    doc: vi.fn((id) => mockDoc({ id })),
    where: vi.fn(() => mockCollection),
    orderBy: vi.fn(() => mockCollection),
    limit: vi.fn(() => mockCollection),
    startAfter: vi.fn(() => mockCollection),
    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    add: vi.fn(data => Promise.resolve(mockDoc({ ...data, id:'newClaimId' }))), // Simpler add
    set: vi.fn(data => Promise.resolve(mockDoc(data))), // For set on new doc ref
  };
   mockCollection.doc = vi.fn(docId => ({ // more specific mock for collection().doc()
    get: vi.fn().mockResolvedValue(mockDoc({id: docId})),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    id: docId || 'mockGeneratedId'
  }));

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => mockCollection),
    },
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date(), seconds: Date.now() / 1000, nanoseconds: 0 })),
      fromDate: vi.fn((date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
    },
    // For Filter.or
    FirebaseFirestore: { Filter: { or: vi.fn((...args) => args), where: vi.fn((...args) => args) } } 
  };
});
// --- END MOCK SETUP ---

describe('/api/claims', () => {
  let mockLocals;
  let mockRequest;
  let mockBookingData;
  let mockClaimData;

  beforeEach(() => {
    vi.resetAllMocks();
    mockLocals = { user: null };
    mockRequest = {
      json: vi.fn(),
      url: new URL('http://localhost/api/claims'),
    };

    mockBookingData = {
      id: 'booking123',
      listingId: 'listingABC',
      ownerUid: 'ownerUID',
      renterUid: 'renterUID',
      // ... other booking fields
    };

    mockClaimData = {
      id: 'claimXYZ',
      bookingId: 'booking123',
      listingId: 'listingABC',
      claimantUid: 'renterUID',
      ownerUid: 'ownerUID',
      renterUid: 'renterUID',
      reason: 'Damage',
      description: 'Item was damaged during rental.',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Default mock for adminDb.collection().doc().get()
    const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
    vi.mocked(mockedDb.collection('bookings').doc('booking123').get).mockResolvedValue({
        exists: true,
        id: 'booking123',
        data: () => mockBookingData,
    });
    vi.mocked(mockedDb.collection('claims').doc('claimXYZ').get).mockResolvedValue({
        exists: true,
        id: 'claimXYZ',
        data: () => mockClaimData,
    });
     vi.mocked(mockedDb.collection('claims').doc().set).mockImplementation(async (data) => {
      // Simulate setting data and then returning it as if it were read back
      return Promise.resolve();
    });
  });

  // --- POST /api/claims ---
  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 400 for invalid input data', async () => {
      mockLocals.user = { uid: 'renterUID' };
      mockRequest.json.mockResolvedValueOnce({ bookingId: 'booking123' /* missing reason, desc */ });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, 'Invalid or missing reason');
    });

    it('should return 404 if booking not found', async () => {
      mockLocals.user = { uid: 'renterUID' };
      mockRequest.json.mockResolvedValueOnce({ bookingId: 'nonExistentBooking', reason: 'Test', description: 'Test desc' });
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      vi.mocked(mockedDb.collection('bookings').doc('nonExistentBooking').get).mockResolvedValueOnce({ exists: false });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(404, 'Booking not found');
    });

    it('should return 403 if user is not part of the booking', async () => {
      mockLocals.user = { uid: 'otherUserUID' }; // This user is not owner or renter
      mockRequest.json.mockResolvedValueOnce({ bookingId: 'booking123', reason: 'Test', description: 'Test desc' });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(403, 'Forbidden: User is not associated with this booking');
    });

    it('should create a claim successfully if user is renter', async () => {
      mockLocals.user = { uid: 'renterUID' };
      const newClaimInput = { bookingId: 'booking123', reason: 'Damage', description: 'Item damaged', evidenceUrls: ['http://example.com/img.jpg'] };
      mockRequest.json.mockResolvedValueOnce(newClaimInput);
      
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const newDocRef = { id: 'newClaimGeneratedId', set: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockedDb.collection('claims').doc).mockReturnValue(newDocRef);


      const response = await POST({ request: mockRequest, locals: mockLocals });

      expect(newDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
        id: 'newClaimGeneratedId',
        bookingId: newClaimInput.bookingId,
        listingId: mockBookingData.listingId,
        claimantUid: mockLocals.user.uid,
        ownerUid: mockBookingData.ownerUid,
        renterUid: mockBookingData.renterUid,
        reason: newClaimInput.reason,
        description: newClaimInput.description,
        status: 'pending',
        evidenceUrls: newClaimInput.evidenceUrls,
      }));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Claim created successfully', claim: expect.any(Object) }),
        { status: 201 }
      );
    });
  });

  // --- GET /api/claims ---
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should fetch claims for non-admin user (as claimant)', async () => {
      mockLocals.user = { uid: 'renterUID', isAdmin: false };
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const claimsDocs = [{ id: 'claim1', data: () => ({ ...mockClaimData, claimantUid: 'renterUID' }) }];
      vi.mocked(mockedDb.collection('claims').get).mockResolvedValueOnce({ empty: false, docs: claimsDocs });

      await GET({ request: mockRequest, locals: mockLocals });
      expect(mockedDb.collection('claims').where).toHaveBeenCalledWith(expect.anything()); // For the OR filter
      expect(json).toHaveBeenCalledWith({ claims: expect.arrayContaining([expect.objectContaining({ id: 'claim1' })]) });
    });
    
    it('should fetch claims for non-admin user (as owner)', async () => {
      mockLocals.user = { uid: 'ownerUID', isAdmin: false };
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const claimsDocs = [{ id: 'claim1', data: () => ({ ...mockClaimData, ownerUid: 'ownerUID' }) }];
      vi.mocked(mockedDb.collection('claims').get).mockResolvedValueOnce({ empty: false, docs: claimsDocs });
      
      await GET({ request: mockRequest, locals: mockLocals });
      expect(mockedDb.collection('claims').where).toHaveBeenCalledWith(expect.anything()); // For the OR filter
      expect(json).toHaveBeenCalledWith({ claims: expect.arrayContaining([expect.objectContaining({ id: 'claim1' })]) });
    });


    it('should fetch all claims for admin user', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const claimsDocs = [
        { id: 'claim1', data: () => mockClaimData },
        { id: 'claim2', data: () => ({ ...mockClaimData, id: 'claim2', claimantUid: 'anotherUser' }) }
      ];
      vi.mocked(mockedDb.collection('claims').get).mockResolvedValueOnce({ empty: false, docs: claimsDocs });
      
      await GET({ request: mockRequest, locals: mockLocals });
      // Admin path doesn't call .where for user filtering unless status is passed
      expect(mockedDb.collection('claims').where).not.toHaveBeenCalledWith(expect.stringContaining('claimantUid'), '==', expect.anything());
      expect(json).toHaveBeenCalledWith({ claims: expect.arrayContaining([expect.objectContaining({ id: 'claim1' }), expect.objectContaining({ id: 'claim2' })]) });
    });

    it('should filter claims by status for admin', async () => {
        mockLocals.user = { uid: 'adminUID', isAdmin: true };
        mockRequest.url.searchParams.set('status', 'pending');
        const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
        await GET({ request: mockRequest, locals: mockLocals });
        expect(mockedDb.collection('claims').where).toHaveBeenCalledWith('status', '==', 'pending');
    });
  });

  // --- PUT /api/claims ---
  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 403 if user is not admin', async () => {
      mockLocals.user = { uid: 'nonAdminUID', isAdmin: false };
      mockRequest.json.mockResolvedValueOnce({ claimId: 'claimXYZ', status: 'approved' });
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(403, 'Forbidden: Only admins can update claim status');
    });

    it('should return 400 for invalid status update data', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      mockRequest.json.mockResolvedValueOnce({ claimId: 'claimXYZ' /* missing status */ });
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, expect.stringContaining('Invalid status. Must be one of:'));
    });
    
    it('should return 404 if claim not found for update', async () => {
        mockLocals.user = { uid: 'adminUID', isAdmin: true };
        mockRequest.json.mockResolvedValueOnce({ claimId: 'nonExistentClaim', status: 'approved' });
        const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
        vi.mocked(mockedDb.collection('claims').doc('nonExistentClaim').get).mockResolvedValueOnce({ exists: false });
        await PUT({ request: mockRequest, locals: mockLocals });
        expect(error).toHaveBeenCalledWith(404, 'Claim not found');
    });

    it('should update claim status successfully by admin', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      const updatePayload = { claimId: 'claimXYZ', status: 'approved', resolutionDetails: 'Approved by admin.' };
      mockRequest.json.mockResolvedValueOnce(updatePayload);
      
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const claimDocRefMock = vi.mocked(mockedDb.collection('claims').doc('claimXYZ'));
      vi.mocked(claimDocRefMock.get).mockResolvedValue({ exists: true, data: () => mockClaimData });
      vi.mocked(claimDocRefMock.update).mockResolvedValue(undefined);

      const response = await PUT({ request: mockRequest, locals: mockLocals });
      
      expect(claimDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
        status: updatePayload.status,
        resolutionDetails: updatePayload.resolutionDetails,
        updatedAt: expect.any(Object), // Timestamp.now()
        resolvedAt: expect.any(Object), // Timestamp.now() because status is 'approved'
      }));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Claim status updated successfully', claim: expect.any(Object) })
      );
      expect(json.mock.calls[0][0].claim.status).toBe('approved');
    });
  });
});
