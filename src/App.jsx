import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from "@clerk/clerk-react";
import HomePage from './components/HomePage';
import Ve4Dashboard from './components/Ve4Dashboard';
import In40Dashboard from './components/In40Dashboard';
import './App.css';

// This component wraps any private content.
// It will show the content if the user is signed in,
// otherwise it will redirect them to the sign-in page.
const PrivateRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        {/* With the provider setup, Clerk will handle this redirect automatically */}
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <>
      <header className="absolute top-0 right-0 p-4 z-10">
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>
      </header>
      <Routes>
        {/* Private Routes */}
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/ve4" element={<PrivateRoute><Ve4Dashboard /></PrivateRoute>} />
        <Route path="/in40" element={<PrivateRoute><In40Dashboard /></PrivateRoute>} />

        {/* Public Sign-In and Sign-Up Routes */}
        <Route
          path="/sign-in/*"
          element={
            <div className="flex justify-center items-center min-h-screen">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="flex justify-center items-center min-h-screen">
              <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;





