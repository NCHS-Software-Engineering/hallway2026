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
import Select from "./Components/Select";
import NCHSlogo from "./img/NCHSlogo.png";

function App() {
  // track the currently selected room and computed route
  const [room, setRoom] = useState("");
  const [route, setRoute] = useState(null);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // When a route is active, start both the warning and the reset timers
    if (route !== null && route !== '') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      // show warning after 30 seconds of inactivity
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
      }, 30000);

      // reset route completely after 40 seconds
      timeoutRef.current = setTimeout(() => {
        setRoom('');
        setRoute(null);
        setShowWarning(false);
      }, 40000);
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
    // Hide warning and restart the inactivity timers (30s warn, 40s reset)
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

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
  const normalized = String(room).trim().toUpperCase();
  const floorChar = normalized.charAt(0);

  if (!route) {
    // no room selected: just show entrance marker on first floor
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="/firstFloor2.png" endId="0" />;
  } else if (floorChar === '2') {
    // route goes via first floor stairs (node 27) then second floor
    RenderedComponent = [
      <JsonRead key="first" src="finalFilter.json" csvSrc="p1.csv" backgroundImage="/firstFloor2.png" endId={27} />,
      <JsonRead key="second" src="finalFilter.json" csvSrc="p2.csv" backgroundImage="/secondFloor2.png" endId={room} />
    ];
  } else if (floorChar === '3') {
    // via first floor stairs to third floor
    RenderedComponent = [
      <JsonRead key="first" src="finalFilter.json" csvSrc="p1.csv" backgroundImage="/firstFloor2.png" endId={27} />,
      <JsonRead key="third" src="finalFilter.json" csvSrc="p3.csv" backgroundImage="/thirdFloor2.png" endId={room} />
    ];
  } else if (floorChar === 'B') {
    RenderedComponent = <div>Basement navigation not implemented yet.</div>;
  } else {
    // default to first floor for any other room (including those starting with '1' or other chars)
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="/firstFloor2.png" endId={room} />;
  }

  const handleSelectChange = (e) => {
    const selectedRoom = e.target.value;
    setRoom(selectedRoom);
    // if change came from the dropdown, immediately set the route
    if (e.target.tagName === 'SELECT') {
      setRoute(selectedRoom);
    }
    console.log('Selected Room:', selectedRoom);
  };

  // compute a descriptive floor label based on the current route/room
  const getFloorLabel = () => {
    if (!route) return "";
    const r = String(route).toUpperCase();
    if (r.startsWith("2")) return "SECOND FLOOR";
    if (r.startsWith("3")) return "THIRD FLOOR";
    if (r.startsWith("B")) return "BASEMENT";
    return "FIRST FLOOR";
  };

  return (
    <div className="App">
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
            <label htmlFor="rooms-end" style={{ fontWeight: 500 }}>
              Route to:
            </label>

            {/* allow typing any room or picking from dropdown */}
            <input
              id="rooms-end-text"
              type="text"
              value={room}
              onChange={handleSelectChange}
              onKeyDown={(e) => { if (e.key === 'Enter') setRoute(room); }}
              placeholder="Enter Room Number"
              style={{ fontSize: '1rem', padding: '4px 6px', marginRight: '8px' }}
            />

            <Select
              idStr="rooms-end"
              value={room}
              onChange={handleSelectChange}
            />

            <button onClick={() => setRoute(room)}>
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
          </aside>

          {/* MAP SECTION */}
          <main className="map-section">
            {Array.isArray(RenderedComponent) ? (
            RenderedComponent.map((comp, idx) => (
              <div className="map-card" key={idx}>
                {comp}
              </div>
            ))
          ) : (
            <div className="map-card">
              {RenderedComponent}
            </div>
          )}
          <div className="floor-label">
            {getFloorLabel() || "FIRST FLOOR"}
          </div>
          </main>
        </div>
      </div>

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

