import React, { useEffect, useRef, useState, useCallback } from 'react';
import Papa from 'papaparse';

const NodeCanvas = ({
  src = '\\finalFilter.json',
  csvSrc = '\\p1.csv',
  backgroundImage = '',
  endId = ""
}) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [path, setPath] = useState([]);
  const [width, setWidth] = useState([]);
  const [height, setHeight] = useState([]);
  const [scale, setScale] = useState([]);
  const canvasRef = useRef(null);

  // Load connections and node coordinates
  useEffect(() => {
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${src}`);
        return res.json();
      })
      .then((json) => {
        setConnections(json.connections);
      });

    Papa.parse(csvSrc, {
      delimiter: ",",
      download: true,
      header: true,
      complete: (result) => {
        const parsedNodes = result.data.map((row) => ({
          ID: row.ID,
          X: parseFloat(row.X),
          Y: parseFloat(row.Y),
        }));
        console.log(result.data);
        setNodes(parsedNodes);
      },
      error: (err) => {
        console.error('Error parsing CSV file:', err);
      }
    });
  }, [src, csvSrc]);

  // Pathfinding
  const findPath = useCallback((data, target) => {
    for (const item of data) {
      if (Array.isArray(item)) {
        // If the item is deeply nested
        const result = findPath(item, target);
        if (result) return result;
      } else if (item === target) {
        // Base case: found target, return current level array
        setPath(data);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if(endId)
    {
      findPath(connections, ("0" + endId))
    }
  }, [endId, connections, findPath]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = backgroundImage;

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      setWidth(image.width);
      setHeight(image.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // Draw lines
      for (let i = 0; i < path.length - 1; i++) {
        const startId = (path[i]);
        const endId = (path[i + 1]);
      
        const startNode = nodes.find(n => n.ID === startId);
        const endNode = nodes.find(n => n.ID === endId);
        console.log(startNode, endNode);
      
        if (startNode && endNode) {
          ctx.beginPath();
          ctx.moveTo(startNode.X, width - startNode.Y-627);
          ctx.lineTo(endNode.X, width - endNode.Y-627);
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 4;
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw nodes
      path.forEach((nodeId) => {
        const node = nodes.find(n => n.ID === (nodeId));
        if (node) {
          ctx.beginPath();
          ctx.arc(node.X, width - node.Y -627, 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
          ctx.stroke();
        }
      });
    };

    image.onerror = () => {
      console.error('Failed to load background image:', backgroundImage);
    };
  }, [backgroundImage, path, nodes]);

  useEffect(() => {
    console.log(path);
    console.log(nodes);
    if (csvSrc === 'p1.csv')
    if (path.length > 0 && nodes.length > 0) {
      drawCanvas();
    }
  }, [nodes, path, backgroundImage, drawCanvas]);

  return (
    <div>
      <h1>Node Network to End Node {endId}</h1>
      <canvas ref={canvasRef} width={width} height={height} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default NodeCanvas;