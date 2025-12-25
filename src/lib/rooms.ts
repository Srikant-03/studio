import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type { Room } from '@/types/hearthlink';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function createRoom(
  roomName: string,
  pdfName: string,
  userId: string
): Promise<string> {
  const roomData = {
    name: roomName,
    pdfName: pdfName,
    creatorId: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  };
  const roomsCollection = collection(db, 'rooms');
  const roomRef = await addDoc(roomsCollection, roomData)
    .catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomsCollection.path,
            operation: 'create',
            requestResourceData: roomData,
        }));
        throw serverError;
    });


  // Add room to user's room list
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    rooms: arrayUnion(roomRef.id),
  }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { rooms: arrayUnion(roomRef.id) },
    }));
    throw serverError;
  });

  return roomRef.id;
}

export async function joinRoom(roomId: string, userId:string): Promise<boolean> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomRef.path,
            operation: 'get',
        }));
        throw serverError;
    });

    if (!roomSnap.exists()) {
        console.error("Room does not exist");
        return false;
    }
    
    // Add user to room's members
    await updateDoc(roomRef, {
        members: arrayUnion(userId)
    }).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomRef.path,
            operation: 'update',
            requestResourceData: { members: arrayUnion(userId) },
        }));
        throw serverError;
    });
    
    // Add room to user's list
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rooms: arrayUnion(roomId)
    }).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: { rooms: arrayUnion(roomId) },
        }));
        throw serverError;
    });
    
    return true;
}

export async function getUserRooms(userId: string): Promise<Room[]> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'get',
        }));
        throw serverError;
    });

    if (!userSnap.exists() || !userSnap.data()?.rooms) {
        return [];
    }

    const roomIds: string[] = userSnap.data().rooms;
    if (roomIds.length === 0) return [];
    
    // Fetch each room document individually to avoid potential 'in' query issues.
    const roomPromises = roomIds
        .filter(id => typeof id === 'string' && id.trim() !== '') // Ensure IDs are valid strings
        .map(id => getDoc(doc(db, 'rooms', id)).catch((serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: doc(db, 'rooms', id).path,
                operation: 'get',
            }));
            // We don't rethrow here, just filter it out later.
            return null;
        }));
    
    const roomSnapshots = await Promise.all(roomPromises);

    const rooms = roomSnapshots
        .filter((snap): snap is import('firebase/firestore').DocumentSnapshot => snap !== null && snap.exists())
        .map(snap => ({ id: snap.id, ...snap.data() } as Room));
        
    return rooms;
}

export async function getRoom(roomId: string): Promise<Room | null> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomRef.path,
            operation: 'get',
        }));
        throw serverError;
    });

    if (roomSnap.exists()) {
        return { id: roomSnap.id, ...roomSnap.data() } as Room;
    } else {
        return null;
    }
}
