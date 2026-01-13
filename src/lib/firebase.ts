import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBIe-l_1pSlxb0HZGK8Q4-CRG8gyO7uJ4I",
  authDomain: "cattv-99bd2.firebaseapp.com",
  projectId: "cattv-99bd2",
  storageBucket: "cattv-99bd2.firebasestorage.app",
  messagingSenderId: "411688090914",
  appId: "1:411688090914:web:3461c494f438bd3ad7797b",
  measurementId: "G-TWYQN2W46P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services (Firestore for real-time listeners, Storage for uploads)
export const db = getFirestore(app);
export const storage = getStorage(app);

// API base URL for cloud functions
const API_BASE = 'https://us-central1-cattv-99bd2.cloudfunctions.net';

// Generic function caller that takes a Privy token
async function callFunction(name: string, token: string | null, data: unknown = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return { data: json.result };
}

// Cloud function callers - now take token as parameter
export const createApiCaller = (getToken: () => Promise<string | null>) => ({
  callGetUser: async () => {
    const token = await getToken();
    return callFunction('getUser', token);
  },
  callClaimDaily: async () => {
    const token = await getToken();
    return callFunction('claimDaily', token);
  },
  callFeed: async (data: { catId: string }) => {
    const token = await getToken();
    return callFunction('feed', token, data);
  },
  callAddCat: async (data: { name: string; mediaUrl: string; mediaType: string; vibes?: string[] }) => {
    const token = await getToken();
    return callFunction('addCat', token, data);
  },
  callUpdateCatVibes: async (data: { catId: string; vibes: string[] }) => {
    const token = await getToken();
    return callFunction('updateCatVibes', token, data);
  },
  callGetCats: async () => {
    const token = await getToken();
    return callFunction('getCats', token);
  },
  callGetStats: async () => {
    const token = await getToken();
    return callFunction('getStats', token);
  },
  callCreateCheckout: async (data: { tierId: string }) => {
    const token = await getToken();
    return callFunction('createCheckoutSession', token, data);
  },
  callGetPurchaseTiers: async () => {
    const token = await getToken();
    return callFunction('getPurchaseTiers', token);
  },
  callUploadMedia: async (data: { fileData: string; contentType: string; fileName: string }) => {
    const token = await getToken();
    return callFunction('uploadMedia', token, data);
  },
});
