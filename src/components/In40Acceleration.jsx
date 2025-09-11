import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper function to format a date object to 'YYYY-MM-DD' without timezone conversion
const formatDateForSQL = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to calculate speed in meters per second from your custom formula
const calculateMsFromRpm = (rpm) => {
    if (typeof rpm !== "number" || rpm <= 0) return 0;
    const kmPerHour = rpm / 11;
    // Convert km/h to m/s by dividing by 3.6
    return kmPerHour / 3.6;
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const fullDateTime = new Date(data.received_at.replace(' ', 'T')).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        return (
            <div className="p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
                <p>{`Time: ${fullDateTime}`}</p>
                <p className="text-blue-400">{`SOC: ${data.soc}%`}</p>
                <p className="text-teal-400">{`Acceleration: ${data.acceleration} m/s²`}</p>
            </div>
        );
    }
    return null;
};

const In40Acceleration = ({ isOpen, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const body = startDate && endDate ? {
                    startDate: formatDateForSQL(startDate) + ' 00:00:00',
                    endDate: formatDateForSQL(endDate) + ' 00:00:00',
                } : {};

                const response = await axios.post('http://localhost:3001/api/data/in40/analytics/acceleration', body);

                const processedData = response.data.map((item, index, arr) => {
                    let acceleration = 0;
                    if (index > 0) {
                        const prevItem = arr[index - 1];
                        const currentSpeedMs = calculateMsFromRpm(item.rpm);
                        const prevSpeedMs = calculateMsFromRpm(prevItem.rpm);
                        const timeDiffSeconds = (new Date(item.received_at.replace(' ', 'T')) - new Date(prevItem.received_at.replace(' ', 'T'))) / 1000;

                        if (timeDiffSeconds > 0) {
                            acceleration = (currentSpeedMs - prevSpeedMs) / timeDiffSeconds;
                        }
                    }
                    return {
                        ...item,
                        soc: item.soc,
                        acceleration: parseFloat(acceleration.toFixed(2)),
                        timeLabel: new Date(item.received_at.replace(' ', 'T')).toLocaleString('en-US', {
                             month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                        }),
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
            fetchData();
        }
    }, [isOpen, startDate, endDate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-5xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Acceleration Impact on Battery</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div style={{ width: '100%', height: 400 }}>
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="timeLabel" stroke="#A0AEC0" isAnimationActive={false} />
                                <YAxis yAxisId="left" label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#38bdf8" domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Accel (m/s²)', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#34d399" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="soc" name="SOC (%)" stroke="#38bdf8" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="acceleration" name="Acceleration (m/s²)" stroke="#34d399" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="text-gray-400 text-center flex justify-center items-center h-full">No data available for the selected date range.</div>
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
export default In40Acceleration;
