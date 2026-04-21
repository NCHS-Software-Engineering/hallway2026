const fs = require('fs');
const path = require('path');

// Find the correct public directory whether we are in the root folder or the 'client' folder
const publicDir = fs.existsSync(path.join(__dirname, 'public')) 
  ? path.join(__dirname, 'public') 
  : path.join(__dirname, 'client', 'public');

function buildGraph(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const graph = {};
  const destinations = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;

    const id = parts[0].trim();
    const type = parts[1].trim();
    const numConnections = parseInt(parts[4].trim(), 10);
    const neighbors = [];
    
    for(let j = 0; j < numConnections; j++) {
        if(parts[5 + j]) neighbors.push(parts[5 + j].trim());
    }

    graph[id] = neighbors;

    // Filter for actual final rooms (Types that start with a '0' ID or are classes/destinations)
    if (id.startsWith('0') && type === 'C') {
      destinations.push(id);
    }
  }
  return { graph, destinations };
}

function findShortestPath(graph, startNode, targetNode) {
  const queue = [[startNode]];
  const visited = new Set([startNode]);

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const currentNode = currentPath[currentPath.length - 1];

    if (currentNode === targetNode) return currentPath;

    const neighbors = graph[currentNode] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...currentPath, neighbor]);
      }
    }
  }
  return null;
}

function generateAllPaths() {
  console.log(`Looking for CSV files in: ${publicDir}`);
  const allPaths = [];
  
  // Floor 1 (Start node: "0")
  try {
    const p1Raw = fs.readFileSync(path.join(publicDir, 'p1.csv'), 'utf8');
    const floor1 = buildGraph(p1Raw);
    const floor1Paths = [];
    floor1.destinations.forEach(dest => {
      const p = findShortestPath(floor1.graph, "0", dest);
      if (p) floor1Paths.push(p);
    });
    console.log(`Generated ${floor1Paths.length} routes for Floor 1.`);
    allPaths.push(floor1Paths);
  } catch(e) { console.error("Could not read p1.csv"); }

  // Floor 2 (Start node: "21")
  try {
    const p2Raw = fs.readFileSync(path.join(publicDir, 'p2.csv'), 'utf8');
    const floor2 = buildGraph(p2Raw);
    const floor2Paths = [];
    floor2.destinations.forEach(dest => {
      const p = findShortestPath(floor2.graph, "21", dest);
      if (p) floor2Paths.push(p);
    });
    console.log(`Generated ${floor2Paths.length} routes for Floor 2.`);
    allPaths.push(floor2Paths);
  } catch(e) { console.error("Could not read p2.csv"); }

  // Floor 3 (Start node: "36")
  try {
    const p3Raw = fs.readFileSync(path.join(publicDir, 'p3.csv'), 'utf8');
    const floor3 = buildGraph(p3Raw);
    const floor3Paths = [];
    floor3.destinations.forEach(dest => {
      const p = findShortestPath(floor3.graph, "36", dest);
      if (p) floor3Paths.push(p);
    });
    console.log(`Generated ${floor3Paths.length} routes for Floor 3.`);
    allPaths.push(floor3Paths);
  } catch(e) { console.error("Could not read p3.csv"); }

  // Write to finalFilter.json
  const finalJson = { connections: allPaths };
  const targetPath = path.join(publicDir, 'finalFilter.json');
  fs.writeFileSync(targetPath, JSON.stringify(finalJson, null, 2));
  console.log(`\nSUCCESS! Wrote ${allPaths.flat().length} total paths to: ${targetPath}`);
}

generateAllPaths();