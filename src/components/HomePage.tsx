import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      navigate("/feed"); // Redirect to feed page after sign-in
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  return (
    <div className="max-h-screen bg-gray-50 flex flex-col relative">
      {/* Image grid */}
      {/* <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {["/images/img1.jpg", "/images/img2.jpg", "/images/img3.jpg", "/images/img4.jpg"].map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`img-${index}`}
            className="w-full h-[200px] object-cover"
          />
        ))}
      </div> */}
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

{/* <div className="grid grid-cols-3 gap-2 w-full max-w-md">
  
  <img src="/images/img1.jpg" alt="img-1" className="w-full h-[150px] object-cover" />
  <img src="/images/img2.jpg" alt="img-2" className="w-full h-[100px] object-cover" />
  <img src="/images/img3.jpg" alt="img-3" className="w-full h-[150px] object-cover" />


  <img
    src="/images/img4.jpg"
    alt="img-4"
    className="col-start-2 row-start-2 w-full h-[200px] object-cover"
  />
  <img
    src="/images/img5.jpg"
    alt="img-5"
    className="col-start-2 row-start-4 w-full h-[100px] object-cover"
  />

  
  <img src="/images/img6.jpg" alt="img-6" className="col-start-3 row-start-1 w-full h-[150px] object-cover" />
  <img
    src="/images/img7.jpg"
    alt="img-7"
    className="col-start-3 row-start-2 w-full h-[200px] object-cover"
  />
  <img src="/images/img8.jpg" alt="img-8" className="col-start-3 row-start-4 w-full h-[150px] object-cover" />
</div> */}




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
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
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
