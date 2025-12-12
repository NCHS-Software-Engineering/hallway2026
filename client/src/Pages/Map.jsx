import React, { useEffect } from "react";
import svgPanZoom from 'svg-pan-zoom'
import "../style.css"

console.log("ran map")

function editSVGMap() {
    var zoom1 = new svgPanZoom('#svgMap', {
    zoomEnabled: true,
    controlIconsEnabled: false,
    zoomScaleSensitivity: .5
    });
    // starting zoom value
    zoom1.zoom(1)
    return zoom1;
}

function editSVGDetail() {
    var zoom2 = new svgPanZoom('#svgDetail', {
    zoomEnabled: true,
    controlIconsEnabled: false,
    zoomScaleSensitivity: .5
    });
    zoom2.zoom(1)
    return zoom2;
}

function syncSVGs(zoom1, zoom2) {
    console.log("synced")
    console.log(document.getElementById("svgDetail"))
    
    // when zoom1 is zoomed
    zoom1.setOnZoom(function(level) {
    // zoom and pan zoom2
    zoom2.zoom(level)
    zoom2.pan(zoom1.getPan())

    // make zoom2 visible or invisible based on zoomLevel
    var zoomLevel = zoom1.getZoom();
    var status = document.getElementById("svgDetail").style.visibility;
    console.log(zoomLevel, status)

    if (status === 'hidden' && zoomLevel > 3) {
        console.log("visible");
        document.getElementById("svgDetail").style.visibility = "visible";
    }
    else if (status === 'visible' && zoomLevel < 3) {
        console.log("hidden");
        document.getElementById("svgDetail").style.visibility = "hidden";
    }

    })

    // when zoom1 is panned
    zoom1.setOnPan(function(point){
    zoom2.pan(point)
    })

    // when zoom2 is modified (zoomed / panned)
    zoom2.setOnZoom(function(level){
    zoom1.zoom(level)
    zoom1.pan(zoom2.getPan())
    })

    zoom2.setOnPan(function(point){
    zoom1.pan(point)
})
}

function Map(){
    useEffect(() => {
        // duplicate promises (load svg-pan-zoom)
        function dup() {
            var first = new Promise(function(resolve) {
            document.getElementById("svgMap").addEventListener('load', resolve, false);
            })
            var second = new Promise(function(resolve) {
            document.getElementById("svgDetail").addEventListener('load', resolve, false);
            })

            Promise.all([first, second]).then(function() {
                var zoom1 = editSVGMap();
                var zoom2 = editSVGDetail();
                console.log('svg-pan-zoom enabled')
                syncSVGs(zoom1, zoom2);
                
                // zoom currently starts at 1
                document.getElementById("svgDetail").style.visibility = "hidden";
                dup();
            });
        }

        dup();

                // Cleanup function to remove event listeners when component unmounts
        return () => {
            document.getElementById("svgMap").removeEventListener('load', dup, false);
            document.getElementById("svgDetail").removeEventListener('load', dup, false);
        };
    }, []);
   
    return(
        <div className="map-style">
            <object className="svgElement" id="svgMap" data="../maps/f1.svg" type="image/svg+xml">
            </object>
            <object className="svgElement" id="svgDetail" data="../maps/f1.svg" type="image/svg+xml">
            </object>
        </div>
    );
}

export default Map;