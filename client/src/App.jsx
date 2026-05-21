import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import JsonRead from "./Components/JsonRead";
import NCHSlogo from "./img/NCHSlogo.png";
import QRCode from "react-qr-code"; 

function App() {
  const [floor, setFloor] = useState(-1);
  const [room, setRoom] = useState("");
  const [route, setRoute] = useState(null);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  // Detect if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Read the room from the URL when the app loads
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setRoom(roomParam);
      setRoute(roomParam);
    }
  }, []);

  useEffect(() => {
    if (route !== null && route !== '') {
      // Clear any existing timers/intervals
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      // Reset remaining seconds to 60
      setRemainingSeconds(60);
      setShowWarning(false);

      // Start countdown interval
      let secondsLeft = 60;
      countdownIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingSeconds(secondsLeft);

        // Show warning when 15 seconds remain
        if (secondsLeft === 15) {
          setShowWarning(true);
        }

        // Reset everything when countdown reaches 0
        if (secondsLeft <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setRoom('');
          setRoute(null);
          setShowWarning(false);
          setRemainingSeconds(60);
        }
      }, 1000);

      // Timeout to ensure cleanup at 60 seconds
      timeoutRef.current = setTimeout(() => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setRoom('');
        setRoute(null);
        setShowWarning(false);
        setRemainingSeconds(60);
      }, 60000);
    } else {
      // Clear timers and hide warning when no route
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setShowWarning(false);
      setRemainingSeconds(60);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [route]);

  const handleImStillHere = () => {
    // Hide warning and restart countdown
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset remaining seconds to 60
    setRemainingSeconds(60);

    // Start new countdown interval
    let secondsLeft = 60;
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setRemainingSeconds(secondsLeft);

      // Show warning when 15 seconds remain
      if (secondsLeft === 15) {
        setShowWarning(true);
      }

      // Reset everything when countdown reaches 0
      if (secondsLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setRoom('');
        setRoute(null);
        setShowWarning(false);
        setRemainingSeconds(60);
      }
    }, 1000);

    // Timeout to ensure cleanup at 60 seconds
    timeoutRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setRoom('');
      setRoute(null);
      setShowWarning(false);
      setRemainingSeconds(60);
    }, 60000);
  };

  let RenderedComponent;
  let floorLabelText = "FIRST FLOOR"; // Default to first floor text

  // Styles for rendering maps side by side
  const multiFloorContainerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row', // Stack maps on mobile if multi-floor
    gap: '20px',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const mapWrapperStyle = {
    flex: 1,
    minWidth: 0,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  if (route === null || route === '') {
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId="0" />;
  } else if (route.length === 2) {
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
  } else {
    if(parseInt(room[0]) === 1) {
      RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
      floorLabelText = "FIRST FLOOR";
    } else if(parseInt(room[0]) === 2) {
      RenderedComponent = (
        <div style={multiFloorContainerStyle}>
          <div style={mapWrapperStyle}>
            <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27} markerImage="/Stairs.png" />
          </div>
          <div style={mapWrapperStyle}>
            <JsonRead src="finalFilter.json" csvSrc="p2.csv" backgroundImage="secondFloor2.png" endId={room}/>
          </div>
        </div>
      );
      floorLabelText = "SECOND FLOOR"; // Dynamically change for the second floor
    } else if(parseInt(room[0]) === 3) {
      RenderedComponent = (
        <div style={multiFloorContainerStyle}>
          <div style={mapWrapperStyle}>
            <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27} markerImage="/Stairs.png" />
          </div>
          <div style={mapWrapperStyle}>
            <JsonRead src="finalFilter.json" csvSrc="p3.csv" backgroundImage="thirdFloor2.png" endId={room}/>
          </div>
        </div>
      );
      floorLabelText = "THIRD FLOOR"; // Dynamically change for the third floor
    } else {
      RenderedComponent = <div>Sorry We Don't Have This Yet</div>;
    }
  }

  const handleSelectChange = (e) => {
    const selectedRoom = e.target.value;
    setRoom(selectedRoom);
    // Start the timer immediately when any input is entered
    if (selectedRoom && selectedRoom.length > 0) {
      setRoute(selectedRoom);
    } else {
      setRoute(null);
    }
  };

  // HARDCODED LIVE URL
  const currentUrl = `http://nav.redhawks.us/?room=${room}`;

  return (
    <div className="app-container" style={isMobile ? { height: '100dvh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, background: '#000' } : {}}>
      
      {/* TOP BAR */}
      <header className="top-bar">
        <div className="header">
          <div className="header-left">
            <img src={NCHSlogo} alt="NCHS Logo" className="logo" />
            <h1>Naperville Central Class Finder</h1>
          </div>
        </div>

        <div className="top-bar-controls">
          <div className="timer-block">
            <span style={{ fontWeight: 500, fontSize: '1.6rem', whiteSpace: 'nowrap' }}>Time Remaining: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}</span>
          </div>
          <div className="route-block">
            <label htmlFor="rooms-end" style={{ fontWeight: 500, fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
              Route to:
            </label>
            <input
              id="rooms-end"
              type="text"
              value={room}
              onChange={handleSelectChange}
              placeholder="Room #"
              className="room-input"
              style={{ fontSize: '1.4rem', padding: '0px 10px', color: 'black', textAlign: 'center', width: '150px' }}
            />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="main-layout">
        {/* LEFT PANEL */}
        <aside className="left-panel">
          <h3>Contributors</h3>
          <hr/>
          <p style={{ fontStyle: "oblique" }}>Pathfinders, 2025</p>
          
          
          <p>Shawn Plackiyil '25</p>
          <p>Daniel Kozlowski '26</p>
          <p>Yutian Wang '26</p>
          <p>Fionn McCabe-Wild '26</p>
<hr />
          <p style={{ fontStyle: "oblique" }}>Aisle Be Back, 2026</p>
          
          <p>Matthew Hannemann '26</p>
          <p>Connor Kasper '27</p>
          <p>Jonathan Wang '26</p>

          {/* 3. Render the QR Code when there is an active route */}
          {route && route !== '' && (
            <div style={{ marginTop: '40px', background: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: 'black', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1rem' }}>Take the Map With You</p>
              <QRCode value={currentUrl} size={150} />
            </div>
          )}
        </aside>

        {/* MAP SECTION */}
        <main className="map-section">
          {(route === null || route === '') ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}>
              <img 
                src="/nchs_welcome.png" 
                alt="Welcome to NCHS" 
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <>
              <div className="map-card">
                {RenderedComponent}
              </div>

              <div className="floor-label">
                {floorLabelText} {/* dynamically renders the right floor name */}
              </div>
            </>
          )}
        </main>
      </div>

      {/* WARNING MODAL */}
      {showWarning && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(39, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f73e1e', padding: '20px', borderRadius: '8px', maxWidth: '90%', width: '420px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Are you still here? Your session will expire soon.</p>
            <button onClick={handleImStillHere} style={{ fontSize: '1rem', padding: '8px 12px' }}>I'm still here</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;