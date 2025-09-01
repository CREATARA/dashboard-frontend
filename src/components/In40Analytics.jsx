import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const In40Analytics = ({ isOpen, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId = null;
        const fetchData = async () => {
            try {
                const response = await axios.get('https://creatara-backend.onrender.com/api/data/in40/analytics/rpm-vs-soc');
                const formattedData = response.data.map(item => ({
                    rpm: item.rpm,
                    soc: item.soc,
                    time: new Date(item.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
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
            <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Efficiency Analysis (RPM & SOC vs. Time)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : (
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="time" stroke="#A0AEC0" isAnimationActive={false} />
                                <YAxis yAxisId="left" label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#38bdf8" domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'RPM', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#82ca9d" />
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="soc" name="SOC (%)" stroke="#38bdf8" dot={{ r: 4 }} activeDot={{ r: 8 }} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="rpm" name="RPM" stroke="#82ca9d" dot={{ r: 4 }} activeDot={{ r: 8 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
export default In40Analytics;