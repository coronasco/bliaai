import { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, getFirestore, onSnapshot, query, where } from "firebase/firestore";

export const getPremiumStatus = async (app: FirebaseApp) => {
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;

    if (!userId) throw new Error("User not found");

    const db = getFirestore(app);
    const subscriptionRef = collection(db, "customers", userId, "subscriptions");
    const q = query(
        subscriptionRef,
        where("status", "in", ["trailing", "active"])
    )
    
    return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.docs.length === 0) {
                resolve(false);
            } else {
                resolve(true);
            }

            unsubscribe();
        },
        reject
    )
    })
}