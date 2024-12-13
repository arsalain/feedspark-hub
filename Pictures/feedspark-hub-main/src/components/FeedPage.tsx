import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { doc,updateDoc, increment,deleteDoc ,setDoc , collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData,  getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { GoPlus } from "react-icons/go";
import { IoNavigate } from "react-icons/io5";
import { RxCross2  } from "react-icons/rx";
import { RiFileCopyFill,RiCheckFill  } from "react-icons/ri";

interface Post {
  id: string;
  title?: string; // Optional
  content?: string; // Optional
  userName: string;
  userPhoto: string;
  media: Array<{ type: string; url: string }>;
  [key: string]: any;
}


const FeedPage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postId, setPostId] = useState(null);
  const email = useSelector((state: RootState) => state.auth.email);
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";


  const handleCopyClick = () => {
    // Copy the URL to clipboard
    navigator.clipboard.writeText(`${baseUrl}/feed/${postId}`).then(() => {
      setIsCopied(true);
      // Reset the icon back to copy after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const POSTS_PER_BATCH = 20;

  const updateLikeCount = async (postId: string, change: number ) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(change) // Increment or decrement the like count
    });
  };

  const handleShareClick = (id: any ) => {
    console.log(`Post ID: ${id}`); // Use the id as needed
    setPostId(id); // Save the post ID in state
    setShowPopup(true);
  };
  
  // Close popup handler
  const closePopup = () => {
    setShowPopup(false);
    setPostId(null); // Clear the post ID
  };
  const handleLikeClick = async (postId: string, email: string | null) => {
    if (!email) {
      alert('Please log in first!');
      return;
    }
  
    const postRef = doc(db, 'posts', postId);
    const likesRef = collection(postRef, 'likes');
    const userLikeRef = doc(likesRef, email);
  
    try {
      const userLikeDoc = await getDoc(userLikeRef);
  
      // Optimistic UI Update: Update local posts state
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post.id === postId) {
            const updatedLikes = userLikeDoc.exists() ? post.likes - 1 : post.likes + 1;
            return { ...post, likes: updatedLikes }; // Update the like count
          }
          return post;
        });
      });
  
      // Update likedPosts state for heart icon change
      setLikedPosts(prev => {
        const newLikedPosts = new Set(prev);
        if (userLikeDoc.exists()) {
          newLikedPosts.delete(postId); // Remove from liked
        } else {
          newLikedPosts.add(postId); // Add to liked
        }
        return newLikedPosts;
      });
  
      // Firebase operation to update likes
      if (userLikeDoc.exists()) {
        await deleteDoc(userLikeRef); // Remove like
        await updateLikeCount(postId, -1); // Decrement like count in the database
      } else {
        await setDoc(userLikeRef, { liked: true }); // Add like
        await updateLikeCount(postId, 1); // Increment like count in the database
      }
    } catch (error) {
      console.error('Error updating like/dislike status:', error);
    }
  };
  
  
  

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (email) {
        try {
          const postsWithLikes = await Promise.all(
            posts.map(async (post) => {
              const postRef = doc(db, 'posts', post.id);
              const likesRef = collection(postRef, 'likes');
              const userLikeRef = doc(likesRef, email); // Assuming email is unique per user
              const userLikeDoc = await getDoc(userLikeRef);
              
              return {
                ...post,
                isLiked: userLikeDoc.exists(),
              };
            })
          );
          
          setLikedPosts(new Set(postsWithLikes.filter(p => p.isLiked).map(p => p.id)));
        } catch (error) {
          console.error('Error fetching liked posts:', error);
        }
      }
    };
  
    fetchLikedPosts();
  }, [email, posts]); // Depend on email and posts
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserName(userData.name || 'Guest');
          setUserPhoto(userData.photoURL || '');
        } else {
          console.error('No user data found for this email.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('timestamp', 'desc'),
        limit(POSTS_PER_BATCH)
      );
      const querySnapshot = await getDocs(postsQuery);
  
      const fetchedPosts: Post[] = await Promise.all(
        querySnapshot.docs.map(async (postDoc) => {  // Changed 'doc' to 'postDoc'
          const postData = postDoc.data() as Omit<Post, 'id' | 'userName' | 'userPhoto'>;
  
          // Use the userId to fetch user data
          const userDocRef = doc(db, 'users', postData.userId);  // Correct reference to the user document
          const userDoc = await getDoc(userDocRef);  // Correctly using `getDoc` to fetch the document
  
          const userInfo = userDoc.exists() ? userDoc.data() : {};  // Check if the user document exists
          return {
            id: postDoc.id,  // Using 'postDoc.id' instead of 'doc.id'
            ...postData,
            media: Array.isArray(postData.media) ? postData.media : [],
            timestamp: postData.timestamp?.toDate(),
            userName: userInfo.name || 'Unknown User',
            userPhoto: userInfo.photoURL || '',
          } as Post;
        })
      );
  
      setPosts(fetchedPosts);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.size === POSTS_PER_BATCH);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  
  
  
  

  

  const fetchMorePosts = async () => {
    if (!lastDoc || !email) return;
  
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_BATCH)
      );
  
      const querySnapshot = await getDocs(postsQuery);
  
      const fetchedPosts: Post[] = await Promise.all(
        querySnapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data() as Omit<Post, 'id' | 'userName' | 'userPhoto'>;
  
          // Use the userId to fetch user data
          const userDocRef = doc(db, 'users', postData.userId);  // Correct reference to the user document
          const userDoc = await getDoc(userDocRef);  // Correctly using `getDoc` to fetch the document
  
  
          const userInfo = userDoc.exists() ? userDoc.data() : {}; 
          console.log(userInfo,"userinfo")
          return {
            id: postDoc.id,  // Using 'postDoc.id' instead of 'doc.id'
            ...postData,
            media: Array.isArray(postData.media) ? postData.media : [],
            timestamp: postData.timestamp?.toDate(),
            userName: userInfo.name || 'Unknown User',
            userPhoto: userInfo.photoURL || '',
          } as Post; // Safely set 'id' here
        })
      );
  
      setPosts((prev) => [...prev, ...fetchedPosts]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.size === POSTS_PER_BATCH);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };
  

  useEffect(() => {
    if (email) {
      fetchPosts();
    }
  }, [email]);

  const handleError = () => {
    setImgSrc('https://source.unsplash.com/random/?trekking');
  };

  const handleProfileRedirect = () => {
    navigate("/profile");
  };
  function timeAgo(timestamp: any): string {
    let postDate: Date;

    if (timestamp instanceof Date) {
        postDate = timestamp;
    } else if (timestamp?.seconds) {
        postDate = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
        postDate = new Date(timestamp);
    } else {
        console.error("Invalid timestamp:", timestamp);
        return "Invalid date";
    }

    // Format as "X time ago" or return a simple date string
    const now = new Date();
    const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }
    return "just now";
}

  return (
    <div className="container mx-auto px-4 py-4 bg-gray-50 min-h-screen relative">
      {loading ? (
        <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
          <div className="loader"></div>
        </div>
      ) : (
        <>
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

          <div className="mt-6">
            <h2 className="text-black font-bold mb-4 text-2xl ">Feeds</h2>
            <InfiniteScroll
              dataLength={posts.length}
              next={fetchMorePosts}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
              className='flex flex-col gap-3'
              // endMessage={<p>No more posts to load!</p>}
            >
              {posts.map((post, index) => {
  // Background colors cycle through this array
  const bgColors = [
     "bg-purple-200",  "bg-yellow-100","bg-green-100", "bg-blue-100", "bg-red-100", 
    "bg-indigo-100", "bg-pink-100", "bg-orange-100", "bg-teal-100", "bg-lime-100",
    "bg-amber-100", "bg-cyan-100", "bg-fuchsia-100", "bg-rose-100", "bg-sky-100",
    "bg-violet-100", "bg-emerald-100", "bg-slate-100", "bg-stone-100", "bg-zinc-100"
  ];
  const bgColor = bgColors[index % bgColors.length];
  const handleVideoPlay = (videoRef:any) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.play();
        } else {
          videoRef.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(videoRef);
  };
  return (
    <div key={post.id} className={`${bgColor} rounded-[30px] md:p-6 p-3`}>
      <div className="flex items-center gap-3 px-1" >
        {post.userPhoto ? (
          <div className="image-container">
            <img
              src={post.userPhoto}
              alt={post.userName}
              className="user-image"
              onError={handleError}
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        )}
        <div>
          <h2 className="text-base text-black font-semibold">{post.userName || 'Guest'}</h2>
          <div className='text-sm text-gray-800'>{timeAgo(post.timestamp)}</div>
        </div>
      </div>

      <div className="flex flex-col mt-2 px-1">
        <h3 className="text-[14px]">{post.message}</h3>
        <p className="text-blue-500 text-[14px] -mt-1">{post.hashtags}</p>
      </div>

      <div className='my-2 px-1'>
        {post.media.length === 1 ? (
          post.media[0].type === "image" ? (
            <img
              className="w-full md:h-[400px] h-[200px] object-cover rounded-2xl"
              src={post.media[0].url}
              alt="Media"
            />
          ) : (
            <video
              className="w-full md:h-[400px] h-[200px] object-cover rounded-2xl"
              src={post.media[0].url}
                   ref={(ref) => ref && handleVideoPlay(ref)}
                   muted
                   controls
                   controlsList="nodownload noplaybackrate"
            />
          )
        ) : (
          <Swiper spaceBetween={10} slidesPerView={1.5}
          breakpoints={{
            768: { // Tab view breakpoint
              slidesPerView: 2.5
            }
            }}>
            {post.media.map((mediaItem, mediaIndex) => (
              <SwiperSlide key={mediaIndex}>
                {mediaItem.type === "image" ? (
                  <img
                    className="w-full md:h-[350px] h-[200px] object-cover rounded-2xl"
                    src={mediaItem.url}
                    alt={`Media ${mediaIndex + 1}`}
                  />
                ) : (
                  <video
                    className="w-full md:h-[350px] h-[200px] object-cover rounded-2xl"
                    src={mediaItem.url}
                         ref={(ref) => ref && handleVideoPlay(ref)}
                         muted
                         controls
                         controlsList="nodownload noplaybackrate"
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
      <div className='px-2 flex justify-between items-center'>
      <div className="flex items-center gap-2 mt-1">
  <button onClick={() => handleLikeClick(post.id,email)}>
    {likedPosts.has(post.id) ? (
      <AiFillHeart className="text-pink-700 text-xl" />
    ) : (
      <AiOutlineHeart className="text-pink-700 text-xl" />
    )}
  </button>
  <span className="text-sm text-pink-700 mt-[-3px] ml-[-6px]">{post.likes || 0} </span>
</div>
<div className='flex justify-center font-semibold items-center bg-gray-200 px-5 py-1 gap-2 rounded-[20px] z-10'   onClick={() => handleShareClick(post.id)}>
<IoNavigate className=' mt-1' />  Share 
</div>
      </div>
    </div>
  );
})}

            </InfiniteScroll>
          </div>
        </>
      )}
          <div
  className="fixed bottom-[20px] right-[10px] bg-black rounded-full w-[50px] h-[50px] text-white flex items-center justify-center z-40"
  onClick={() => navigate("/create-post")}
>
  <GoPlus className="text-white text-2xl" />
</div>
 {showPopup && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4 ">
      <div className="bg-white max-w-[500px] w-full p-4 md:p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Share post</h2>
          <button
            onClick={closePopup}
            className="bg-gray-200 text-black px-2 py-2 rounded-full"
          >
            <RxCross2 />
          </button>
        </div>

        <ul className="grid grid-cols-4 gap-6 py-4 md:px-8">
          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?url=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-blue-50 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img src="/app/twitter.png" alt="Twitter" className="w-7 h-7" />
            </li>
            <span>Twitter</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-blue-100 rounded-full w-[65px] h-[65px] flex justify-center items-center">
              <img
                src="/app/favebook.png"
                alt="Facebook"
                className="w-11 h-11"
              />
            </li>
            <span>Facebook</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://www.reddit.com/submit?url=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-orange-100 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img src="/app/reddit.png" alt="Reddit" className="w-7 h-7" />
            </li>
            <span>Reddit</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              navigator.clipboard.writeText(`${baseUrl}/feed/${postId}`)
            }
          >
            <li className="bg-blue-100 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img src="/app/discord.png" alt="Discord" className="w-12 h-12" />
            </li>
            <span>Discord</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  `${baseUrl}/feed/${postId}`
                )}`,
                "_blank"
              )
            }
          >
            <li className="bg-green-100 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img src="/app/whatsapp.png" alt="WhatsApp" className="w-8 h-8" />
            </li>
            <span>WhatsApp</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `fb-messenger://share?link=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-blue-100 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img
                src="/app/messenger.png"
                alt="Messenger"
                className="w-10 h-10"
              />
            </li>
            <span>Messenger</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://t.me/share/url?url=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-blue-50 rounded-full w-[65px] h-[65px] flex justify-center items-center">
              <img
                src="/app/telegram.png"
                alt="Telegram"
                className="w-14 h-14"
              />
            </li>
            <span>Telegram</span>
          </div>

          <div
            className="text-center flex flex-col gap-2"
            onClick={() =>
              window.open(
                `https://www.instagram.com/?url=${baseUrl}/feed/${postId}`,
                "_blank"
              )
            }
          >
            <li className="bg-pink-100 w-[65px] h-[65px] rounded-full flex justify-center items-center">
              <img
                src="/app/instagram.png"
                alt="Instagram"
                className="w-12 h-12"
              />
            </li>
            <span>Instagram</span>
          </div>
        </ul>

        <p className="mt-4 font-semibold">Page Link</p>
        <div className='flex justify-between items-center gap-10 p-2 rounded-lg w-full bg-gray-200 mt-3'>
        <input
          type="text"
          readOnly
          value={`${baseUrl}/feed/${postId}`}
          className="bg-gray-200 w-full"
        />
     <button
            onClick={handleCopyClick}
            className="flex items-center justify-center"
          >
            {isCopied ? (
              <RiCheckFill className="text-green-500" size={24} />
            ) : (
              <RiFileCopyFill className="text-black" size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  )}

    </div>
  );
};

export default FeedPage;