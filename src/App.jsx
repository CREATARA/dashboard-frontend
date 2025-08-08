import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Ve4Dashboard from './components/Ve4Dashboard';
import In40Dashboard from './components/In40Dashboard';
import './App.css';

function App() {
  return (
    <>
      {/* The header with the user button has been removed. */}
      <Routes>
        {/* All routes are now public. */}
        <Route path="/" element={<HomePage />} />
        <Route path="/ve4" element={<Ve4Dashboard />} />
        <Route path="/in40" element={<In40Dashboard />} />
      </Routes>
    </>
  );
}

export default App;






