import React, { useState, useEffect, useRef } from "react";

// Media type interface
interface MediaItem {
  type: "image" | "video";
  src: string;
}

const CreatePost: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Fetch random images
  const fetchRandomImage = async () => {
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/200/300?random=${randomId}`;
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

  useEffect(() => {
    fetchMoreMedia();
  }, []);

  useEffect(() => {
    if (media.length > 0 && selectedMedia.length === 0) {
      setSelectedMedia([media[0]]);
    }
  }, [media,selectedMedia]);

//   const handleMediaSelect = (item: MediaItem) => {
//     setSelectedMedia((prevSelected) => {
//       const isSelected = prevSelected.find((media) => media.src === item.src);

//       if (isSelected) {
//         // Deselect
//         if (prevSelected.length === 1) {
//             return prevSelected; // Do nothing if it's the last selected item
//           }
//         return prevSelected.filter((media) => media.src !== item.src);
//       } else {
//         // Multi-select logic
//         return [...prevSelected, item];
//       }
//     });
//   };

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
  
  return (
    <div className="p-4">
      {/* Selected Media Section */}
      {selectedMedia.length > 0 && (
  <div className="mb-4">
    <h2 className="text-lg font-semibold">Selected Media</h2>
    <div className="relative">
      {selectedMedia[selectedMedia.length - 1].type === "image" ? (
        <img
          src={selectedMedia[selectedMedia.length - 1].src}
          alt="Selected item"
          className="w-full h-48 object-cover "
        />
      ) : (
        <video
          src={selectedMedia[selectedMedia.length - 1].src}
          className="w-full h-48 object-cover"
          autoPlay
          controls
        />
      )}
    </div>
  </div>
)}


      {/* Gallery Section */}
      <h2 className="text-lg font-semibold mb-2">Gallery</h2>
      <div className="grid grid-cols-3 gap-2">
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
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="relative">
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(index, el);
                    }}
                    src={item.src}
                    className="w-full h-24 object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-100 rounded-lg">
                    <button
                      className="text-white bg-black bg-opacity-50 p-2 rounded-full"
                      aria-label="Play video"
                      onClick={(e) => {
                        e.stopPropagation();
                        const videoEl = videoRefs.current.get(index);
                        if (videoEl) videoEl.play();
                      }}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              )}

              {isSelected && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
  );
};

export default CreatePost;
