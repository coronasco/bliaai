import { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, getFirestore, getDocs } from "firebase/firestore";

export const getPremiumStatus = async (app: FirebaseApp) => {
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;

    if (!userId) throw new Error("User not found");

    const db = getFirestore(app);
    const subscriptionRef = collection(db, "customers", userId, "subscriptions");
    
    try {
        // Folosim getDocs pentru o evaluare directă, nu un listener permanent
        const snapshot = await getDocs(subscriptionRef);
        
        // Un utilizator este premium dacă are cel puțin un abonament cu status "active"
        const isActive = snapshot.docs.some(doc => doc.data().status === "active");
        
        // Pentru debugging
        console.log("[DEBUG] Premium check from getPremiumStatus:", {
            userId,
            isActive,
            numSubscriptions: snapshot.size,
            subscriptions: snapshot.docs.map(doc => ({
                id: doc.id,
                status: doc.data().status
            }))
        });
        
        return isActive;
    } catch (error) {
        console.error("Error checking premium status:", error);
        return false;
    }
}