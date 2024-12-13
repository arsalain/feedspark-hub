import  { useState,useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, storage } from "../firebaseconfig";
import { doc, updateDoc,getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; 

function EditProfilePage() {
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null); 
  const [loading, setLoading] = useState(false); 
  const email = useSelector((state: RootState) => state.auth.email); 
  const navigate = useNavigate();
  const handleSave = async () => {
    setLoading(true); // Show loader
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) return;
  
      const userDocRef = doc(db, "users", user.uid);
      const updates: { name?: string; bio?: string; photoURL?: string; coverImageURL?: string } = {};
  
      if (userName) updates.name = userName;
      if (userBio) updates.bio = userBio;
  
      if (userPhoto && userPhoto.size > 0) { // Only upload if a valid file is selected
        const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(photoRef, userPhoto);
        updates.photoURL = await getDownloadURL(photoRef);
      }
  
      if (coverPhoto && coverPhoto.size > 0) { // Only upload if a valid file is selected
        const coverRef = ref(storage, `users/${user.uid}/cover.jpg`);
        await uploadBytes(coverRef, coverPhoto);
        updates.coverImageURL = await getDownloadURL(coverRef);
      }
  
      await updateDoc(userDocRef, updates);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false); // Hide loader
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
              setUserPhoto(userData.photoURL || null);
              setCoverPhoto(userData.coverImageURL || null);
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
  const profileImageSrc = userPhoto instanceof File
  ? URL.createObjectURL(userPhoto)
  : userPhoto || "/path/to/placeholder-image.jpg";

const coverImageSrc = coverPhoto instanceof File
  ? URL.createObjectURL(coverPhoto)
  : coverPhoto || "/path/to/placeholder-cover.jpg";

  
  return (
    <div className="bg-white relative min-h-screen">
          <div className="relative h-[220px]">
            <div></div>
        <FaArrowLeftLong className="absolute top-[23px] left-[20px] text-white text-xl z-10" onClick={() => navigate("/profile")} ></FaArrowLeftLong>
      <h1 className="absolute top-[20px] left-[35px] text-white text-lg font-bold ml-4 z-10">Edit Profile</h1>
      <div className="relative w-full h-[165px] rounded-b-[15px]">
  <img
    src={coverImageSrc}
    alt="coverimage"
    className="w-full h-full object-cover rounded-b-[15px]"
  />
  {/* <div className="absolute bottom-2 right-4 bg-gray-100 rounded-full h-[35px] w-[35px] flex justify-center items-center z-10">
  <FaPen className="text-black text-[11px]" />
  </div> */}
  <div className="absolute bottom-2 right-4 bg-gray-100 rounded-full h-[35px] w-[35px] flex justify-center items-center z-10">
  <label className="cursor-pointer">
    <FaPen className="text-black text-[11px]" />
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
      className="hidden"
    />
  </label>
</div>

  <div className="absolute inset-0 bg-black bg-opacity-20 rounded-b-[15px]"></div>
  </div>
  <div className="flex gap-4 absolute top-[120px] left-[15px] right-[15px]">
  <div className="relative w-[90px] h-[90px]">
    <img
      src={profileImageSrc}
      alt={userName}
      className="w-full h-full rounded-full object-cover"
    />
     <div className="absolute bottom-1 right-[-8px] bg-gray-100 rounded-full h-[35px] w-[35px] flex justify-center items-center z-10">
  <label className="cursor-pointer">
    <FaPen className="text-black text-[11px]" />
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setUserPhoto(e.target.files?.[0] || null)}
      className="hidden"
    />
  </label>
</div>

    <div className="absolute inset-0 bg-black bg-opacity-10 rounded-full"></div>
  </div>
</div>

     
      </div>
<div >
      <div className="mb-4 px-4">
        <label className="block font-semibold">Name</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full border-b border-black   py-1 focus:outline-none focus:ring-0"
        />
      </div>

      <div className="mb-4 px-4">
        <label className="block font-semibold">Bio</label>
        <textarea
          value={userBio}
          onChange={(e) => setUserBio(e.target.value)}
          className="w-full border-b border-black  focus:outline-none focus:ring-0 py-1"
        />
      </div>

<div className="">
      <button
        className="bg-black text-white  py-1 rounded-full absolute bottom-4 left-4 right-4"
        onClick={handleSave}
      >
        Save
      </button>
      </div>
      </div>
      {loading && (
  <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
    <div className="loader">Loading...</div>
  </div>
)}

    </div>
  );
}

export default EditProfilePage;
