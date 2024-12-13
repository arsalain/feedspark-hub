import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // For routing
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig'; // Import your Firestore instance
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  timestamp: any; // You can adjust this to match your timestamp type (e.g., Firestore Timestamp)
  message: string;
  hashtags: string;
  likes?:string;
  media: { url: string; type: 'image' | 'video' }[];
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>(); // Get the 'id' from URL params
  const [post, setPost] = useState<Post | null>(null); // For storing a single post
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPost = async (postId: string) => {
    try {
      // Fetch the post using the specific postId
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);

      if (postDoc.exists()) {
        const postData = postDoc.data() as Omit<Post, 'id' | 'userName' | 'userPhoto'>;
        
        // Fetch user data based on userId (assuming each post has a `userId` field)
        const userDocRef = doc(db, 'users', postData.userId);
        const userDoc = await getDoc(userDocRef);
        
        const userInfo = userDoc.exists() ? userDoc.data() : {};
        const fetchedPost = {
          id: postDoc.id,
          ...postData,
          timestamp: postData.timestamp?.toDate(),
          userName: userInfo.name || 'Unknown User',
          userPhoto: userInfo.photoURL || '',
        } as Post;

        setPost(fetchedPost);
      } else {
        console.log("Post not found");
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost(id); // Fetch the post by postId
    }
  }, [id]); // Re-fetch when the id changes

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
  if (loading) {
    return  <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
    <div className="loader"></div>
  </div>;
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className='container mx-auto relative'>
         <FaArrowLeftLong
          className="text-black text-xl z-10 md:mt-10 md:ml-6 ml-4 mt-4"
          onClick={() => navigate("/feed")}
        />
    <div className="md:p-6 p-3">
      <div className="flex items-center gap-3 px-1">
        {post.userPhoto ? (
          <div className="image-container">
            <img
              src={post.userPhoto}
              alt={post.userName}
              className="user-image"
              onError={() => {}}
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        )}
        <div>
          <h2 className="text-base text-black font-semibold">{post.userName || 'Guest'}</h2>
          <div className="text-sm text-gray-800">{timeAgo(post.timestamp)}</div>
        </div>
      </div>

      <div className="flex flex-col mt-4 px-1">
        <h3 className="text-[14px]">{post.message}</h3>
        <p className="text-blue-500 text-[14px] ">{post.hashtags}</p>
        <p className=' text-[14px] '>{post.likes} Likes</p>
      </div>

      <div className="my-4 px-1">
        {post.media.length === 1 ? (
          post.media[0].type === 'image' ? (
            <img
              className="w-full md:h-[400px] h-[200px] object-cover rounded-2xl"
              src={post.media[0].url}
              alt="Media"
            />
          ) : (
            <video
              className="w-full md:h-[400px] h-[200px] object-cover rounded-2xl"
              src={post.media[0].url}
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
                           controls
                           
                    />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
        )}
      </div>
    </div>
    </div>
  );
};

export default PostDetail;
