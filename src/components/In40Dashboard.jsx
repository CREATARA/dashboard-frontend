import React, { useRef, useState, useEffect } from "react";
import mqtt from "mqtt";

// --- Data Mappings and Dummy Data ---

const DUMMY_DATA = {
  vehicle_on: false,
  motor_status: false,
  steer_lock: false,
  bat_lock: false,
  sstand: false,
  bat_dock: false,
  brake: false,
  kill: false,
  pbutton: false,
  speed: 0,
  vmode: 0,
  odometer: 0,
  charging: false,
  soc: 0,
  btemp: 0,
  mtemp: 0,
  DIAGNOSTICS: [],
  timestamp: "",
  amp:0,
  volt:0,
};

const DIAGNOSTIC_ERROR_MAP = {
  1001: "Pack Voltage High",
  1002: "Pack Undervoltage",
  1003: "Charge Overtemperature",
  1004: "Charge Low Temperature",
  1005: "Discharge Overtemperature",
  1006: "Discharge Low Temperature",
  1007: "Charge Overcurrent",
  1008: "Discharge Overcurrent",
  1009: "Battery Short Circuit",
  2001: "Battery Lock",
  2002: "Steering Lock",
  2003: "Side Stand",
  2004: "Charger Connected",
  5001: "MOSFET High Temperature",
  5002: "DC Bus Current High",
  5003: "High Phase Current U",
  5004: "High Phase Current V",
  5005: "High Phase Current W",
  5006: "MCU Board Overtemperature",
  5007: "DC Bus Overvoltage",
  5008: "DC Bus Undervoltage",
  5009: "Throttle Out of Range",
  5010: "Machine Overtemperature",
  5011: "Position Sensor Fault",
};

const V_MODE_MAP = {
  1: "Eco",
  2: "Normal",
  3: "Sports",
  4: "Boost",
  5: "Reverse",
};


const MAX_SPEED = 120; // Define a maximum speed for the gauge percentage



// --- Component ---

