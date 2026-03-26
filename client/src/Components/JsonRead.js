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
  const [stairsIcon, setStairsIcon] = useState(null);
  const canvasRef = useRef(null);

  // Load stairs icon once
  useEffect(() => {
    const img = new Image();
    img.src = '/stairs_icon.png';
    img.onload = () => {
      console.log('Stairs icon loaded successfully');
      setStairsIcon(img);
    };
    img.onerror = () => console.error('Failed to load stairs_icon.png');
  }, []);

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
          Type: row.Type,
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

  // Helper: generate candidate tokens for a requested room ID.
  // This ensures "33" can match "033" or "0033" if your data uses leading-zero room tokens.
  const roomCandidates = useCallback((raw) => {
    const s = String(raw).trim();
    const set = new Set();
    set.add(s);
    // strip leading zeros and re-add canonical forms
    const stripped = s.replace(/^0+/, '') || '0';
    set.add(stripped);
    // prefixed single zero (common room token format)
    if (!s.startsWith('0')) set.add('0' + s);
    // pad to 3 digits (if IDs use 3 digits)
    set.add(stripped.padStart(3, '0'));
    // prefixed zero + padded
    set.add('0' + stripped.padStart(3, '0'));
    return Array.from(set);
  }, []);

  // Find a stored path that terminates at target (preferred).
  // This avoids selecting arrays where the target appears in the middle.
  const findStoredPathEndingAtTarget = useCallback((data, target) => {
    if (!data) return null;
    const candidates = roomCandidates(target);
    let found = null;

    function walk(node) {
      if (!node) return false;
      if (Array.isArray(node)) {
        const last = node.length ? String(node[node.length - 1]).trim() : null;
        if (last && candidates.includes(last)) {
          found = node.slice();
          return true;
        }
        // Recurse into nested arrays
        for (const child of node) {
          if (Array.isArray(child) && walk(child)) return true;
        }
      } else if (typeof node === 'object') {
        for (const k of Object.keys(node)) {
          if (walk(node[k])) return true;
        }
      }
      return false;
    }

    walk(data);
    if (found) {
      setPath(found);
      return found;
    }
    return null;
  }, [roomCandidates]);

  // Fallback: if no stored ending-array found, search for arrays that contain a candidate as last,
  // or as a middle element (last resort). This preserves existing behavior as a fallback.
  const findPathFallback = useCallback((data, target) => {
    if (!data) return null;
    const candidates = roomCandidates(target);

    // 1) try exact last-element matches already done by findStoredPathEndingAtTarget
    // 2) fallback: find any array whose last element equals the raw target (already covered)
    // 3) final fallback: find any array that contains the raw or candidate anywhere (legacy)
    function searchAnyContaining(node) {
      if (!node) return null;
      if (Array.isArray(node)) {
        for (const el of node) {
          if (!Array.isArray(el)) {
            const elStr = String(el).trim();
            if (candidates.includes(elStr)) {
              return node.slice();
            }
          } else {
            const recursive = searchAnyContaining(el);
            if (recursive) return recursive;
          }
        }
      } else if (node && typeof node === 'object') {
        for (const k of Object.keys(node)) {
          const r = searchAnyContaining(node[k]);
          if (r) return r;
        }
      }
      return null;
    }

    return searchAnyContaining(data);
  }, [roomCandidates]);

  // Trigger search when connections and endId are available.
  useEffect(() => {
    if (endId === "0" || endId === 0) {
      // special-case start node: only highlight itself, no lines
      setPath(["0"]);
      return;
    }

    if (!endId) {
      console.log('No endId set yet.');
      return;
    }
    if (!connections || (Array.isArray(connections) && connections.length === 0)) {
      console.log('Waiting for connections to load...');
      return;
    }

    const raw = String(endId);
    console.log('Searching for target (raw):', raw);

    // First prefer stored paths that end exactly at the destination (or its canonical variants)
    const primary = findStoredPathEndingAtTarget(connections, raw);
    if (primary) {
      console.log('Found stored path that ends at target for', raw, 'path length', primary.length);
      return;
    }

    // Fallback: try looser matches
    const fallback = findPathFallback(connections, raw);
    if (fallback) {
      console.log('Fallback found a path containing target (not as last element). Using it temporarily. path length', fallback.length);
      setPath(fallback);
      return;
    }

    console.log('No path found for target', raw);
    setPath([]);
  }, [endId, connections, findStoredPathEndingAtTarget, findPathFallback]);

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

      // Let CSS scale the canvas by width while keeping coordinate system in native pixels
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
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

      // Build node lookup for fast access
      const nodeMap = new Map(nodes.map(n => [String(n.ID).trim(), n]));

      // Draw lines only if path is valid
      if (Array.isArray(path) && path.length > 1) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        for (let i = 0; i < path.length - 1; i++) {
          const startNode = nodeMap.get(String(path[i]).trim());
          const endNode = nodeMap.get(String(path[i + 1]).trim());
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
      }

      // Draw nodes for the path (no numeric labels)
      for (const nodeId of path) {
        const node = nodeMap.get(String(nodeId).trim());
        if (!node) continue;
        const nx = parseFloat(node.X);
        const ny = parseFloat(node.Y);
        if (Number.isNaN(nx) || Number.isNaN(ny)) continue;
        const mappedY = ih - ny - yOffset;
        
        // Only draw green circle at node #0 (first node)
        if (String(nodeId) === '0') {
          ctx.beginPath();
          ctx.arc(nx, mappedY, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'green';
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.closePath();
        }
        
        // Draw stairs icon if node type is "St" and icon is loaded
        if (node.Type === 'St' && stairsIcon) {
          ctx.drawImage(stairsIcon, nx - 24, mappedY - 22, 50, 50);
        }
      }
    };

    const handleImageError = (err) => {
      console.error('image load error for', backgroundImage, err);
    };

    image.addEventListener('load', handleImageLoad, { once: true });
    image.addEventListener('error', handleImageError, { once: true });

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
  }, [backgroundImage, path, nodes, stairsIcon]);

  // Call drawCanvas when both path and nodes are ready
  useEffect(() => {
    console.log('Trigger draw check: path length=', path.length, 'nodes=', nodes.length);
    if (path.length > 0 && nodes.length > 0) {
      drawCanvas();
    }
  }, [nodes, path, backgroundImage, drawCanvas]);

  return (
  <canvas ref={canvasRef} />
);
};

export default NodeCanvas;