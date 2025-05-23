import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, PUT } from './api/ggverify/+server'; // Adjust path
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
    id: data?.id || 'mockVerificationId',
    data: vi.fn(() => data),
  });
  const mockCollection = {
    doc: vi.fn((id) => ({
        get: vi.fn().mockResolvedValue(mockDoc({id})),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        id: id || 'mockGeneratedId'
    })),
    where: vi.fn(() => mockCollection),
    orderBy: vi.fn(() => mockCollection),
    limit: vi.fn(() => mockCollection),
    startAfter: vi.fn(() => mockCollection),
    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  };
  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => mockCollection),
    },
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date(), seconds: Date.now() / 1000, nanoseconds: 0 })),
      fromDate: vi.fn((date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
    },
  };
});
// --- END MOCK SETUP ---

describe('/api/ggverify', () => {
  let mockLocals;
  let mockRequest;
  let mockVerificationData;
  let mockUserData;

  beforeEach(() => {
    vi.resetAllMocks();
    mockLocals = { user: null };
    mockRequest = {
      json: vi.fn(),
      url: new URL('http://localhost/api/ggverify'),
    };

    mockUserData = {
        uid: 'testUser123',
        isGGVerified: false,
        // other user fields
    };

    mockVerificationData = {
      id: 'verificationAbc',
      userId: 'testUser123',
      documentType: 'passport',
      documentFrontUrl: 'http://example.com/front.jpg',
      faceImageUrl: 'http://example.com/face.jpg',
      status: 'pending_review',
      attempts: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
    vi.mocked(mockedDb.collection('gg_verifications').doc('verificationAbc').get).mockResolvedValue({
        exists: true,
        id: 'verificationAbc',
        data: () => mockVerificationData,
    });
     vi.mocked(mockedDb.collection('users').doc('testUser123').get).mockResolvedValue({
        exists: true,
        id: 'testUser123',
        data: () => mockUserData,
    });
    vi.mocked(mockedDb.collection('gg_verifications').doc().set).mockImplementation(async (data) => {
      return Promise.resolve();
    });
  });

  // --- POST /api/ggverify ---
  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 400 for invalid submission data', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ documentType: 'invalid_type' });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, expect.stringContaining('Invalid or missing documentType'));
    });
    
    it('should return 403 if non-admin tries to submit for another user', async () => {
      mockLocals.user = { uid: 'testUser123', isAdmin: false };
      mockRequest.json.mockResolvedValueOnce({ 
        userId: 'anotherUser', // Attempting to submit for someone else
        documentType: 'passport', 
        documentFrontUrl: 'url', 
        faceImageUrl: 'url' 
      });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(403, 'Forbidden: You can only submit verification requests for yourself.');
    });

    it('should return 409 if active/approved verification already exists', async () => {
      mockLocals.user = { uid: 'testUser123' };
      mockRequest.json.mockResolvedValueOnce({ documentType: 'passport', documentFrontUrl: 'url', faceImageUrl: 'url' });
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      vi.mocked(mockedDb.collection('gg_verifications').get).mockResolvedValueOnce({ 
          empty: false, 
          docs: [{ id: 'existingVerification', data: () => ({ ...mockVerificationData, status: 'approved' }) }] 
      });
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(409, 'Conflict: An active or approved verification request already exists for this user.');
    });
    
    it('should return 404 if target user for verification does not exist', async () => {
      mockLocals.user = { uid: 'adminUser123', isAdmin: true }; // Admin submitting
      const targetUserId = 'nonExistentUser';
      mockRequest.json.mockResolvedValueOnce({ 
        userId: targetUserId, 
        documentType: 'passport', 
        documentFrontUrl: 'url1', 
        faceImageUrl: 'url2' 
      });
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      vi.mocked(mockedDb.collection('users').doc(targetUserId).get).mockResolvedValue({ exists: false });
      
      await POST({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(404, `User with ID ${targetUserId} not found.`);
    });

    it('should submit a verification request successfully for self', async () => {
      mockLocals.user = { uid: 'testUser123' };
      const submissionData = { documentType: 'passport', documentFrontUrl: 'url1', faceImageUrl: 'url2' };
      mockRequest.json.mockResolvedValueOnce(submissionData);

      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const newDocRef = { id: 'newVerificationId', set: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockedDb.collection('gg_verifications').doc).mockReturnValue(newDocRef);
      // Ensure no existing pending/approved verification
      vi.mocked(mockedDb.collection('gg_verifications').get).mockResolvedValueOnce({ empty: true, docs: [] });


      const response = await POST({ request: mockRequest, locals: mockLocals });
      expect(newDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
        id: 'newVerificationId',
        userId: mockLocals.user.uid,
        status: 'pending_review',
        attempts: 1,
        ...submissionData
      }));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verification request submitted successfully', verification: expect.any(Object) }),
        { status: 201 }
      );
    });
    
    it('should allow admin to submit a verification request for another user', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      const targetUserId = 'testUser123';
      const submissionData = { userId: targetUserId, documentType: 'national_id', documentFrontUrl: 'url_front', faceImageUrl: 'url_face' };
      mockRequest.json.mockResolvedValueOnce(submissionData);

      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const newDocRef = { id: 'newAdminSubVerificationId', set: vi.fn().mockResolvedValue(undefined) };
      vi.mocked(mockedDb.collection('gg_verifications').doc).mockReturnValue(newDocRef);
      vi.mocked(mockedDb.collection('gg_verifications').get).mockResolvedValueOnce({ empty: true, docs: [] }); // No existing

      await POST({ request: mockRequest, locals: mockLocals });
      expect(newDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
        userId: targetUserId,
        documentType: submissionData.documentType,
        status: 'pending_review',
      }));
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Verification request submitted successfully' }), { status: 201 });
    });
  });

  // --- GET /api/ggverify ---
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      await GET({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should fetch own verification requests for non-admin user', async () => {
      mockLocals.user = { uid: 'testUser123', isAdmin: false };
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const userVerifications = [{ id: 'v1', data: () => ({ ...mockVerificationData, userId: 'testUser123' }) }];
      vi.mocked(mockedDb.collection('gg_verifications').get).mockResolvedValueOnce({ empty: false, docs: userVerifications });
      
      await GET({ request: mockRequest, locals: mockLocals });
      expect(mockedDb.collection('gg_verifications').where).toHaveBeenCalledWith('userId', '==', 'testUser123');
      expect(json).toHaveBeenCalledWith({ verifications: expect.arrayContaining([expect.objectContaining({ id: 'v1' })]) });
    });

    it('should fetch all/filtered requests for admin user', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      mockRequest.url.searchParams.set('status', 'pending_review');
      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const allVerifications = [
          { id: 'v1', data: () => mockVerificationData }, 
          { id: 'v2', data: () => ({...mockVerificationData, id: 'v2', userId: 'anotherUserUID'})}
        ];
      vi.mocked(mockedDb.collection('gg_verifications').get).mockResolvedValueOnce({ empty: false, docs: allVerifications });

      await GET({ request: mockRequest, locals: mockLocals });
      expect(mockedDb.collection('gg_verifications').where).toHaveBeenCalledWith('status', '==', 'pending_review');
      expect(json).toHaveBeenCalledWith({ verifications: expect.any(Array) });
    });
  });

  // --- PUT /api/ggverify ---
  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should return 403 if user is not admin', async () => {
      mockLocals.user = { uid: 'nonAdminUID', isAdmin: false };
      mockRequest.json.mockResolvedValueOnce({ verificationId: 'verificationAbc', status: 'approved' });
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(403, 'Forbidden: Only admins can update verification status');
    });

    it('should return 400 for invalid update data', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      mockRequest.json.mockResolvedValueOnce({ verificationId: 'verificationAbc', status: 'invalid_status_value' });
      await PUT({ request: mockRequest, locals: mockLocals });
      expect(error).toHaveBeenCalledWith(400, expect.stringContaining('Invalid status. Must be one of:'));
    });
    
    it('should return 404 if verification request not found for update', async () => {
        mockLocals.user = { uid: 'adminUID', isAdmin: true };
        const nonExistentId = 'nonExistentVerificationId';
        mockRequest.json.mockResolvedValueOnce({ verificationId: nonExistentId, status: 'approved' });
        const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
        vi.mocked(mockedDb.collection('gg_verifications').doc(nonExistentId).get).mockResolvedValueOnce({ exists: false });
        await PUT({ request: mockRequest, locals: mockLocals });
        expect(error).toHaveBeenCalledWith(404, 'Verification request not found');
    });

    it('should update verification status and user profile on approval', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      const updatePayload = { verificationId: 'verificationAbc', status: 'approved' as const };
      mockRequest.json.mockResolvedValueOnce(updatePayload);

      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const verificationDocRefMock = vi.mocked(mockedDb.collection('gg_verifications').doc('verificationAbc'));
      vi.mocked(verificationDocRefMock.get).mockResolvedValue({ exists: true, data: () => mockVerificationData }); // Ensure it returns the data
      vi.mocked(verificationDocRefMock.update).mockResolvedValue(undefined);
      
      const userDocRefMock = vi.mocked(mockedDb.collection('users').doc(mockVerificationData.userId));
      vi.mocked(userDocRefMock.update).mockResolvedValue(undefined);


      const response = await PUT({ request: mockRequest, locals: mockLocals });

      expect(verificationDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'approved',
        reviewedAt: expect.any(Object), // Timestamp
        reviewedBy: 'adminUID',
      }));
      expect(userDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
        isGGVerified: true,
        ggVerifiedAt: expect.any(Object), // Timestamp
        ggVerificationLevel: 'level1',
      }));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verification status updated successfully', verification: expect.any(Object) })
      );
      expect(json.mock.calls[0][0].verification.status).toBe('approved');
    });
    
    it('should update verification status to rejected with reason', async () => {
      mockLocals.user = { uid: 'adminUID', isAdmin: true };
      const updatePayload = { 
        verificationId: 'verificationAbc', 
        status: 'rejected' as const, 
        rejectionReason: 'Document blurry',
        rejectionCode: 'POOR_QUALITY' 
      };
      mockRequest.json.mockResolvedValueOnce(updatePayload);

      const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
      const verificationDocRefMock = vi.mocked(mockedDb.collection('gg_verifications').doc('verificationAbc'));
      vi.mocked(verificationDocRefMock.get).mockResolvedValue({ exists: true, data: () => mockVerificationData });
      vi.mocked(verificationDocRefMock.update).mockResolvedValue(undefined);
      
      // Ensure user profile is NOT updated for ggverified status on rejection
      const userDocRefMock = vi.mocked(mockedDb.collection('users').doc(mockVerificationData.userId));

      await PUT({ request: mockRequest, locals: mockLocals });

      expect(verificationDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'rejected',
        rejectionReason: updatePayload.rejectionReason,
        rejectionCode: updatePayload.rejectionCode,
        reviewedAt: expect.any(Object),
        reviewedBy: 'adminUID',
      }));
      expect(userDocRefMock.update).not.toHaveBeenCalledWith(expect.objectContaining({ isGGVerified: true }));
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Verification status updated successfully' }));
      expect(json.mock.calls[0][0].verification.status).toBe('rejected');
    });
    
    it('should update user profile if an approved verification is changed to non-approved', async () => {
        mockLocals.user = { uid: 'adminUID', isAdmin: true };
        const previouslyApprovedVerificationData = { ...mockVerificationData, status: 'approved' as const };
        const updatePayload = { verificationId: 'verificationAbc', status: 'needs_resubmission' as const, rejectionReason: 'Expired' };
        mockRequest.json.mockResolvedValueOnce(updatePayload);

        const { adminDb: mockedDb } = vi.mocked(await import('$firebase/server'));
        const verificationDocRefMock = vi.mocked(mockedDb.collection('gg_verifications').doc('verificationAbc'));
        vi.mocked(verificationDocRefMock.get).mockResolvedValue({ exists: true, data: () => previouslyApprovedVerificationData });
        vi.mocked(verificationDocRefMock.update).mockResolvedValue(undefined);
        
        const userDocRefMock = vi.mocked(mockedDb.collection('users').doc(previouslyApprovedVerificationData.userId));
        vi.mocked(userDocRefMock.update).mockResolvedValue(undefined);

        await PUT({ request: mockRequest, locals: mockLocals });

        expect(verificationDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'needs_resubmission',
            rejectionReason: 'Expired'
        }));
        expect(userDocRefMock.update).toHaveBeenCalledWith(expect.objectContaining({
            isGGVerified: false,
        }));
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Verification status updated successfully' }));
    });
  });
});
