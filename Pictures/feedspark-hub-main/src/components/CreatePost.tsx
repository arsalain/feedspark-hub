import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BiSelectMultiple } from "react-icons/bi";
import { IoCameraOutline } from "react-icons/io5";
import { FaArrowsRotate } from "react-icons/fa6";
import { Swiper,SwiperSlide } from 'swiper/react';
import  { Swiper as SwiperClass } from 'swiper'
import { useSelector } from "react-redux";
import { RootState } from "../store";
import "swiper/css";
import "swiper/css/pagination";
import {  Pagination } from 'swiper/modules';
import { getFirestore, collection, writeBatch, doc, Timestamp,query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
// Media type interface
interface MediaItem {
  file?: File; 
  type: "image" | "video";
  src: string;
}
interface MediaItema {
    file?: File;    // Optional file property (for file input)
    src?: string;   // Optional URL property (for media from URL)
    type: string;   // The type of the media (e.g., 'image/jpeg', 'video/mp4', etc.)
  }
  
const CreatePost: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [postMessage, setPostMessage] = useState<string>('');
const [hashtags, setHashtags] = useState<string>('');
const [page, setPage] = useState(1);
const email = useSelector((state: RootState) => state.auth.email); 
const navigate = useNavigate();
  
useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const newMedia: MediaItem[] = [];
      try {
        const response = await axios.get(
          `https://bpuback.vercel.app/fetch-media?page=${page}&query=nature`
        );
  
        // Log data to understand the structure
  
        // Add fetched images
        if (response.data.images) {
          newMedia.push(
            ...response.data.images.map((item: { src: { original: string; [key: string]: string } }) => ({
              type: "image",
              src: item.src.original,
            }))
          );
        }
  
        // Add fetched videos
        if (response.data.videos) {
          newMedia.push(
            ...response.data.videos.map((item: { video_files: Array<{ link: string }> }) => ({
              type: "video",
              src: item.video_files[0]?.link, // Take the first available video quality
            }))
          );
        }
  
        // Ensure you're not adding the same media
        setMedia((prevMedia) => {
          const updatedMedia = [
            ...prevMedia,
            ...newMedia.filter((newItem) => 
              !prevMedia.some((prevItem) => prevItem.src === newItem.src)
            )
          ];
          return updatedMedia;
        });
  
      } catch (error) {
        console.error("Error loading media:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMedia();
  }, [page]);
  
const handleMediaFromStorage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
  
    const newMedia = files
      .map((file) => {
        // Ensure type is either "image" or "video"
        const mediaType = file.type.startsWith("video")
          ? "video"
          : file.type.startsWith("image")
          ? "image"
          : null;
  
        if (mediaType) {
          return {
            type: mediaType, // TypeScript now knows this is either "image" or "video"
            src: URL.createObjectURL(file),
          };
        }
        return null;
      })
      .filter((item): item is MediaItem => item !== null); // Type guard to ensure only valid MediaItems
  
    setMedia((prevMedia) => [...prevMedia, ...newMedia]);
    setSelectedMedia(newMedia); // Set only the new media as selected
    setIsPreviewVisible(true);
  };
  
