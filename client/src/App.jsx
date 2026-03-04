import React, { useState } from 'react';
import './App.css';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Select from "./Components/Select";
import MapComponentb from "./MapComponentb";
import MapComponentf1 from "./MapComponentf1";
import MapComponentf2 from "./MapComponentf2";
import MapComponentf3 from "./MapComponentf3";
import JsonRead from "./Components/JsonRead";
import NCHSlogo from "./img/NCHSlogo.png";

function App() {
  const [floor, setFloor] = useState(-1);
  const [room, setRoom] = useState("");
  const [route, setRoute] = useState(null);

  let RenderedComponent;
  if (route === null)
  {
    // show first floor map with only the start node (ID 0) highlighted
    RenderedComponent = <JsonRead src="finalFilter.json" csvSrc="p1.csv" backgroundImage="firstFloor2.png" endId="0" />;
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
    setRoute(null);
    console.log('Selected Room:', selectedRoom);
  };

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
  <label htmlFor="rooms-end" style={{ fontWeight: 500 }}>
    Route to:
  </label>

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

        <div className="map-card">
          {RenderedComponent}
        </div>

        <div className="floor-label">
          FIRST FLOOR
        </div>

      </main>

    </div>

  </div>
);
}
export default App;

