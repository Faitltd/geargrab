import { adminFirestore } from '$lib/firebase/server';

const COLLECTION = 'backgroundChecks';
const SEARCH_FIELDS = [
  'reportId',
  'checkrReportId',
  'backgroundCheckReportId',
  'backgroundCheckData.reportId',
  'backgroundCheckData.externalId'
];

function ensureFirestore() {
  if (!adminFirestore) {
    throw new Error('Firebase Admin is not configured. Background check operations are unavailable.');
  }

  return adminFirestore.collection(COLLECTION);
}

function serializeDoc(doc) {
  return {
    id: doc.id,
    ...doc.data()
  };
}

export class BackgroundCheckRecord {
  static async findByReportId(reportId) {
    if (!reportId) return null;

    const collection = ensureFirestore();

    for (const field of SEARCH_FIELDS) {
      try {
        const snapshot = await collection.where(field, '==', reportId).limit(1).get();
        if (!snapshot.empty) {
          return serializeDoc(snapshot.docs[0]);
        }
      } catch (error) {
        console.warn(`BackgroundCheckRecord.findByReportId: unable to query field "${field}"`, error);
      }
    }

    console.warn(`No background check record found for reportId "${reportId}"`);
    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await ensureFirestore().doc(id).get();
    return doc.exists ? serializeDoc(doc) : null;
  }

  static async update(id, data) {
    if (!id) {
      throw new Error('BackgroundCheckRecord.update requires a document ID.');
    }

    const docRef = ensureFirestore().doc(id);
    const timestamp = adminFirestore?.Timestamp?.now?.() ?? new Date();

    await docRef.set(
      {
        ...data,
        updatedAt: timestamp
      },
      { merge: true }
    );
  }

  static async create(record) {
    const docRef = await ensureFirestore().add({
      ...record,
      createdAt: adminFirestore?.Timestamp?.now?.() ?? new Date(),
      updatedAt: adminFirestore?.Timestamp?.now?.() ?? new Date()
    });

    const doc = await docRef.get();
    return serializeDoc(doc);
  }
}
