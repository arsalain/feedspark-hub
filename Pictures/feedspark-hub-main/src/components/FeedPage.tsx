import React, { useEffect, useState } from 'react';
import {  useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig'; // Import Firestore DB instance
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { setEmail } from '../store/authSlice'; // Redux action to set email

const FeedPage = () => {
  const dispatch = useDispatch(); // Get email from Redux
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [loading, setLoading] = useState(true); // Loading state for UI feedback
  const [imgSrc, setImgSrc] = useState(userPhoto);
  const navigate = useNavigate();
  useEffect(() => {
    const auth = getAuth();

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Authenticated user found: ', user.email);

        // Update Redux state with email
        dispatch(setEmail(user.email || ''));

        // Fetch Firestore user details
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserName(userData.name || '');
            console.log(userData.photoURL,"phototurla")
            setUserPhoto(userData.photoURL || '');
          } else {
            console.log('No user data found for UID: ', user.uid);
          }
        } catch (error) {
          console.error('Error fetching user details: ', error);
        }
      } else {
        console.log('No authenticated user found.');
      }
      setLoading(false); // Stop loading when Auth state is resolved
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, [dispatch]);
  useEffect(() => {
    const fetchRandomImage = () => {
      const randomImageUrl = `https://picsum.photos/480/480?random=${Math.random()}`;
      setImgSrc(randomImageUrl);
    };

    fetchRandomImage();
  }, []);
  const handleError = () => {
    setImgSrc('https://source.unsplash.com/random/?trekking'); // Fallback image in case of failure
  };
  const handleProfileRedirect = () => {
    navigate("/profile");
  };
  return (
    <div className="container mx-auto px-4 py-4 bg-gray-50 min-h-screen">
      {loading ? (
        <p className="text-gray-600 text-center">Loading...</p>
      ) : (
        <>
          {/* Header Section */}
          <div className="flex items-center gap-3 px-1" onClick={handleProfileRedirect}>
            {userPhoto ? (
             <div className="image-container">
             <img
               src={userPhoto}
               alt={userName}
               className="user-image"
               onError={handleError}
             />
           </div>
           
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            )}
            <div>
              <p className="text-gray-600 text-[12px]">Welcome Back,</p>
              <h1 className="text-lg text-black font-semibold">{userName || 'Guest'}</h1>
            </div>
          </div>

          {/* Feed Section Placeholder */}
          <div className="mt-6 ">
            <h2 className="text-black font-bold mb-2 text-2xl">Your Feed</h2>
            <p className="text-gray-500 text-sm">
              Content will be shown here once you interact with the application.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedPage;
