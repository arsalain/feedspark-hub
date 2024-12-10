import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa"; 
import { FaArrowLeftLong } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../store"; // Import root state type
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebaseconfig";
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from "react-router-dom"; 
import { GoPlus } from "react-icons/go";

function ProfilePage() {
  const email = useSelector((state: RootState) => state.auth.email); 
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userPhotoURL, setUserPhotoURL] = useState("");
  const [coverImageURL, setCoverImageURL] = useState("");
  const navigate = useNavigate();
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
              setUserPhotoURL(userData.photoURL || "");
              setCoverImageURL(userData.coverImageURL || "");
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
    <div className=" bg-white">
      {/* Profile Header */}
      <div className="relative h-[220px]">
        <FaArrowLeftLong className="absolute top-[25px] left-[20px] text-white text-xl" />
        <img src={coverImageURL}
            alt="coverimage"
            className=" w-full h-[165px] rounded-b-[15px]">
        </img>
      <div className=" flex gap-4 absolute top-[120px] left-[15px] right-[15px]"> 
          <img
            src={userPhotoURL}
            alt={userName}
            className=" w-[90px] h-[90px] rounded-full"
          />
             <div className="w-full h-[30px] border border-black rounded-full text-center mt-[55px]"   onClick={() => navigate("/edit-profile")}>
            Edit Profile
        </div>
        </div>
     
      </div>
      <div className="flex items-center gap-4 mb-5 px-[15px]">
     
        <div>
          <h1 className="text-lg font-bold">{userName}</h1>
          <p className="text-gray-600 text-sm">{userBio}</p>
        </div>
      </div>

      {/* Edit Profile */}

      {/* My Posts */}
      <h3 className="text-lg font-semibold mb-3">My Posts</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="post-container">
          <img
            src="https://source.unsplash.com/400x400"
            alt="Design meet"
            className="rounded-lg"
          />
          <p className="text-sm mt-2">Design meet ❤️</p>
          <p className="text-sm text-gray-500">67 Likes</p>
        </div>
        <div className="post-container">
          <img
            src="https://source.unsplash.com/random/400x400"
            alt="Working on a B2B"
            className="rounded-lg"
          />
          <p className="text-sm mt-2">Working on a B2B ✍️</p>
          <p className="text-sm text-gray-500">40 Likes</p>
        </div>
        <div className="post-container">
          <img
            src="https://source.unsplash.com/random/401x400"
            alt="Parachute"
            className="rounded-lg"
          />
          <p className="text-sm mt-2">Parachute ❤️</p>
          <p className="text-sm text-gray-500">65 Likes</p>
        </div>
      </div>
      <div className="absolute bottom-[20px] right-[10px] bg-black rounded-full w-[50px] h-[50px] text-white flex items-center justify-center"  onClick={() => navigate("/create-post")}>
        <GoPlus className="text-white text-2xl" />
      </div>
    </div>
  );
}

export default ProfilePage;
