import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to the Dashboard</h1>
      <p className="text-xl text-gray-400 mb-8">Please log in or sign up to continue.</p>
      <button
        onClick={() => loginWithRedirect()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"
      >
        Log In / Sign Up
      </button>
    </div>
  );
};

export default LoginPage;
