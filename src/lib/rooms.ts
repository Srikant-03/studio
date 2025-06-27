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

export async function createRoom(
  roomName: string,
  pdfName: string,
  userId: string
): Promise<string> {
  // Create room document in Firestore
  const roomData = {
    name: roomName,
    pdfName: pdfName,
    creatorId: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  };
  const roomRef = await addDoc(collection(db, 'rooms'), roomData);

  // Add room to user's room list
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    rooms: arrayUnion(roomRef.id),
  });

  return roomRef.id;
}

export async function joinRoom(roomId: string, userId:string): Promise<boolean> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        console.error("Room does not exist");
        return false;
    }
    
    // Add user to room's members
    await updateDoc(roomRef, {
        members: arrayUnion(userId)
    });
    
    // Add room to user's list
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rooms: arrayUnion(roomId)
    });
    
    return true;
}

export async function getUserRooms(userId: string): Promise<Room[]> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || !userSnap.data()?.rooms) {
        return [];
    }

    const roomIds: string[] = userSnap.data().rooms;
    if (roomIds.length === 0) return [];
    
    const roomsQuery = query(collection(db, 'rooms'), where('__name__', 'in', roomIds));
    const roomsSnapshot = await getDocs(roomsQuery);
    
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    return rooms;
}

export async function getRoom(roomId: string): Promise<Room | null> {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
        return { id: roomSnap.id, ...roomSnap.data() } as Room;
    } else {
        return null;
    }
}
