// src/components/In40PieChart.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

// --- Data Mappings ---
const V_MODE_MAP = { 1: "Eco", 2: "Normal", 3: "Sports", 4: "Boost", 5: "Reverse" };
const COLORS = { 1: '#22c55e', 2: '#3b82f6', 3: '#ef4444', 4: '#a855f7', 5: '#71717a' };

const formatDateForSQL = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const In40PieChart = ({ isOpen, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const body = startDate && endDate ? {
                    startDate: formatDateForSQL(startDate) + ' 00:00:00',
                    endDate: formatDateForSQL(endDate) + ' 00:00:00',
                } : {};
                // ** THE FIX IS HERE: Using axios.post to match the backend route **
                const response = await axios.post('https://dashboard-backend-h8qz.onrender.com/api/data/in40/analytics/mode-distribution', body);
                const formattedData = response.data.map(item => ({
                    name: V_MODE_MAP[item.vmode] || `Mode ${item.vmode}`,
                    value: item.count,
                }));
                setChartData(formattedData);
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, startDate, endDate]);

    // ... (handleDownloadReport and handleDownloadCSV functions would go here, similar to other charts) ...

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Riding Mode Distribution</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div ref={chartRef} style={{ width: '100%', height: 400, backgroundColor: '#1A202C' }} className="flex justify-center items-center">
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => {
                                        const modeKey = Object.keys(V_MODE_MAP).find(key => V_MODE_MAP[key] === entry.name);
                                        return <Cell key={`cell-${index}`} fill={COLORS[modeKey]} />;
                                    })}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-400 text-center">No riding mode data available for the selected date range.</div>
                    )}
                </div>
                 <div className="flex justify-end items-center gap-4 mt-4 text-white">
                    <div>
                        <label className="mr-2">From:</label>
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" className="bg-gray-700 p-2 rounded-md text-white" isClearable />
                    </div>
                    <div>
                        <label className="mr-2">To:</label>
                        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" className="bg-gray-700 p-2 rounded-md text-white" isClearable />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default In40PieChart;
