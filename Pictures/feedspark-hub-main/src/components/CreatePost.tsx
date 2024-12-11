import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BiSelectMultiple } from "react-icons/bi";
import { IoCameraOutline } from "react-icons/io5";
import { FaArrowsRotate } from "react-icons/fa6";
import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/pagination";
import {  Pagination } from 'swiper/modules';
// Media type interface
interface MediaItem {
  type: "image" | "video";
  src: string;
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
  const [currentMode, setCurrentMode] = useState("Photo");
  const modes = ["Photo"];

  // Fetch random images
  const fetchRandomImage = async () => {
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/600/800??forest,nature&random=${randomId}`;
  };

  const videoSources = [
    "https://videos.pexels.com/video-files/1093662/1093662-hd_1280_720_30fps.mp4",
    "https://videos.pexels.com/video-files/4812203/4812203-hd_1080_1920_30fps.mp4",
    "https://videos.pexels.com/video-files/5946371/5946371-sd_960_540_30fps.mp4",
    "https://videos.pexels.com/video-files/4763824/4763824-hd_1280_720_24fps.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  ];

  const fetchRandomVideo = async () => {
    const randomIndex = Math.floor(Math.random() * videoSources.length);
    return videoSources[randomIndex];
  };

  const fetchMoreMedia = async () => {
    setLoading(true);

    const videoSet = new Set<string>();
    const newMedia: MediaItem[] = [];

    while (newMedia.length < 12) {
      const isImage = newMedia.length % 4 !== 3; // 3 images followed by 1 video
      if (isImage) {
        const imageSrc = await fetchRandomImage();
        newMedia.push({ type: "image", src: imageSrc });
      } else {
        let videoSrc = await fetchRandomVideo();
        while (videoSet.has(videoSrc)) {
          videoSrc = await fetchRandomVideo(); // Ensure video is unique
        }
        videoSet.add(videoSrc);
        newMedia.push({ type: "video", src: videoSrc });
      }
    }

    setMedia((prevMedia) => [...prevMedia, ...newMedia]);
    setLoading(false);
  };
//   const handleMediaFromStorage = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files || []);
    
//     const newMedia = files
//       .map((file) => {
//         // Ensure type is either "image" or "video"
//         const mediaType = file.type.startsWith("video")
//           ? "video"
//           : file.type.startsWith("image")
//           ? "image"
//           : null;
  
//         if (mediaType) {
//           return {
//             type: mediaType, // TypeScript now knows this is either "image" or "video"
//             src: URL.createObjectURL(file),
//           };
//         }
//         return null;
//       })
//       .filter((item): item is MediaItem => item !== null); // Type guard to ensure only valid MediaItems
  
//     setMedia((prevMedia) => [...prevMedia, ...newMedia]);
//     setIsPreviewVisible(true); 
//   };
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
  
  useEffect(() => {
    fetchMoreMedia();
  }, []);

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
  return (
    <div className="">
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

            <div className=" bg-black w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-lg border border-white">

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
            <FaArrowLeftLong className="absolute top-[23px] left-[20px] text-white text-xl z-10 font-bold" />
            <div className="absolute right-4 top-4 text-white text-lg z-10 font-bold" onClick={() => setIsPreviewVisible(true)}>Next</div>
          </div>
        </div>
      )}
 {isPreviewVisible && selectedMedia.length > 0 && (
  <div>
    <div className="relative">
      {/* Swiper Layout */}
      <FaArrowLeftLong
      className="absolute top-[23px] left-[20px] text-white text-xl z-10 font-bold cursor-pointer"
      onClick={() => setIsPreviewVisible(false)} // Navigates back to the gallery
    />
    <div className="relative">
      <div className="w-full h-[50vh] overflow-hidden">
      <Swiper
      spaceBetween={50}
      slidesPerView={1}
      modules={[ Pagination]}
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
    
      </div>
      <div className="flex justify-center mt-4 items-center text-black">
        <div className={`swiperslide`}></div>
      </div>
      </div>

      {/* Navigation for Left Arrow */}
      <div className="absolute right-4 top-4 text-white text-lg z-10 font-bold">
        Create
      </div>
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
          {loading && (
            <div className="text-center my-4">
              <span className="text-gray-500">Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatePost;
