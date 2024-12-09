import  { useState,useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, storage } from "../firebaseconfig";
import { doc, updateDoc,getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSelector } from "react-redux";
import { RootState } from "../store";

function EditProfilePage() {
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const email = useSelector((state: RootState) => state.auth.email); 
  const handleSave = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const updates: { name?: string; bio?: string; photoURL?: string; coverImageURL?: string } = {};

      if (userName) updates.name = userName;
      if (userBio) updates.bio = userBio;

      if (userPhoto) {
        const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(photoRef, userPhoto);
        updates.photoURL = await getDownloadURL(photoRef);
      }

      if (coverPhoto) {
        const coverRef = ref(storage, `users/${user.uid}/cover.jpg`);
        await uploadBytes(coverRef, coverPhoto);
        updates.coverImageURL = await getDownloadURL(coverRef);
      }

      await updateDoc(userDocRef, updates);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  useEffect(() => {
    if (email) {
      const auth = getAuth();

      onAuthStateChanged(auth, async (user) => {
        if (user?.email === email) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUserName(userData.name || null);
              setUserBio(userData.bio || null);
              setUserPhoto(userData.photoURL || "");
              setCoverPhoto(userData.coverImageURL || "");
            } else {
              console.log("No user data found for UID:", user.uid);
            }
          } catch (error) {
            console.error("Error fetching user details: ", error);
          }
        }
      });
    }
  }, [email]);
  return (
    <div className="bg-white relative min-h-screen">
      <h1 className="text-lg font-bold mb-4">Edit Profile</h1>

      <div className="mb-4">
        <label className="block font-semibold">Name</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full border-b border-black  px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Bio</label>
        <textarea
          value={userBio}
          onChange={(e) => setUserBio(e.target.value)}
          className="w-full border-b border-black  px-3 py-2"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setUserPhoto(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Cover Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      <button
        className="bg-black text-white  py-1 rounded-full absolute w-full bottom-4 "
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
}

export default EditProfilePage;
