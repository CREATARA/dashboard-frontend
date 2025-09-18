import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ** UPDATED HELPER FUNCTION **
// This function now uses your specific formula to calculate speed (km/h)
// and then converts it to meters per second for the acceleration calculation.
const calculateMsFromRpm = (rpm) => {
    if (typeof rpm !== 'number' || rpm <= 0) return 0;

    // 1. Use your formula to get speed in km/h
    const kmPerHour = rpm / 11; 

    // 2. Convert km/h to meters per second (m/s)
    const metersPerSecond = kmPerHour / 3.6;

    return metersPerSecond;
};

const Ve4Acceleration = ({ isOpen, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId = null;
        const fetchData = async () => {
            try {
                const response = await axios.get('https://dashboard-backend-h8qz.onrender.com/api/data/ve4/analytics/acceleration');

                // Process data to calculate acceleration
                const processedData = response.data.map((item, index, arr) => {
                    let acceleration = 0;
                    if (index > 0) {
                        const prevItem = arr[index - 1];
                        const currentSpeedMs = calculateMsFromRpm(item.rpm);
                        const prevSpeedMs = calculateMsFromRpm(prevItem.rpm);
                        const timeDiffSeconds = (new Date(item.received_at) - new Date(prevItem.received_at)) / 1000;

                        if (timeDiffSeconds > 0) {
                            acceleration = (currentSpeedMs - prevSpeedMs) / timeDiffSeconds;
                        }
                    }
                    return {
                        soc: item.soc,
                        acceleration: parseFloat(acceleration.toFixed(2)),
                        time: new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    };
                });

                setChartData(processedData);
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
                    <h2 className="text-2xl font-bold text-white">Acceleration Impact on Battery</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : (
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="time" stroke="#A0AEC0" />
                                <YAxis yAxisId="left" label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#38bdf8" domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Accel (m/s²)', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#34d399" />
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="soc" name="SOC (%)" stroke="#38bdf8" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="acceleration" name="Acceleration (m/s²)" stroke="#34d399" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Ve4Acceleration;
