import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility Function ---
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Background Grid Component with Hover and Ripple ---
const BackgroundGrid = ({
  rows = 10,
  cols = 30,
  cellSize = 50,
}) => {
  const [clickedCell, setClickedCell] = useState(null);
  
  const cells = useMemo(() => Array.from({ length: rows * cols }, (_, idx) => idx), [rows, cols]);

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
  };

  const handleCellClick = (row, col) => {
    setClickedCell({ row, col });
  };

  // Reset clicked cell after animation to allow re-triggering
  useEffect(() => {
    if (clickedCell) {
      const timer = setTimeout(() => setClickedCell(null), 1500); // Duration of ripple
      return () => clearTimeout(timer);
    }
  }, [clickedCell]);

  return (
    <div className="absolute inset-0 z-0" style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 9999; // A large number when no cell is clicked
        
        const delay = Math.max(0, distance * 60);
        const duration = 200 + distance * 100;

        const style = {
          "--delay": `${delay}ms`,
          "--duration": `${duration}ms`,
        };

        return (
          <div
            key={idx}
            className={cn(
              "border-l border-t border-[rgba(128,128,128,0.05)]",
              "transition-colors duration-300",
              "hover:bg-[rgba(128,128,128,0.1)]", // ** This is the hover highlight effect **
              clickedCell && "animate-cell-ripple"
            )}
            style={style}
            onClick={() => handleCellClick(rowIdx, colIdx)}
          />
        );
      })}
    </div>
  );
};

export default BackgroundGrid;