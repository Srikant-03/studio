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
    DocumentSnapshot,
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

export async function joinRoom(roomId: string, userId: string): Promise<Room | null> {
    const roomRef = doc(db, 'rooms', roomId);
    const userRef = doc(db, 'users', userId);

    // Get room document first to check if it exists
    const roomSnap = await getDoc(roomRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomRef.path,
            operation: 'get',
        }));
        throw serverError;
    });

    if (!roomSnap.exists()) {
        console.error("Room does not exist");
        return null;
    }

    // Add user to room's members list
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

    return { id: roomSnap.id, ...roomSnap.data() } as Room;
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

    // Firestore 'in' queries are limited to 30 elements.
    // If a user has more than 30 rooms, we need to chunk the requests.
    const MAX_IN_QUERIES = 30;
    const roomChunks: string[][] = [];
    for (let i = 0; i < roomIds.length; i += MAX_IN_QUERIES) {
        roomChunks.push(roomIds.slice(i, i + MAX_IN_QUERIES));
    }

    const rooms: Room[] = [];
    for (const chunk of roomChunks) {
        if (chunk.length === 0) continue;

        const roomsQuery = query(collection(db, 'rooms'), where('__name__', 'in', chunk));
        const querySnapshot = await getDocs(roomsQuery).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collection(db, 'rooms').path,
                operation: 'list',
            }));
            throw serverError;
        });

        querySnapshot.forEach((doc) => {
            rooms.push({ id: doc.id, ...doc.data() } as Room);
        });
    }

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

import { deleteDoc, arrayRemove } from 'firebase/firestore';

export async function deleteRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);

    // In a real app, you'd want to use a batch or transaction to remove the room 
    // from ALL users' lists who are members. 
    // For now, simpler implementation:
    // 1. Delete the room document (Subcollections must be deleted manually in client SDK or via Cloud Functions, 
    //    but for this scale, if we just delete the parent room, the UI won't show it anymore.
    //    Ideally we should delete subcollections recursively but client SDK doesn't support recursive delete easily).
    //    Since deletion is rare, we can just delete the room doc.

    await deleteDoc(roomRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: roomRef.path,
            operation: 'delete',
        }));
        throw serverError;
    });

    // Remove from the creator's list (Current User)
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rooms: arrayRemove(roomId)
    });
}
