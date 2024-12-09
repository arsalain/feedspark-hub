import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// import app from "../firebaseconfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { useDispatch } from "react-redux";
import { setEmail } from "../store/authSlice";
import axios from "axios";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Initialize Firebase


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch()

//   const handleGoogleSignIn = async () => {
//     const auth = getAuth();
//     const provider = new GoogleAuthProvider();

//     try {
//       const userCredential = await signInWithPopup(auth, provider);
//       const user = userCredential.user;

//       // Set only email into Redux store
//       dispatch(setEmail(user.email || ""));

//       // Firestore - Check if first-time login
//       const userDocRef = doc(db, "users", user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (!userDoc.exists()) {
//         // First-time login - Save user data to Firestore
//         const randomImageUrl = `https://picsum.photos/480/480?random=${Math.random()}`;
// const randomCoverImageUrl = `https://picsum.photos/1920/1080?random=${Math.random()}`;
//         await setDoc(userDocRef, {
//           name: user.displayName,
//           email: user.email,
//           photoURL: randomImageUrl, // Use random image if photoURL is empty
//           coverImageURL: randomCoverImageUrl,
//           bio: "", // Optional, initialize as empty string
//         });
//         console.log("User document created in Firestore.");
//       } else {
//         console.log("User already exists in Firestore.");
//       }

//       navigate("/feed"); // Redirect to feed after successful sign-in
//     } catch (error) {
//       console.error("Error during Google sign-in:", error);
//     }
//   };
const handleGoogleSignIn = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const storage = getStorage(); // Initialize Firebase Storage

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Set only email into Redux store
    dispatch(setEmail(user.email || ""));

    // Firestore - User document reference
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // First-time login - Generate and upload random images
      const randomProfileImage = await axios.get(
        `https://picsum.photos/480/480`,
        { responseType: "blob" } // Get image as a blob
      );
      const randomCoverImage = await axios.get(
        `https://picsum.photos/1920/1080`,
        { responseType: "blob" }
      );

      // Upload images to Firebase Storage
      const profileImageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      const coverImageRef = ref(storage, `users/${user.uid}/cover.jpg`);

      await uploadBytes(profileImageRef, randomProfileImage.data);
      await uploadBytes(coverImageRef, randomCoverImage.data);

      // Get downloadable URLs for uploaded images
      const profileImageUrl = await getDownloadURL(profileImageRef);
      const coverImageUrl = await getDownloadURL(coverImageRef);

      // Save user data to Firestore
      await setDoc(userDocRef, {
        name: user.displayName,
        email: user.email,
        photoURL: profileImageUrl,
        coverImageURL: coverImageUrl,
        bio: "",
      });
      console.log("User document created in Firestore.");
    } else {
      console.log("User already exists in Firestore.");
    }

    navigate("/feed"); // Redirect to feed after successful sign-in
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};
  return (
    <div className="max-h-screen bg-gray-50 flex flex-col relative">
      <div className="grid grid-cols-3 gap-2 w-full">
  {/* Column 1 */}
  <div className="flex flex-col gap-2">
  <img src="/images/img1.jpg" alt="img-1" className="w-full h-[200px] object-cover" />
  <img src="/images/img2.jpg" alt="img-2" className="w-full h-[200px] object-cover" />
  <img src="/images/img3.jpg" alt="img-3" className="w-full h-[200px] object-cover" />
  </div>
  {/* Column 2 */}
  <div className="flex flex-col gap-2">
  <img
    src="/images/img4.jpg"
    alt="img-4"
    className="col-start-2  w-full h-[80px] object-cover"
  />
  <img
    src="/images/img5.jpg"
    alt="img-5"
    className=" w-full h-[200px] object-cover"
  />
    <img
    src="/images/img9.jpg"
    alt="img-9"
    className=" w-full h-[200px] object-cover"
  />
</div>
  {/* Column 3 */}
  <div  className="flex flex-col gap-2">
  <img src="/images/img6.jpg" alt="img-6" className=" w-full h-[200px] object-cover" />
  <img
    src="/images/img7.jpg"
    alt="img-7"
    className=" w-full h-[200px] object-cover"
  />
  <img src="/images/img8.jpg" alt="img-8" className=" w-full h-[200px] object-cover" />
  </div>
</div>

      {/* App logo and description */}
      <div className="rounded-t-[50px] bg-white absolute bottom-[-25px] left-0 right-0 flex justify-center flex-col ">
      <div className="mt-4 text-center">
        <h1 className="text-3xl font-bold">Vibesnap</h1>
        <p className="text-gray-500 mt-1">Moments That Matter, Shared Forever.</p>
      </div>

      {/* Google Sign-In Button */}
      <button
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center mt-4 px-8 py-2 bg-black text-white font-semibold rounded-full self-center"
      >
        <img
          src="/images/logo.png"
          alt="Google"
          className="w-6 h-6 mr-2"
        />
        Continue with Google
      </button>
      </div>
    </div>
  );
};

export default HomePage;
