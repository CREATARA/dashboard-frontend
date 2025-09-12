
// src/components/In40ThermalModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

// Helper function to format a date object to 'YYYY-MM-DD' without timezone conversion
const formatDateForSQL = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
                <p className="text-yellow-400">{`Power: ${data.power.toFixed(2)} W`}</p>
                <p className="text-red-400">{`Battery Temp: ${data.btemp}°C`}</p>
                <p className="text-orange-400">{`Motor Temp: ${data.mtemp}°C`}</p>
            </div>
        );
    }
    return null;
};

const In40ThermalModal = ({ isOpen, onClose }) => {
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
                const response = await axios.post('https://creatara-backend.onrender.com/api/data/in40/analytics/thermal', body);
                const formattedData = response.data.map(item => ({
                    ...item,
                    power: item.volt * item.amp,
                    timeLabel: new Date(item.received_at.replace(' ', 'T')).toLocaleString('en-US', {
                         month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                    }),
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
    
    const handleDownloadReport = () => {
        const chartElement = chartRef.current;
        if (!chartElement || chartData.length === 0) return;

        setLoading(true);
        html2canvas(chartElement).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape');
            pdf.setFontSize(18);
            pdf.text('Thermal Performance Report', 14, 22);
            pdf.setFontSize(11);
            pdf.setTextColor(100);
            const dateRange = startDate && endDate 
                ? `Date Range: ${formatDateForSQL(startDate)} to ${formatDateForSQL(endDate)}`
                : 'Showing Latest Data';
            pdf.text(dateRange, 14, 30);
            pdf.addImage(imgData, 'PNG', 10, 40, 280, 100);
            autoTable(pdf, {
                startY: 150,
                head: [['Time', 'Power (W)', 'Battery Temp (°C)', 'Motor Temp (°C)']],
                body: chartData.map(d => [
                    new Date(d.received_at.replace(' ', 'T')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    d.power.toFixed(2),
                    d.btemp,
                    d.mtemp
                ]),
                theme: 'grid'
            });
            pdf.save('thermal_performance_report.pdf');
            setLoading(false);
        });
    };
    
    const handleDownloadCSV = () => {
        if (chartData.length === 0) return;
        const csvData = chartData.map(d => ({
            "Time": new Date(d.received_at.replace(' ', 'T')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            "Power (W)": d.power.toFixed(2),
            "Battery Temp (C)": d.btemp,
            "Motor Temp (C)": d.mtemp
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'thermal_performance_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-5xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Thermal Performance (Temp & Power vs. Time)</h2>
                     <div className="flex items-center gap-4">
                        <button 
                            onClick={handleDownloadCSV}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                            disabled={loading || chartData.length === 0}
                        >
                            Download CSV
                        </button>
                        <button 
                            onClick={handleDownloadReport}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                            disabled={loading || chartData.length === 0}
                        >
                            Download Report (PDF)
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                </div>

                <div ref={chartRef} style={{ width: '100%', height: 400, backgroundColor: '#1A202C', padding: '1rem' }}>
                    {loading ? (
                        <div className="text-white text-center">Loading Chart...</div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="timeLabel" stroke="#A0AEC0" isAnimationActive={false} />
                                <YAxis yAxisId="left" label={{ value: 'Power (Watts)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#facc15" />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Temp (°C)', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#f87171" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="power" name="Power (W)" fill="rgba(250, 204, 21, 0.4)" />
                                <Line yAxisId="right" type="monotone" dataKey="btemp" name="Battery Temp" stroke="#f87171" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="mtemp" name="Motor Temp" stroke="#fb923c" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
                            </ComposedChart>
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
export default In40ThermalModal;






// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // Helper function to format a date object to 'YYYY-MM-DD' without timezone conversion
// const formatDateForSQL = (date) => {
//     if (!date) return null;
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

// // Custom Tooltip Component
// const CustomTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//         const data = payload[0].payload;
//         const fullDateTime = new Date(data.received_at.replace(' ', 'T')).toLocaleString('en-US', {
//             year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
//         });
//         return (
//             <div className="p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
//                 <p>{`Time: ${fullDateTime}`}</p>
//                 <p className="text-yellow-400">{`Power: ${data.power.toFixed(2)} W`}</p>
//                 <p className="text-red-400">{`Battery Temp: ${data.btemp}°C`}</p>
//                 <p className="text-orange-400">{`Motor Temp: ${data.mtemp}°C`}</p>
//             </div>
//         );
//     }
//     return null;
// };

// const In40ThermalModal = ({ isOpen, onClose }) => {
//     const [chartData, setChartData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [startDate, setStartDate] = useState(null);
//     const [endDate, setEndDate] = useState(null);

//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 const body = startDate && endDate ? {
//                     startDate: formatDateForSQL(startDate) + ' 00:00:00',
//                     endDate: formatDateForSQL(endDate) + ' 00:00:00',
//                 } : {};

//                 const response = await axios.post('https://creatara-backend.onrender.com/api/data/in40/analytics/thermal', body);

//                 const formattedData = response.data.map(item => ({
//                     ...item,
//                     power: item.volt * item.amp,
//                     timeLabel: new Date(item.received_at.replace(' ', 'T')).toLocaleString('en-US', {
//                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
//                     }),
//                 }));
//                 setChartData(formattedData);
//             } catch (error) {
//                 console.error("Failed to fetch chart data:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (isOpen) {
//             fetchData();
//         }
//     }, [isOpen, startDate, endDate]);

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
//             <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-5xl">
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-2xl font-bold text-white">Thermal Performance (Temp & Power vs. Time)</h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
//                 </div>

//                 <div style={{ width: '100%', height: 400 }}>
//                     {loading ? (
//                         <div className="text-white text-center">Loading Chart...</div>
//                     ) : chartData.length > 0 ? (
//                         <ResponsiveContainer>
//                             <ComposedChart data={chartData}>
//                                 <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
//                                 <XAxis dataKey="timeLabel" stroke="#A0AEC0" isAnimationActive={false} />
//                                 <YAxis yAxisId="left" label={{ value: 'Power (Watts)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#facc15" />
//                                 <YAxis yAxisId="right" orientation="right" label={{ value: 'Temp (°C)', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#f87171" />
//                                 <Tooltip content={<CustomTooltip />} />
//                                 <Legend />
//                                 <Bar yAxisId="left" dataKey="power" name="Power (W)" fill="rgba(250, 204, 21, 0.4)" />
//                                 <Line yAxisId="right" type="monotone" dataKey="btemp" name="Battery Temp" stroke="#f87171" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
//                                 <Line yAxisId="right" type="monotone" dataKey="mtemp" name="Motor Temp" stroke="#fb923c" dot={false} activeDot={{ r: 8 }} isAnimationActive={false} />
//                             </ComposedChart>
//                         </ResponsiveContainer>
//                     ) : (
//                          <div className="text-gray-400 text-center flex justify-center items-center h-full">No data available for the selected date range.</div>
//                     )}
//                 </div>

//                 <div className="flex justify-end items-center gap-4 mt-4 text-white">
//                     <div>
//                         <label className="mr-2">From:</label>
//                         <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" className="bg-gray-700 p-2 rounded-md text-white" isClearable />
//                     </div>
//                     <div>
//                         <label className="mr-2">To:</label>
//                         <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" className="bg-gray-700 p-2 rounded-md text-white" isClearable />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
// export default In40ThermalModal;
