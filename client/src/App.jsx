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

function App() {
  const [floor, setFloor] = useState(-1);
  const [room, setRoom] = useState('');
  const [route, setRoute] = useState(null);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // When a route is active, start both the warning and the reset timers
    if (route !== null && route !== '') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      // Show warning when 10 seconds remain (after 20s)
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
      }, 30000);

      // Reset after 30s
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
    // Hide warning and restart both timers
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
  if (route === null || route === '')
  {

  }
  else if (route.length === 2){
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
  }
  else{
    if(parseInt(room[0]) === 1){
      RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={room}/>;
    }
    else if(parseInt(room[0]) === 2){
      RenderedComponent = <ul><li><JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27}/></li><li><JsonRead src="finalFilter.json" csvSrc="p2.csv" backgroundImage="secondFloor2.png" endId={room}/></li></ul>; 
    }
    else if(parseInt(room[0]) === 3){
      RenderedComponent = <ul><li><JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId={27}/></li><li><JsonRead src="finalFilter.json" csvSrc="p3.csv" backgroundImage="thirdFloor2.png" endId={room}/></li></ul>; 
    }
    else{
      RenderedComponent = <div>Sorry We Don't Have This Yet</div>;
    }
  }

  const handleSelectChange = (e) => {
    const selectedRoom = e.target.value;
    setRoom(selectedRoom);
    setRoute(selectedRoom);
    console.log('Selected Room:', selectedRoom);
  };

  return (
    <>
      <div className="App">
        <header>
          <p>Naperville Central class finder</p>
        </header>

        <ul>
          <li>
            <label
              htmlFor="rooms-end"
              style={{ fontSize: '1.6rem', fontWeight: 600, marginRight: '8px' }}
            >
              Where is...
            </label>
            <input
              id="rooms-end"
              type="text"
              value={room}
              onChange={handleSelectChange}
              placeholder="Enter room number"
              style={{ fontSize: '1.2rem', padding: '8px 10px', width: '320px' }}
            />
          </li>
          {RenderedComponent}
          {showWarning && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(39, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#f73e1e', padding: '20px', borderRadius: '8px', maxWidth: '90%', width: '420px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Are you still here? Your session will expire soon.</p>
                <button onClick={handleImStillHere} style={{ fontSize: '1rem', padding: '8px 12px' }}>I'm still here</button>
              </div>
            </div>
          )}
        </ul>

        <div id="aside">
          <p style={{ fontStyle: "oblique" }}>Pathfinders, 2025.</p>
          <h4>Contributors</h4>
          <hr />
          <p>Shawn Plackiyil '25.</p>
          <p>Daniel Kozlowski '26.</p>
          <p>Yutian Wang '26.</p>
          <p>Fionn McCabe-Wild '26.</p>
          <hr />
        </div>
      </div>
    </>
  );
}

export default App;