const In40Dashboard = () => {

const [data, setData] = useState(DUMMY_DATA);
  const [displayTimestamp, setDisplayTimestamp] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null); // <-- New state for timeout
  const clientRef = useRef(null);

  // --- MQTT Connection Logic ---
  const MQTT_URL = import.meta.env.VITE_MQTT_URL_In40;
  const MQTT_OPTIONS = {
    username: import.meta.env.VITE_MQTT_USERNAME_In40,
    password: import.meta.env.VITE_MQTT_PASSWORD_In40,
    keepalive: 60,
    reconnectPeriod: 1000,
    clientId: import.meta.env.VITE_MQTT_CLIENT_ID_In40,
    clean: true,
  };
  const topic = import.meta.env.VITE_MQTT_TOPIC_In40 || "can/data";

  useEffect(() => {
    if (clientRef.current) return;

    const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);
    clientRef.current = client;

    client.on("connect", () => {
      console.log("✅ MQTT Connected");
      setIsConnected(true);
      client.subscribe(topic);
    });

    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setData(prevData => ({ ...prevData, ...payload }));
        setLastMessageTime(Date.now()); // <-- Update timestamp on every message
      } catch (err) {
        console.error("MQTT Parse error:", err);
      }
    });

    client.on("close", () => {
      console.log("❌ MQTT Disconnected");
      setIsConnected(false);
      setLastMessageTime(null); // <-- Reset timer on disconnect
      setData(DUMMY_DATA);
    });
    
    client.on("error", (err) => {
        console.error("MQTT Connection Error:", err);
        setLastMessageTime(null);
        client.end();
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []);

  // --- Timeout Logic Effect ---
  useEffect(() => {
    // Don't run the timer if not connected or if we've never received a message
    if (!isConnected || !lastMessageTime) {
        return;
    }

    const timeoutInterval = setInterval(() => {
        const timeSinceLastMessage = (Date.now() - lastMessageTime) / 1000; // in seconds
        
        // Check if 70 seconds (1 min 10 secs) have passed
        if (timeSinceLastMessage > 70) {
            console.warn("MQTT data stream timed out. Reverting to dummy data.");
            setData(DUMMY_DATA);
            setLastMessageTime(null); // Stop the timer from firing again until a new message arrives
        }
    }, 5000); // Check every 5 seconds

    // Cleanup function to clear the interval
    return () => clearInterval(timeoutInterval);

  }, [isConnected, lastMessageTime]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      setDisplayTimestamp(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Helper Functions ---
  const formatStatus = (val) => (val ? "Active" : "Inactive");
  const getVModeName = (mode) => V_MODE_MAP[mode] || "N/A";
  
  const getDiagnosticMessages = (codes) => {
    if (!codes || codes.length === 0) {
      return [{ code: "OK", message: "No Errors" }];
    }
    return codes.map((code) => ({
      code,
      message: DIAGNOSTIC_ERROR_MAP[code] || `Unknown Code: ${code}`,
    }));
  };





   // Generates a smooth linear gradient for the speed gauge background
 
   const getSpeedColor = (speed) => {
      if (speed > 80) return '#AD2408';
      if (speed > 60) return '#EB3915';
      if (speed > 40) return '#E0C600';
      if (speed > 20) return '#0FE000';
      if (speed >= 10) return '#55B000';
      return 'transparent'; // Default for speed < 10
  };

  const getSpeedPercentage = (speed) => {
      const clampedSpeed = Math.min(speed, MAX_SPEED);
      return (clampedSpeed / MAX_SPEED) * 100;
  };

   // **New function to calculate range based on SOC**
  const calculateRange = (soc) => {
    const MAX_RANGE_AT_100_SOC = 97; // in km
    if (typeof soc !== 'number' || soc < 0) return 0;
    const range = (soc / 100) * MAX_RANGE_AT_100_SOC;
    return range;
  };


  const diagnosticMessages = getDiagnosticMessages(data.DIAGNOSTICS);
  
   const greenFilter = 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'; // #0FE000
  const redFilter = 'invert(32%) sepia(83%) saturate(3025%) hue-rotate(349deg) brightness(96%) contrast(93%)'; // #EB3915


  return (
    <>
      
      {/* --- Main Dashboard --- */}
      <div className="flex text-white">
        {/* --- Left Side --- */}
        <div className="w-3/4  p-3 min-h-screen gap-3 flex flex-col items-center justify-center">
          {/* Row 1 */}
          <div className="w-full px-3  h-[165px] rounded-3xl flex items-center gap-3 bg-primary">
            <div className="w-[140px] h-[140px] rounded-3xl gap-4 p-3 flex flex-col justify-center items-center bg-secondry">
              <img src="/vehicle.png" alt="Vehicle Status"height={35} width={35}
                style={{ filter: data.vehicle_on ? greenFilter : redFilter }}
              />
              <span className="text-xl">Vehicle {data.vehicle_on ? "ON" : "OFF"}</span>
            </div>
            <div className="gap-4 flex rounded-3xl flex-col justify-center items-center w-[140px] h-[140px] bg-secondry">
              <img src="/Gear.png" alt="Motor Status"  height={35} width={35} 
              style={{ filter: data.motor_status ? greenFilter : redFilter }}
              />
              <div className="flex flex-col items-center">
                <span className="text-xl">Motor</span>
                <span className="text-xl">{data.motor_status ? "ON" : "OFF"}</span>
              </div>
            </div>
            <div className="w-[140px] rounded-3xl h-[140px] flex gap-4 flex-col justify-center items-center bg-secondry">
              <img src={data.steer_lock ? "/lockon.png" : "/lockoff.png"} alt="Handle Lock" height={35} width={35} />
              <div className="flex flex-col items-center">
                <span className="text-xl">Handle Lock</span>
                <span className="text-xl">{formatStatus(data.steer_lock)}</span>
              </div>
            </div>
            <div className="w-[140px] rounded-3xl h-[140px] flex gap-4 flex-col justify-center items-center bg-secondry">
              <img  src={data.bat_lock ? "/batlockon.png" : "/batlockoff.png"} 
                alt="Battery Lock"  height={35} width={35} />
              <div className="flex flex-col items-center">
                <span className="text-xl">Battery Lock</span>
                <span className="text-xl">{formatStatus(data.bat_lock)}</span>
              </div>
            </div>
            <div className="w-[140px] h-[140px] rounded-3xl bg-secondry flex gap-4 flex-col justify-center items-center">
              <img  src={data.sstand ? "/sstandon.png" : "/sstandoff.png"}  alt="Side Stand" height={35} width={35} />
              <div className="flex flex-col items-center">
                <span className="text-xl">Side Stand</span>
                <span className="text-xl">{formatStatus(data.sstand)}</span>
              </div>
            </div>
            <div className="w-[140px] h-[140px] rounded-3xl bg-secondry flex gap-4 flex-col justify-center items-center">
              <img   src={data.bat_dock ? "/plugson.png" : "/plugsoff.png"}  alt="Battery Dock"  height={35} width={35} />
              <div className="flex flex-col items-center"> 
                <span className="text-xl">Battery</span>
                <span className="text-xl">{data.bat_dock ? "Docked" : "Undocked"}</span>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="w-full h-[165px] flex items-center  pl-3 gap-3 rounded-3xl bg-primary">
            <div className="w-[220px] h-[135px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
              <span className="text-xl">Brakes</span>
              <span className="text-3xl">{formatStatus(data.brake)}</span>
            </div>
            <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
              <span className="text-xl">Kill Switch</span>
              <span className="text-3xl">{data.kill ? "Active" : "Inactive/Off"}</span>
            </div>
            <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
              <span className="text-xl">Push Button</span>
              <span className="text-3xl">{formatStatus(data.pbutton)}</span>
            </div>
          </div>
          {/* Row 3 */}
          <div className="w-full h-[165px] rounded-3xl flex items-center  pl-3 gap-3 bg-primary">
             <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Speed</span>
               <span className="text-3xl">{data.speed?.toFixed(0) ?? '0'} km/hr</span>
             </div>
             <div className="w-[150px]   gap-2 justify-start  h-[140px]  flex">
                <div className="w-[52px] h-full border-2 border-gray-400  flex items-end bg-white overflow-hidden">
                    <div
                        className="w-full"
                        style={{
                            height: `${getSpeedPercentage(data.speed)}%`,
                            backgroundColor: getSpeedColor(data.speed),
                            transition: 'height 0.5s ease, background-color 0.5s ease'
                        }}
                    ></div>
                </div>
                <div className=" flex justify-end items-end">
                    <span className="text-xl">Readings</span>
                </div>
             </div>
             <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Mode</span>
                <span className="text-3xl">{getVModeName(data.vmode)}</span>
             </div>
             <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Odometer</span>
               <span className="text-3xl">{data.odometer?.toFixed(2) ?? '0.00'} km</span>
             </div>
          </div>
          {/* Row 4 */}
          <div className="w-full flex h-[165px] pl-3  rounded-3xl bg-primary items-center gap-3">
            <div className="w-[170px] h-[140px] rounded-3xl bg-secondry gap-2 flex flex-col justify-center p-4">
              <span className="text-xl">Charging</span>
              <span className="text-3xl">{data.charging ? "Active" : "Inactive"}</span>
            </div>
            {/* this is the range and for now it is static  */}
           <div className="w-[170px] h-[140px] rounded-3xl bg-secondry flex flex-col justify-center p-4">
              <span className="text-xl">Range</span>
              <span className="text-3xl">{calculateRange(data.soc).toFixed(1)} km</span>
            </div>
             <div className="flex items-center justify-center gap-2 w-[160px] h-[140px]">
                <div className="w-[40%] h-full bg-white rounded-2xl flex items-end overflow-hidden border-2 border-gray-400">
                    <div className="w-full" style={{ height: `${data.soc}%`, backgroundColor: '#99C842' }}></div>
                </div>
                <div className="w-[60%]  h-full justify-end flex-col flex items-baseline">
                    <span className="text-xl">SOC</span>
                    <span className="text-3xl">{data.soc}%</span>
                </div>
             </div>
             <div className="w-[170px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Battery Temp</span>
               <span className="text-3xl">{data.btemp}°C</span>
             </div>
             <div className="w-[170px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Motor Temp</span>
               <span className="text-3xl">{data.mtemp}°C</span>
             </div>
          </div>
        </div>

        {/* --- Right Side (Diagnostics) --- */}
        <div className="w-2/4 min-h-screen gap-3 pr-2 flex flex-col items-center justify-center">
            <div className="w-full h-auto min-h-[165px] flex flex-col p-3 bg-primary rounded-3xl">
                <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xl font-bold">Diagnostics</span>
                    <span className="text-lg">{displayTimestamp.toLocaleTimeString()}</span>
                </div>
                <div className="w-full flex flex-col gap-2 overflow-y-auto" style={{maxHeight: '120px'}}>
                    {diagnosticMessages.map((diag, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                                {diag.code !== "OK" && (
                                    <img src="/Warning.png" alt="warning-logo" className="w-6 h-6"/>
                                )}
                                <span className="text-md">{diag.message}</span>
                            </div>
                            {diag.code !== "OK" && (
                                <span className="text-md font-mono bg-red-500/50 px-2 py-1 rounded">
                                    {diag.code}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* Static placeholder divs */}
            <div className="w-full   p-3 h-auto min-h-[165px] bg-primary rounded-3xl ">
             
            </div>
            <div className="w-full   p-3 h-auto min-h-[165px] bg-primary rounded-3xl"></div>
            <div className="w-full  p-3 h-auto min-h-[165px] bg-primary flex gap-3 rounded-3xl">
              <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Voltage</span>
               <span className="text-3xl">{data.volt?.toFixed(0) ?? '0'} V</span>
             </div>
              <div className="w-[220px] h-[140px] rounded-3xl gap-2 bg-secondry flex flex-col justify-center p-4">
               <span className="text-xl">Current</span>
               <span className="text-3xl">{data.amp?.toFixed(0) ?? '0'} A</span>
             </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default In40Dashboard ;
