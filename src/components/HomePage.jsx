import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <>
      {/* CSS for animations */}
      <style>
        {`
          @keyframes slideInFromLeft {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: 1s ease-out 0s 1 slideInFromLeft;
          }

          @keyframes pulse-light {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 15px 5px rgba(255, 255, 224, 0.7), 0 0 25px 10px rgba(255, 235, 59, 0.5);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 25px 10px rgba(255, 255, 224, 0.9), 0 0 40px 15px rgba(255, 235, 59, 0.7);
            }
          }

          .headlight-glow {
            position: absolute;
            top: 33%;    /* Position over the headlight */
            left: 48%;   /* Position over the headlight */
            transform: translateX(-50%);
            width: 40px; /* Adjust size of the glow area */
            height: 20px; /* Adjust size of the glow area */
            border-radius: 50%;
            animation: pulse-light 2.5s infinite ease-in-out;
          }
        `}
      </style>

      {/* Header with Logo */}
      <header className="absolute top-0 left-0 p-6 z-10">
          <img 
            src="/logo.png" 
            alt="Cretara" 
            width={300}
           
            height={300} // Adjust height as needed
          />
      </header>
      
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen w-full overflow-hidden bg-gray-900">
        {/* Left Side: Image with Light Effect */}
        <div className="w-full lg:w-1/2 flex justify-center p-8 relative">
          <div className="animate-slide-in">
            <img 
              src="/bike.png" 
              alt="Electric Scooter" 
              className="max-w-md lg:max-w-2xl w-full h-auto object-contain"
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/1E293B/FFFFFF?text=Scooter+Image'; }}
            />
            {/* Pulsing Headlight Effect */}
            
          </div>
        </div>

        {/* Right Side: Selection */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
          <h1 className="text-5xl   mb-10 text-white font-orbitron text-center">Select Your Vehicle</h1>
          <div className="flex flex-col gap-8 w-full max-w-xs">
            {/* VM4 Model Button - Corrected Link */}
            <Link to="/ve4" className="text-center p-6 bg-primary rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <span className="text-4xl font-bold font-orbitron text-white">VE4</span>
            </Link>

            {/* IN40 Model Button */}
            <Link to="/in40" className="text-center p-6 bg-primary rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <span className="text-4xl font-bold font-orbitron text-white">IN40</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};


 export default HomePage; 