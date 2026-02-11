import React, { useEffect, useRef, useState, useCallback } from 'react';
import Papa from 'papaparse';

const NodeCanvas = ({
  src = '/finalFilter.json',
  csvSrc = '/p1.csv',
  backgroundImage = '',
  endId = ""
}) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [path, setPath] = useState([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const canvasRef = useRef(null);

  // Load connections and node coordinates
  useEffect(() => {
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${src}`);
        return res.json();
      })
      .then((json) => {
        // Accept either { connections: [...] } or a top-level array
        const conns = json && json.connections ? json.connections : json;
        console.log('Fetched connections (sample):', Array.isArray(conns) ? conns.slice(0,5) : conns);
        setConnections(conns || []);
      })
      .catch(err => {
        console.error('Error fetching JSON:', err);
        setConnections([]);
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
        console.log('Parsed CSV rows:', result.data.length);
        setNodes(parsedNodes);
      },
      error: (err) => {
        console.error('Error parsing CSV file:', err);
        setNodes([]);
      }
    });
  }, [src, csvSrc]);

  // Robust path finder: normalize target and attempt to find it in nested arrays
  const findPath = useCallback((data, target) => {
    if (!data) return null;

    // Normalize the search target(s) as strings; try a few common formats
    const t = String(target);
    const candidates = Array.from(new Set([
      t,
      t.startsWith('0') ? t.replace(/^0+/, '') : '0' + t, // "051" <-> "51"
      t.padStart(3, '0'),
      t.padStart(2, '0'),
    ]));

    function search(arr) {
      for (const item of arr) {
        if (Array.isArray(item)) {
          const result = search(item);
          if (result) return result;
        } else {
          const itemStr = String(item);
          if (candidates.includes(itemStr)) {
            return arr; // return the array that contains the match
          }
        }
      }
      return null;
    }

    const found = search(data);
    if (found) {
      setPath(found);
      return found;
    }
    return null;
  }, []);

  // Trigger search when connections and endId are available.
  useEffect(() => {
    if (!endId) {
      console.log('No endId set yet.');
      return;
    }
    if (!connections || (Array.isArray(connections) && connections.length === 0)) {
      console.log('Waiting for connections to load...');
      return;
    }

    const raw = String(endId);
    const targets = Array.from(new Set([
      raw,
      raw.startsWith('0') ? raw.replace(/^0+/, '') : '0' + raw,
      raw.padStart(3, '0'),
    ]));

    console.log('Searching for targets:', targets);

    for (const tgt of targets) {
      const ans = findPath(connections, tgt);
      if (ans) {
        console.log('Found path for target', tgt, 'path length', ans.length);
        break;
      } else {
        console.log('No path for target', tgt);
      }
    }
  }, [endId, connections, findPath]);

  // Draw canvas (robust: attach handlers before src, handle cached images)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const image = new Image();

    console.log('drawCanvas start, backgroundImage =', backgroundImage);

    const handleImageLoad = () => {
      console.log('image loaded handler ->', { src: image.src, width: image.width, height: image.height });

      const iw = image.width || 800;
      const ih = image.height || 600;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${iw}px`;
      canvas.style.height = `${ih}px`;
      canvas.width = Math.round(iw * dpr);
      canvas.height = Math.round(ih * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      setWidth(iw);
      setHeight(ih);

      ctx.clearRect(0, 0, iw, ih);
      ctx.drawImage(image, 0, 0, iw, ih);

      console.log('After drawImage: canvas attr size', canvas.width, canvas.height, 'CSS', window.getComputedStyle(canvas).width, window.getComputedStyle(canvas).height);
      console.log('Path length:', Array.isArray(path) ? path.length : path, 'Nodes:', Array.isArray(nodes) ? nodes.length : nodes);

      const yOffset = 0;

      // Draw lines
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < path.length - 1; i++) {
        const startNode = nodes.find(n => String(n.ID) === String(path[i]));
        const endNode = nodes.find(n => String(n.ID) === String(path[i + 1]));
        if (!startNode || !endNode) continue;

        const sx = parseFloat(startNode.X);
        const sy = parseFloat(startNode.Y);
        const ex = parseFloat(endNode.X);
        const ey = parseFloat(endNode.Y);
        if ([sx, sy, ex, ey].some(v => Number.isNaN(v))) continue;

        const mappedStartY = ih - sy - yOffset;
        const mappedEndY = ih - ey - yOffset;

        ctx.beginPath();
        ctx.moveTo(sx, mappedStartY);
        ctx.lineTo(ex, mappedEndY);
        ctx.stroke();
        ctx.closePath();
      }

      // Draw nodes
      for (const nodeId of path) {
        const node = nodes.find(n => String(n.ID) === String(nodeId));
        if (!node) continue;
        const nx = parseFloat(node.X);
        const ny = parseFloat(node.Y);
        if (Number.isNaN(nx) || Number.isNaN(ny)) continue;
        const mappedY = ih - ny - yOffset;
        ctx.beginPath();
        ctx.arc(nx, mappedY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
      }
    };

    const handleImageError = (err) => {
      console.error('image load error for', backgroundImage, err);
    };

    image.addEventListener('load', handleImageLoad);
    image.addEventListener('error', handleImageError);

    image.src = backgroundImage;

    if (image.complete) {
      setTimeout(() => {
        if (image.width && image.height) {
          console.log('image.complete detected, calling handler manually');
          handleImageLoad();
        } else {
          image.addEventListener('load', handleImageLoad, { once: true });
        }
      }, 0);
    }
  }, [backgroundImage, path, nodes]);

  // Call drawCanvas when both path and nodes are ready
  useEffect(() => {
    console.log('Trigger draw check: path length=', path.length, 'nodes=', nodes.length);
    if (path.length > 0 && nodes.length > 0) {
      drawCanvas();
    }
  }, [nodes, path, backgroundImage, drawCanvas]);

  return (
    <div>
      <h1>Node Network to End Node {endId}</h1>
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default NodeCanvas;