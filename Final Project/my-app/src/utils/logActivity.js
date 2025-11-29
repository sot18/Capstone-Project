import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export async function logActivity(userId, description) {
  console.log("🔥 LOG ACTIVITY CALLED:", userId, description);  // <--- ADD THIS

  try {
    await addDoc(collection(db, "activities"), {
      userId,
      description,
      timestamp: new Date(), // use real timestamp to avoid null issues
    });

    console.log("✅ Activity saved!");
  } catch (err) {
    console.error("❌ Firestore write error:", err);
  }
}