//   useEffect(() => {
//     fetchMoreMedia();
//   }, []);

  useEffect(() => {
    if (media.length > 0 && selectedMedia.length === 0) {
      setSelectedMedia([media[0]]);
    }
  }, [media, selectedMedia]);

  const handleMediaSelect = (item: MediaItem) => {
    setSelectedMedia((prevSelected) => {
      const isSelected = prevSelected.find((media) => media.src === item.src);

      if (isSelected) {
        // Deselect the item
        if (prevSelected.length === 1) {
          return prevSelected; // Do nothing if it's the last selected item
        }
        return prevSelected.filter((media) => media.src !== item.src);
      } else {
        // Add the item to the list and ensure it appears last (latest selected)
        return [...prevSelected.filter((media) => media.src !== item.src), item];
      }
    });
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };
  const isPreview = async () => {
    try {
        if (showCamera){ 
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    }
      setIsPreviewVisible(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };
  const closeCamera = () => {
    setShowCamera(false);
}
console.log("selected",selectedMedia)
  useEffect(() => {
    if (showCamera && cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }

    return () => {
      // Stop the camera stream when component unmounts or camera is closed
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [showCamera, cameraStream]);
  const toggleCamera = async () => {
    try {
      const currentFacingMode = cameraStream?.getVideoTracks()[0]?.getSettings()?.facingMode || "user";
      const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });
  
      // Stop the old camera stream
      cameraStream?.getTracks().forEach((track) => track.stop());
  
      setCameraStream(stream);
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };
const capturePhoto = () => {
    if (cameraVideoRef.current) {
      const videoElement = cameraVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const photoSrc = canvas.toDataURL('image/jpeg'); // Get the photo as a base64 string
        // setMedia([{ type: 'image', src: photoSrc }]); // Only set camera image
        setMedia((prevMedia) => [...prevMedia]);
        setSelectedMedia([{ type: 'image', src: photoSrc }]); // Ensure only camera image is selected
        setIsPreviewVisible(true); // Navigate to preview after capturing the photo
      }
    }
  };
// Update the `fetchUserId` function to ensure proper permission handling
const fetchUserId = async (email: string): Promise<string | null> => {
    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email)); // Create query with email filter
  
      // Fetch the documents from Firestore
      const querySnapshot = await getDocs(q); // Execute the query
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Assuming email is unique
        return userDoc.id; // Return the document ID as userId
      } else {
        console.error("User not found!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  };
  
  const savePost = async () => {
    setLoading(true);
    try {
      console.log(email, "email");
  
      if (!email) {
        alert("User is not authenticated. Unable to fetch email.");
        setLoading(false);
        return;
      }
  
      const userId = await fetchUserId(email); // Fetch userId from users table
      if (!userId) {
        alert("Unable to fetch userId. Please try again.");
        setLoading(false);
        return;
      }
  
      const db = getFirestore();
      const storage = getStorage();
      const batch = writeBatch(db);
      const postsCollectionRef = collection(db, "posts");
      console.log("Selected Media:", selectedMedia);
  
      // Process and upload media directly within the savePost function
      const postMedia = await Promise.all(
        selectedMedia.map(async (media, index) => {
          try {
            console.log(`Processing media ${index + 1}:`, media.src);
  
            let blob;
  
            // Check if the media is a file or a URL
            if (media.file) {
              // Use the file directly (e.g., from <input type="file">)
              blob = media.file;
            } else if (media.src) {
              // Handle URLs: Download and convert to Blob
              const sanitizedUrl = media.src.replace(/\?{2,}/g, "?");
              const response = await fetch(sanitizedUrl);
  
              if (!response.ok) {
                throw new Error(`Failed to fetch media: ${response.status} - ${response.statusText}`);
              }
  
              blob = await response.blob();
            } else {
              throw new Error("Invalid media format: Neither file nor URL provided");
            }
  
            // Generate a unique storage path
            const mediaRef = ref(
              storage,
              `posts/${userId}/${Date.now()}-${Math.random()}.${media.type}`
            );
  
            // Upload the Blob to Firebase Storage
            await uploadBytes(mediaRef, blob);
  
            // Get the download URL of the uploaded file
            const mediaUrl = await getDownloadURL(mediaRef);
  
            console.log(`Uploaded media ${index + 1} successfully:`, mediaUrl);
  
            return { type: media.type, url: mediaUrl };
          } catch (error) {
            console.error(`Error processing media ${index + 1}:`, error);
            return null; // Skip failed media
          }
        })
      );
  
      // Filter out any failed uploads (null values)
      const filteredMedia = postMedia.filter((media) => media !== null);
  
      // Create the new post document
      const newPost = {
        userId,
        message: postMessage,
        hashtags: hashtags,
        media: filteredMedia,
        likes: 0,
        timestamp: Timestamp.now(),
      };
  
      const postDocRef = doc(postsCollectionRef);
      batch.set(postDocRef, newPost);
  
      // Commit the batch
      await batch.commit();
      alert("Post created successfully!");
      navigate(-1)
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post");
    } finally {
      setLoading(false);
    }
  };
  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1); // Increment page to fetch next set of media
  };
  
  
  

  
  return (
    <div className="relative">
      {/* Camera Layout */}
      {showCamera && !isPreviewVisible && (
        <div className="relative w-full h-[100vh] bg-black">
                      <FaArrowLeftLong className="absolute top-[23px] left-[20px] text-white text-xl z-10 font-bold"   onClick={closeCamera}/>
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute bottom-0 left-0 right-0  bg-gray-900 h-[130px] " >
          {/* <div className="flex justify-center space-x-[40px] mt-[3vh] ">
          {modes.map((mode) => (
            <span
              key={mode}
              className={`${
                currentMode === mode ? "text-yellow-400" : "text-gray-400"
              } transition-colors`}
              onClick={() => setCurrentMode(mode)}
            >
              {mode}
            </span>
          ))}
        </div> */}
        <div className="flex   py-[20px]    justify-center md:gap-[100px] gap-[70px] items-center w-full ">
        <div>
   <label htmlFor="mediaSelector" className="cursor-pointer">
            <img
              src="/images/newimage.jpg" // Path to your image
              alt="Selector"
              className="w-[50px] h-[50px] rounded-full"
            />
          </label>
  <input
    id="mediaSelector"
    type="file"
    accept="image/*,video/*"
    multiple
    className="hidden"
    onChange={handleMediaFromStorage} // Add onChange handler
  />
</div>

            <div className=" bg-black w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-lg border border-white" onClick={capturePhoto}>

          </div>

          <button
            className="  flex items-center justify-center text-white shadow-lg text-xl"
            onClick={toggleCamera}
          >
            <FaArrowsRotate />
          </button>
          </div>
          </div>
        </div>
      )}

      {/* Selected Media Section */}
      {!showCamera && selectedMedia.length > 0 && !isPreviewVisible && (
        <div className="">
          <div className="relative">
            {selectedMedia[selectedMedia.length - 1].type === "image" ? (
              <img
                src={selectedMedia[selectedMedia.length - 1].src}
                alt="Selected item"
                className="w-full h-[45vh] object-cover "
              />
            ) : (
              <video
                src={selectedMedia[selectedMedia.length - 1].src}
                className="w-full h-[45vh] object-cover"
                autoPlay
                controls
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20 "></div>
            <FaArrowLeftLong className="absolute top-[23px] left-[20px] text-white text-xl z-10 font-bold" onClick={() => navigate(-1)} />
            <div className="absolute right-4 top-4 text-white text-lg z-10 font-bold" onClick={() => setIsPreviewVisible(true)}>Next</div>
          </div>
        </div>
      )}
 {isPreviewVisible && selectedMedia.length > 0 && (
<div>
  <div className="relative min-h-screen">
    {/* Back Navigation */}
    <FaArrowLeftLong
      className="absolute top-[23px] left-[20px] text-black text-xl z-10 font-bold cursor-pointer"
      onClick={isPreview}
    //   onClick={() => setIsPreviewVisible(false)}
    />                
    <div className="text-black absolute top-[18px] left-[60px] font-bold text-xl">
      New Post
    </div>

    {/* Swiper Section */}
    <div className="relative px-8 pb-4 md:px-[100px] pt-[80px]">
      <div className="w-full h-[40vh] overflow-hidden rounded-lg relative">
        <Swiper
          spaceBetween={50}
          slidesPerView={1}
          pagination={{
            el: `.swiper-pagination`,
            clickable: true,
          }}
          onSlideChange={(swiper: SwiperClass) => setCurrentSlide(swiper.activeIndex + 1)}
          modules={[Pagination]}
          className="w-full h-[50vh]"
        >
          {selectedMedia.map((item, index) => (
            <SwiperSlide key={index}>
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={`Selected Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Slide Indicator */}
        <div className="absolute top-2 right-2 text-black text-sm px-2 py-[2px] rounded-full bg-white z-20">
          {currentSlide}/{selectedMedia.length}
        </div>
      </div>
      <div className="flex justify-center md:mt-6 mt-3 items-center text-black">
        <div className="swiper-pagination"></div>
      </div>
    </div>

    {/* Post Inputs */}
    <div className="px-4">
    <textarea
  value={postMessage}
  onChange={(e) => setPostMessage(e.target.value)}
  className="w-full p-1 text-black text-lg focus:outline-none focus:ring-0"
  placeholder="Write a post..."
></textarea>

<input
  type="text"
  value={hashtags}
  onChange={(e) => setHashtags(e.target.value)}
  className="w-full p-1 text-blue-500 text-lg focus:outline-none focus:ring-0"
  placeholder="Add hashtags like #Techie"
/>

      </div>
    </div>

    {/* Create Button */}
    <div className="absolute right-4 left-4 bottom-4 text-white bg-black py-1 text-lg z-10 font-bold rounded-full text-center"   onClick={savePost}
    >
      Create
    </div>
  </div>

   )}
      {/* Gallery Section */}
      {!showCamera && selectedMedia.length > 0 && !isPreviewVisible && (
        <div>
          <div className="h-[8vh] px-4 flex justify-between items-center relative">
            <h2 className="text-xl font-bold">Gallery</h2>
            <div className="flex gap-2">
              <div className="bg-black text-white text-[13px] font-bold w-[30px] h-[30px] rounded-full flex items-center justify-center">
                <BiSelectMultiple className="" />
              </div>
              <div
                className="bg-gray-300 text-black text-[13px] font-bold w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer"
                onClick={openCamera}
              >
                <IoCameraOutline className="" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
            {media.map((item, index) => {
              const isSelected = selectedMedia.find((media) => media.src === item.src);
              return (
                <div
                  key={index}
                  className={`relative group cursor-pointer ${
                    isSelected ? "border-2 border-blue-500" : ""
                  }`}
                  onClick={() => handleMediaSelect(item)}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={`Gallery item ${index + 1}`}
                      className="w-full h-[15vh] object-cover"
                    />
                  ) : (
                    <div className="relative">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current.set(index, el);
                        }}
                        src={item.src}
                        className="w-full h-[15vh] object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-100 rounded-lg">
                        <button
                          className="text-black bg-white w-8 h-8 rounded-full flex justify-center items-center"
                        >
                          <div className="ml-[3px]">▶</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {selectedMedia.indexOf(item) + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
         


          {/* Loading Indicator */}
         
          <div className="flex justify-center items-center ">
  {loading ? (
    <div className="text-center py-4">Loading...</div>
  ) : (
    <button
      onClick={handleLoadMore}
      className="flex justify-center items-center px-4 py-2 my-4 bg-black text-white rounded-md"
    >
      Load More
    </button>
  )}
</div>

        </div>
      )}
       {loading && (
  <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
    <div className="loader"></div>
  </div>
)}
    </div>
  );
};

export default CreatePost;
