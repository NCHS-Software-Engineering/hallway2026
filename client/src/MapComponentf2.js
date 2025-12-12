import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import CustomMap from "./maps/f2.svg"; // Import the SVG file
import "./App.css";

export default function MapComponentf2() {
  return (
    <div className="bg-red-600 min-h-screen flex items-center justify-center">
      <TransformWrapper>
        <TransformComponent>
        <img src={CustomMap} alt="Custom SVG Map" className="w-full h-auto"/>
          <svg width="600" height="600" viewBox="0 0 500 500"></svg>
          <img alt="This is the second floor"></img>
          
          <style>{`
            #svg-button-second {
              top: 147px;
              left: -1px;
              border-radius: 0 0 8px 0;
              border-width: 0 2px 2px 0;
            }
          `}</style>
          <script src="tts.js"></script>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
