import { Routes, Route } from 'react-router-dom';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import HomePage from './components/HomePage';
import Ve4Dashboard from './components/Ve4Dashboard';
import In40Dashboard from './components/In40Dashboard';
import { IoIosLogOut } from "react-icons/io";
import './App.css';
import { useEffect, useRef, useState } from 'react';

// This component will contain all your application's routes.
// We will protect this entire component.
const AppRoutes = () => {
  return (
    <>
      <header className="absolute top-0 right-0 p-4 z-10">
        <LogoutButton />
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ve4" element={<Ve4Dashboard />} />
        <Route path="/in40" element={<In40Dashboard />} />
      </Routes>
    </>
  );
};

// This is the component that will be protected.
// `withAuthenticationRequired` is a tool from Auth0 that automatically
// handles redirecting unauthenticated users to the login page.
const ProtectedAppRoutes = withAuthenticationRequired(AppRoutes, {
  onRedirecting: () => (
    <div className="flex justify-center items-center h-screen text-white text-2xl">
      Redirecting to login...
    </div>
  ),
});

// A simple button to handle logging out


const LogoutButton = () => {
  const { logout, user } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      {user?.picture && (
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full -mt-3 border-2 border-gray-600 hover:border-blue-500 transition-colors"
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-primary rounded-lg shadow-lg py-2 z-20">
          <div className="px-4 py-2 border-b border-gray-600">
            <p className="font-bold text-white">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-secondry transition-colors"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};





// const LogoutButton = () => {
//   const { logout, user } = useAuth0();
//   return (
//     <div className="flex  items-center  gap-2 -mt-3">
//       {user?.picture && <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />}
//       <button
//         className=" text-white  font-bold -mt-2   rounded"
//        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
//       >
//       <IoIosLogOut className='scale-110 w-7 h-7' />
//       </button>
//     </div>
//   );
// };

function App() {
  const { isLoading } = useAuth0();

  // Show a loading message while Auth0 is checking the user's session.
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-white text-2xl">Loading Application...</div>;
  }

  // Render the protected routes. If the user is not logged in,
  // this component will automatically redirect them to the Auth0 login page.
  return <ProtectedAppRoutes />;
}
export default App;


































// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import HomePage from './components/HomePage';
// import Ve4Dashboard from './components/Ve4Dashboard';
// import In40Dashboard from './components/In40Dashboard';
// import './App.css';

// function App() {
//   return (
//     <>
//       {/* The header with the user button has been removed. */}
//       <Routes>
//         {/* All routes are now public. */}
//         <Route path="/" element={<HomePage />} />
//         <Route path="/ve4" element={<Ve4Dashboard />} />
//         <Route path="/in40" element={<In40Dashboard />} />
//       </Routes>
//     </>
//   );
// }

// export default App;






