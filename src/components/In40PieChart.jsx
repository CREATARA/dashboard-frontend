import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Data Mappings ---
const V_MODE_MAP = { 1: "Eco", 2: "Normal", 3: "Sports", 4: "Boost", 5: "Reverse" };
const COLORS = { 1: '#22c55e', 2: '#3b82f6', 3: '#ef4444', 4: '#a855f7', 5: '#71717a' };

const In40PieChart = ({ isOpen, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId = null;
        const fetchData = async () => {
            try {
                const response = await axios.get('https://creatara-backend.onrender.com/api/data/in40/analytics/mode-distribution');
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
            setLoading(true);
            fetchData();
            intervalId = setInterval(fetchData, 60000); // Refresh every minute
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Riding Mode Distribution</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : (
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
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[Object.keys(V_MODE_MAP).find(key => V_MODE_MAP[key] === entry.name)]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
export default In40PieChart;
