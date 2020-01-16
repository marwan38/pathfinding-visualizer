// My take on the astar algo.
// It may be slightly inaccurate in terms of implementation
// but it works for the most part
export function aStar(grid, startNode, finishNode) {
  startNode.g = 0;
  startNode.h = heuristic(startNode, finishNode);
  startNode.f = startNode.h;
  
  const visitedNodesInOrder = [];
  let openNodes = [startNode];
  const closedNodes = [];

  let emergency = 0;
  while (!!openNodes.length) {
    emergency++;
    if (emergency >= 5000)
      return visitedNodesInOrder;
    // debugger;
    const current = openNodes.shift();
    closedNodes.push(current);
    visitedNodesInOrder.push(current);

    if (current.id === finishNode.id)
      return visitedNodesInOrder;

    const neighbours = getUnvisitedNeighbors(current, grid);

    for (const neighbour of neighbours) {
      if (neighbour.weight > 0 || closedNodes.some(n => n.id === neighbour.id))
        continue;

        // G is distance from start to this node
        // so always +1
      neighbour.g = current.g + 1;

      const h = heuristic(neighbour, finishNode);
      neighbour.h = h;
      neighbour.f = neighbour.g + h;
      neighbour.previousNode = current;

      if (!openNodes.some(n => n.id === neighbour.id))
        openNodes.push(neighbour);
    }

    sortNodesByF(openNodes);
  }

  return visitedNodesInOrder;
}

function heuristic(nodeA, finishNode) {
  return Math.abs(nodeA.coords.x - finishNode.coords.x) + Math.abs(nodeA.coords.y - finishNode.coords.y);
}

// Source https://github.com/clementmihailescu/Pathfinding-Visualizer-Tutorial/blob/master/src/algorithms/dijkstra.js

// Performs Dijkstra's algorithm; returns *all* nodes in the order
// in which they were visited. Also makes nodes point back to their
// previous node, effectively allowing us to compute the shortest path
// by backtracking from the finish node.
export function dijkstra(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  while (!!unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    // If we encounter a wall, we skip it.
    if (closestNode.weight > 0) continue;
    // If the closest node is at a distance of infinity,
    // we must be trapped and should therefore stop.
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode.id === finishNode.id) return visitedNodesInOrder;
    updateUnvisitedNeighbors(closestNode, grid);
  }
}

function sortNodesByDistance(unvisitedNodes) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function sortNodesByF(unvisitedNodes) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.f - nodeB.f);
}

function updateUnvisitedNeighbors(node, grid) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
  }
}

function getUnvisitedNeighbors(node, grid) {
  const neighbors = [];
  const { col, row } = node.position;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter(neighbor => !neighbor.isVisited);
}

function getAllNodes(grid) {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

// Backtracks from the finishNode to find the shortest path.
// Only works when called *after* the dijkstra method above.
export function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}
