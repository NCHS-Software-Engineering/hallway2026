import React, { useEffect, useRef, useState, useCallback } from 'react';
import Papa from 'papaparse';

const NodeCanvas = ({
  src = '/finalFilter.json',
  csvSrc = '/p1.csv',
  backgroundImage = '',
  endId = "",
  canvasScale = 1,
  canvasOffsetX = 0,
  canvasOffsetY = 0
}) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [path, setPath] = useState([]);
  const [specialLocations, setSpecialLocations] = useState([]);
  const [specialLocationIcons, setSpecialLocationIcons] = useState({});
  const [revealedSpecialIds, setRevealedSpecialIds] = useState(() => new Set());
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const canvasRef = useRef(null);
  const specialHitAreasRef = useRef([]);

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

  // Load important waypoint definitions (nurse office database for now)
  useEffect(() => {
    fetch('/specialLocations.json')
      .then((res) => {
        if (!res.ok) throw new Error('Special locations fetch failed');
        return res.json();
      })
      .then((json) => {
        setSpecialLocations((json && Array.isArray(json.specialLocations)) ? json.specialLocations : []);
      })
      .catch((err) => {
        console.error('Error loading specialLocations.json:', err);
        setSpecialLocations([]);
      });
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const iconSources = Array.from(new Set(
      specialLocations
        .map((special) => special && special.icon)
        .filter(Boolean)
    ));

    if (iconSources.length === 0) {
      setSpecialLocationIcons({});
      return undefined;
    }

    iconSources.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        if (isCancelled) return;
        setSpecialLocationIcons((prev) => ({
          ...prev,
          [src]: img,
        }));
      };
      img.onerror = () => {
        console.error('Failed to load special location icon:', src);
      };
      img.src = src;
    });

    return () => {
      isCancelled = true;
    };
  }, [specialLocations]);

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

  // Helper: generate candidate tokens for a requested room ID.
  const roomCandidates = useCallback((raw) => {
    const s = String(raw).trim();
    const set = new Set();
    set.add(s);
    const stripped = s.replace(/^0+/, '') || '0';
    set.add(stripped);
    if (!s.startsWith('0')) set.add('0' + s);
    set.add(stripped.padStart(3, '0'));
    set.add('0' + stripped.padStart(3, '0'));
    return Array.from(set);
  }, []);

  // Find a stored path that terminates at target (preferred).
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

  // Fallback search
  const findPathFallback = useCallback((data, target) => {
    if (!data) return null;
    const candidates = roomCandidates(target);

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

    const primary = findStoredPathEndingAtTarget(connections, raw);
    if (primary) {
      console.log('Found stored path that ends at target for', raw, 'path length', primary.length);
      return;
    }

    const fallback = findPathFallback(connections, raw);
    if (fallback) {
      console.log('Fallback found a path containing target (not as last element). Using it temporarily. path length', fallback.length);
      setPath(fallback);
      return;
    }

    console.log('No path found for target', raw);
    setPath([]);
  }, [endId, connections, findStoredPathEndingAtTarget, findPathFallback]);

  // Reset revealed labels whenever the route/path changes
  useEffect(() => {
    setRevealedSpecialIds(new Set());
  }, [path]);

  // Draw canvas (robust: attach handlers before src, handle cached images)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const image = new Image();

    console.log('drawCanvas start, backgroundImage =', backgroundImage);

    const handleImageLoad = () => {
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

      const yOffset = 0;
      const nodeMap = new Map(nodes.map(n => [String(n.ID).trim(), n]));

      // Draw lines
      if (Array.isArray(path) && path.length > 1) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
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
        ctx.beginPath();
        ctx.arc(nx, mappedY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
      }

      // Draw special waypoint markers (nurse office, etc.)
      specialHitAreasRef.current = [];
      if (specialLocations.length > 0) {
        const specialByNodeId = new Map();
        specialLocations.forEach((s) => {
          const nodeIds = Array.isArray(s.nodeIds) ? s.nodeIds : (s.id ? [s.id] : []);
          nodeIds.forEach((nodeId) => {
            const key = String(nodeId).trim();
            if (!specialByNodeId.has(key)) specialByNodeId.set(key, []);
            specialByNodeId.get(key).push(s);
          });
        });

        const drawnSpecialIds = new Set();

        for (const nodeId of path) {
          const key = String(nodeId).trim();
          const specials = specialByNodeId.get(key);
          if (!specials) continue;

          const node = nodeMap.get(key);
          if (!node) continue;

          const nx = parseFloat(node.X);
          const ny = parseFloat(node.Y);
          if (Number.isNaN(nx) || Number.isNaN(ny)) continue;

          const mappedY = ih - ny - yOffset;

          specials.forEach((special) => {
            const specialUniqueId = special.id || `${special.name}-${key}`;
            if (drawnSpecialIds.has(specialUniqueId)) return;
            drawnSpecialIds.add(specialUniqueId);

            const iconSrc = special.icon;
            const icon = iconSrc ? specialLocationIcons[iconSrc] : null;
            const markerRadius = 20;
            specialHitAreasRef.current.push({
              id: specialUniqueId,
              x: nx,
              y: mappedY,
              radius: markerRadius + 8,
            });

            // Always draw the waypoint icon marker
            ctx.beginPath();
            ctx.arc(nx, mappedY, markerRadius, 0, Math.PI * 2);
            ctx.fillStyle = /*special.color ||*/ '#dddddd';
            ctx.fill();
            ctx.strokeStyle = special.borderColor || '#000000';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();

            if (icon) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(nx, mappedY, markerRadius - 2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(icon, nx - 22, mappedY - 22, 44, 44);
              ctx.restore();
            }

            // Only reveal label after user clicks/taps icon
            if (revealedSpecialIds.has(specialUniqueId)) {
              const labelText = special.name || 'Waypoint';
              const labelX = nx + 26;
              const labelY = mappedY - 15;
              const labelPaddingX = 10;
              const labelPaddingY = 6;

              ctx.font = 'bold 25px Arial';
              const labelWidth = ctx.measureText(labelText).width;

              ctx.fillStyle = '#aaaaaa';
              ctx.fillRect(
                labelX - labelPaddingX,
                labelY - 25 - labelPaddingY,
                labelWidth + labelPaddingX * 2,
                25 + labelPaddingY * 2
              );

              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.strokeRect(
                labelX - labelPaddingX,
                labelY - 25 - labelPaddingY,
                labelWidth + labelPaddingX * 2,
                25 + labelPaddingY * 2
              );

              ctx.fillStyle = '#000000';
              ctx.fillText(labelText, labelX, labelY);
            }
          });
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
          handleImageLoad();
        } else {
          image.addEventListener('load', handleImageLoad, { once: true });
        }
      }, 0);
    }
  }, [backgroundImage, path, nodes, stairsIcon, specialLocationIcons, revealedSpecialIds]);

  const revealSpecialAtPoint = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const logicalWidth = canvas.width / (window.devicePixelRatio || 1);
    const logicalHeight = canvas.height / (window.devicePixelRatio || 1);
    const x = (clientX - rect.left) * (logicalWidth / rect.width);
    const y = (clientY - rect.top) * (logicalHeight / rect.height);

    const hit = specialHitAreasRef.current.find((area) => {
      const dx = x - area.x;
      const dy = y - area.y;
      return (dx * dx + dy * dy) <= (area.radius * area.radius);
    });

    if (!hit) {
      setRevealedSpecialIds((prev) => {
        if (prev.size === 0) return prev;
        return new Set();
      });
      return;
    }

    setRevealedSpecialIds((prev) => {
      if (prev.has(hit.id)) return prev;
      const next = new Set(prev);
      next.add(hit.id);
      return next;
    });
  }, []);

  const handleCanvasClick = useCallback((event) => {
    revealSpecialAtPoint(event.clientX, event.clientY);
  }, [revealSpecialAtPoint]);

  const handleCanvasTouchStart = useCallback((event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    revealSpecialAtPoint(touch.clientX, touch.clientY);
  }, [revealSpecialAtPoint]);

  // Call drawCanvas when both path and nodes are ready
  useEffect(() => {
    if (path.length > 0 && nodes.length > 0) {
      drawCanvas();
    }
  }, [nodes, path, backgroundImage, drawCanvas]);

  return (
  <canvas
    ref={canvasRef}
    onClick={handleCanvasClick}
    onTouchStart={handleCanvasTouchStart}
    style={{ touchAction: 'manipulation' }}
  />
);
};

export default NodeCanvas;