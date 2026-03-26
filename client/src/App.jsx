import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MapComponentb from "./MapComponentb";
import MapComponentf1 from "./MapComponentf1";
import MapComponentf2 from "./MapComponentf2";
import MapComponentf3 from "./MapComponentf3";
import JsonRead from "./Components/JsonRead";
import NCHSlogo from "./img/NCHSlogo.png";
import QRCode from "react-qr-code"; // <-- Make sure to run `npm install react-qr-code`

function App() {
  const [floor, setFloor] = useState(-1);
  const [room, setRoom] = useState("");
  const [route, setRoute] = useState(null);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
      }, 30000);

      timeoutRef.current = setTimeout(() => {
        setRoom('');
        setRoute(null);
        setShowWarning(false);
      }, 40000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowWarning(false);
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
    };
  }, [route]);

  const handleImStillHere = () => {
    setShowWarning(false);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, 30000);

    timeoutRef.current = setTimeout(() => {
      setRoom('');
      setRoute(null);
      setShowWarning(false);
    }, 40000);
  };

  let RenderedComponent;
  if (route === null || route === '') {
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId="0" />;
  } else if (route.length === 2) {
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
  } else {
    if(parseInt(room[0]) === 1) {
      RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
    } else if(parseInt(room[0]) === 2) {
      RenderedComponent = <ul><li><JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27}/></li><li><JsonRead src="finalFilter.json" csvSrc="p2.csv" backgroundImage="secondFloor2.png" endId={room}/></li></ul>; 
    } else if(parseInt(room[0]) === 3) {
      RenderedComponent = <ul><li><JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27}/></li><li><JsonRead src="finalFilter.json" csvSrc="p3.csv" backgroundImage="thirdFloor2.png" endId={room}/></li></ul>; 
    } else {
      RenderedComponent = <div>Sorry We Don't Have This Yet</div>;
    }
  }

  const handleSelectChange = (e) => {
    const selectedRoom = e.target.value;
    setRoom(selectedRoom);
    setRoute(selectedRoom);
  };

  // 2. HARDCODED LIVE URL: This guarantees the QR code points to the real AWS server
  const currentUrl = `http://nav.redhawks.us/?room=${room}`;

  return (
    <div className="app-container">
      {/* TOP BAR */}
      <header className="top-bar">
        <div className="header">
          <div className="header-left">
            <img src={NCHSlogo} alt="NCHS Logo" className="logo" />
            <h1>Naperville Central Class Finder</h1>
          </div>
        </div>

        <div className="route-block">
          <label htmlFor="rooms-end" style={{ fontWeight: 500, fontSize: '1.6rem' }}>
            Route to:
          </label>
          <input
            id="rooms-end"
            type="text"
            value={room}
            onChange={handleSelectChange}
            placeholder="Room #"
            className="room-input"
            style={{ fontSize: '1.4rem', padding: '8px 10px', color: 'black', textAlign: 'center' }}
          />
          <button onClick={() => setRoute(room)} style={{ fontSize: '1.6rem' }}>
            Route
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="main-layout">
        {/* LEFT PANEL */}
        <aside className="left-panel">
          <p style={{ fontStyle: "oblique" }}>Pathfinders, 2025</p>
          <h3>Contributors</h3>
          <hr />
          <p>Shawn Plackiyil '25</p>
          <p>Daniel Kozlowski '26</p>
          <p>Yutian Wang '26</p>
          <p>Fionn McCabe-Wild '26</p>

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
          <div className="map-card">
            {RenderedComponent}
          </div>

          <div className="floor-label">
            FIRST FLOOR
          </div>
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