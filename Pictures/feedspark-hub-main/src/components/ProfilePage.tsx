import React, { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebaseconfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GoPlus } from "react-icons/go";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FaHeart } from "react-icons/fa";
import  { Swiper as SwiperClass } from 'swiper'

function ProfilePage() {
  const email = useSelector((state: RootState) => state.auth.email);
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userPhotoURL, setUserPhotoURL] = useState("");
  const [coverImageURL, setCoverImageURL] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [userPosts, setUserPosts] = useState<Array<{ id: string; media: Array<{ type: string; url: string }>; message?: string; isImage?: number; imageCount?: string; likes?: number }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (email) {
        try {
          // Query Firestore for user details using email
          const usersCollection = collection(db, "users");
          const userQuery = query(usersCollection, where("email", "==", email));
          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            setUserName(userData.name || "");
            setUserBio(userData.bio || "");
            setUserPhotoURL(userData.photoURL || "");
            setCoverImageURL(userData.coverImageURL || "");

            // Fetch user's posts using userID
            const userID = userDoc.id;
            fetchUserPosts(userID);
          } else {
            console.log("No user found with the provided email.");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };

    const fetchUserPosts = async (userID: any) => {
        try {
          const postsCollection = collection(db, "posts");
          const postsQuery = query(postsCollection, where("userId", "==", userID));
          const querySnapshot = await getDocs(postsQuery);
      
          const posts = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              media: Array.isArray(data.media) ? data.media : [],
              isImage: data.media.length, // Ensure media is an array
              message: data.message || "",
              likes: data.likes || 0,
            };
          });
      
          setUserPosts(posts);
        } catch (error) {
          console.error("Error fetching user posts:", error);
        }
      };
      

    fetchUserDetails();
  }, [email]);

  return (
    <div className="bg-white">
      {/* Profile Header */}
      <div className="relative md:h-[365px] h-[220px]">
        <FaArrowLeftLong
          className="absolute top-[23px] left-[20px] text-white text-xl z-10"
          onClick={() => navigate("/feed")}
        />
        <div className="relative">
        <img
          src={coverImageURL}
          alt="coverimage"
          className="w-full md:h-[300px] h-[165px] rounded-b-[15px]"
        />
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-b-[15px]"></div> 
        </div>
     
        <div className="flex gap-4 absolute md:top-[255px] top-[120px] left-[15px] right-[15px]">
          <img
            src={userPhotoURL}
            alt={userName}
            className="w-[90px] h-[90px] rounded-full"
          />
          <div
            className="w-full h-[30px] border border-black rounded-full text-center mt-[55px]"
            onClick={() => navigate("/edit-profile")}
          >
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

      {/* My Posts */}
      <div className="px-4">
      <h3 className="text-lg font-semibold mb-3">My Posts</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 md:gap-6 gap-3">
        {userPosts.map((post) => (
          <div key={post.id} className="relative rounded-lg shadow-lg w-full mb-4">
            <div className="relative">
            <Swiper spaceBetween={10} slidesPerView={1}
            onSlideChange={(swiper: SwiperClass) => setCurrentSlide(swiper.activeIndex + 1)}>
  {post.media.map((mediaItem, index) => (
    <SwiperSlide key={index}>
      {mediaItem.type === "image" ? (
        <img
          className="w-full md:h-[350px] h-[250px] object-cover rounded-lg"
          src={mediaItem.url}
          alt={`Media ${index + 1}`}
        />
      ) : (
        <video
          className="w-full h-[250px] object-cover rounded-lg"
          src={mediaItem.url}
          controls
        />
      )}
    </SwiperSlide>
  ))}
</Swiper>
{post.isImage !== 1 && (
  <div className="absolute top-2 right-2 text-black text-sm px-2 py-[2px] rounded-full bg-white z-20">
    {currentSlide}/{post.isImage}
  </div>
)}

<div className="absolute bottom-[5px] z-30 left-0 right-0 p-2">
              <h3 className="text-sm font-medium text-white line-clamp-1">{post.message || "Untitled"}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-400 flex gap-2"> <FaHeart /> {post.likes || 0}</span>
              </div>
            </div>
           
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-20  rounded-lg"></div> 
          </div>
        ))}
      </div>
      </div>
      <div
        className="absolute bottom-[20px] right-[10px] bg-black rounded-full w-[50px] h-[50px] text-white flex items-center justify-center z-50"
        onClick={() => navigate("/create-post")}
      >
        <GoPlus className="text-white text-2xl" />
      </div>
    </div>
  );
}

export default ProfilePage;
