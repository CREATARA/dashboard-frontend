import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Papa from 'papaparse'; // <-- 1. Import papaparse

// Custom Tooltip Component to show Date and Time
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
                <p className="text-green-400">{`RPM: ${data.rpm}`}</p>
            </div>
        );
    }
    return null;
};

// Helper function to format a date object to 'YYYY-MM-DD' without timezone conversion
const formatDateForSQL = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const In40Analytics = ({ isOpen, onClose }) => {
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
                const response = await axios.post('https://creatara-backend.onrender.com/api/data/in40/analytics/rpm-vs-soc', body);
                const formattedData = response.data.map(item => ({
                    ...item,
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
            pdf.text('Efficiency Analysis Report (RPM & SOC vs. Time)', 14, 22);
            pdf.setFontSize(11);
            pdf.setTextColor(100);
            const dateRange = startDate && endDate 
                ? `Date Range: ${formatDateForSQL(startDate)} to ${formatDateForSQL(endDate)}`
                : 'Showing Latest 200 Readings';
            pdf.text(dateRange, 14, 30);
            pdf.addImage(imgData, 'PNG', 10, 40, 280, 100);
            autoTable(pdf, {
                startY: 150,
                head: [['Time', 'SOC (%)', 'RPM']],
                body: chartData.map(d => [
                    new Date(d.received_at.replace(' ', 'T')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    d.soc,
                    d.rpm
                ]),
                theme: 'grid'
            });
            pdf.save('efficiency_report.pdf');
            setLoading(false);
        });
    };
    
    // ** 2. NEW FUNCTION TO HANDLE CSV DOWNLOAD **
    const handleDownloadCSV = () => {
        if (chartData.length === 0) return;

        // Prepare the data with user-friendly headers for the CSV file
        const csvData = chartData.map(d => ({
            "Time": new Date(d.received_at.replace(' ', 'T')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            "SOC (%)": d.soc,
            "RPM": d.rpm
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'efficiency_data.csv');
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
                    <h2 className="text-2xl font-bold text-white">Efficiency Analysis (RPM & SOC vs. Time)</h2>
                    <div className="flex items-center gap-4">
                        {/* ** 3. ADD THE NEW CSV DOWNLOAD BUTTON ** */}
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
                        <div className="text-white text-center flex justify-center items-center h-full">Loading Chart...</div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="timeLabel" stroke="#A0AEC0" isAnimationActive={false} />
                                <YAxis yAxisId="left" label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#38bdf8" domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'RPM', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#82ca9d" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="soc" name="SOC (%)" stroke="#38bdf8" dot={true} activeDot={{ r: 8 }} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="rpm" name="RPM" stroke="#82ca9d" dot={true} activeDot={{ r: 8 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="text-gray-400 text-center flex justify-center items-center h-full">No data available for the selected date range.</div>
                    )}
                </div>
                
                <div className="flex justify-end items-center gap-4 mt-4 text-white">
                    <div>
                        <label className="mr-2">From:</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="yyyy-MM-dd"
                            className="bg-gray-700 p-2 rounded-md text-white"
                            isClearable
                        />
                    </div>
                    <div>
                        <label className="mr-2">To:</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="yyyy-MM-dd"
                            className="bg-gray-700 p-2 rounded-md text-white"
                            isClearable
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default In40Analytics;











// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // Custom Tooltip Component to show Date and Time
// const CustomTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//         const data = payload[0].payload;
//         // Format the full date and time for the tooltip
//         const fullDateTime = new Date(data.received_at.replace(' ', 'T')).toLocaleString('en-US', {
//             year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
//         });
//         return (
//             <div className="p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
//                 <p>{`Time: ${fullDateTime}`}</p>
//                 <p className="text-blue-400">{`SOC: ${data.soc}%`}</p>
//                 <p className="text-green-400">{`RPM: ${data.rpm}`}</p>
//             </div>
//         );
//     }
//     return null;
// };

// // Helper function to format a date object to 'YYYY-MM-DD' without timezone conversion
// const formatDateForSQL = (date) => {
//     if (!date) return null;
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

// const In40Analytics = ({ isOpen, onClose }) => {
//     const [chartData, setChartData] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // State for the date pickers, initialized to null
//     const [startDate, setStartDate] = useState(null);
//     const [endDate, setEndDate] = useState(null);

//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 // Create the request body. If dates are null, it will be an empty object.
//                 const body = startDate && endDate ? {
//                     startDate: formatDateForSQL(startDate) + ' 00:00:00',
//                     endDate: formatDateForSQL(endDate) + ' 00:00:00',
//                 } : {};

//                 const response = await axios.post('https://creatara-backend.onrender.com/api/data/in40/analytics/rpm-vs-soc', body);

//                 const formattedData = response.data.map(item => ({
//                     ...item, // Keep the original received_at for the tooltip
//                     // Format the time for the X-Axis label
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

//         // Fetch data whenever the modal is open.
//         // It will also re-fetch if the dates change.
//         if (isOpen) {
//             fetchData();
//         }
//     }, [isOpen, startDate, endDate]);


//     //pdf download  function 

//    const handleDownloadReport = () => {
//         const chartElement = chartRef.current;
//         if (!chartElement || chartData.length === 0) return;

//         setLoading(true); // Show a loading state while generating PDF
//         html2canvas(chartElement).then((canvas) => {
//             const imgData = canvas.toDataURL('image/png');
//             const pdf = new jsPDF('landscape');

//             pdf.setFontSize(18);
//             pdf.text('Efficiency Analysis Report (RPM & SOC vs. Time)', 14, 22);
//             pdf.setFontSize(11);
//             pdf.setTextColor(100);
//             const dateRange = startDate && endDate 
//                 ? `Date Range: ${formatDateForSQL(startDate)} to ${formatDateForSQL(endDate)}`
//                 : 'Showing Latest 200 Readings';
//             pdf.text(dateRange, 14, 30);

//             pdf.addImage(imgData, 'PNG', 10, 40, 280, 100);

//             pdf.autoTable({
//                 startY: 150,
//                 head: [['Time', 'SOC (%)', 'RPM']],
//                 body: chartData.map(d => [
//                     new Date(d.received_at.replace(' ', 'T')).toLocaleString('en-US'),
//                     d.soc,
//                     d.rpm
//                 ]),
//             });

//             pdf.save('efficiency_report.pdf');
//             setLoading(false); // Hide loading state
//         });
//     };





//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
//             <div className="bg-primary p-6 rounded-2xl shadow-lg w-full max-w-5xl">
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-2xl font-bold text-white">Efficiency Analysis (RPM & SOC vs. Time)</h2>
//                        <button 
//                             onClick={handleDownloadReport}
//                             className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mr-4"
//                             disabled={loading || chartData.length === 0}
//                         >
//                             Download Report
//                         </button>
//                     <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
//                 </div>
              
//                 <div ref={chartRef} style={{ width: '100%', height: 400, backgroundColor: '#1A202C', padding: '1rem' }}>
//                 <div style={{ width: '100%', height: 400 }}>
//                     {loading ? (
//                         <div className="text-white text-center">Loading Chart...</div>
//                     ) : chartData.length > 0 ? (
//                         <ResponsiveContainer>
//                             <LineChart data={chartData}>
//                                 <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
//                                 <XAxis dataKey="timeLabel" stroke="#A0AEC0" isAnimationActive={false} />
//                                 <YAxis yAxisId="left" label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#38bdf8" domain={[0, 100]} />
//                                 <YAxis yAxisId="right" orientation="right" label={{ value: 'RPM', angle: -90, position: 'insideRight', fill: '#A0AEC0' }} stroke="#82ca9d" />
//                                 <Tooltip content={<CustomTooltip />} />
//                                 <Legend />
//                                 <Line yAxisId="left" type="monotone" dataKey="soc" name="SOC (%)" stroke="#38bdf8" dot={true} activeDot={{ r: 8 }} isAnimationActive={false} />
//                                 <Line yAxisId="right" type="monotone" dataKey="rpm" name="RPM" stroke="#82ca9d" dot={true} activeDot={{ r: 8 }} isAnimationActive={false} />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     ) : (
//                          <div className="text-gray-400 text-center flex justify-center items-center h-full">No data available for the selected date range.</div>
//                     )}
//                 </div>
//              </div>
//                 {/* Date Picker Section - Moved to the bottom right */}
//                 <div className="flex justify-end items-center gap-4 mt-4 text-white">
//                     <div>
//                         <label className="mr-2">From:</label>
//                         <DatePicker
//                             selected={startDate}
//                             onChange={(date) => setStartDate(date)}
//                             dateFormat="yyyy-MM-dd"
//                             className="bg-gray-700 p-2 rounded-md text-white"
//                             isClearable
//                         />
//                     </div>
//                     <div>
//                         <label className="mr-2">To:</label>
//                         <DatePicker
//                             selected={endDate}
//                             onChange={(date) => setEndDate(date)}
//                             dateFormat="yyyy-MM-dd"
//                             className="bg-gray-700 p-2 rounded-md text-white"
//                             isClearable
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
// export default In40Analytics;

