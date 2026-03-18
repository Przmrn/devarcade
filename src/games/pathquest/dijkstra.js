// dijkstra.js
// Pure Dijkstra implementation.
// Takes a grid, a start node, and an end node.
// Returns the visited nodes IN ORDER — this is what gets animated.

export function runDijkstra(grid, startNode, endNode) {
    const visitedInOrder = []
    startNode.distance = 0

    // Flatten 2D grid into one array — our unvisited set
    const unvisited = grid.flat()

    while (unvisited.length > 0) {
        // Always process the cheapest node next
        unvisited.sort((a, b) => a.distance - b.distance)

        const closest = unvisited.shift()

        // Skip walls entirely
        if (closest.isWall) continue

        // If cheapest node is Infinity, everything left is unreachable
        if (closest.distance === Infinity) return visitedInOrder

        closest.isVisited = true
        visitedInOrder.push(closest)

        // Stop if we reached the destination
        if (closest === endNode) return visitedInOrder

        // Update distances of unvisited neighbours
        updateNeighbours(closest, grid)
    }

    return visitedInOrder
}

function updateNeighbours(node, grid) {
    const { row, col } = node
    const rows = grid.length
    const cols = grid[0].length

    // Only check up, down, left, right — no diagonals
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    for (const [dr, dc] of directions) {
        const r = row + dr
        const c = col + dc

        if (r < 0 || r >= rows || c < 0 || c >= cols) continue

        const neighbour = grid[r][c]
        if (neighbour.isVisited || neighbour.isWall) continue

        // Weight nodes cost 5x more to enter
        const cost = neighbour.isWeight ? 5 : 1
        const newDist = node.distance + cost

        if (newDist < neighbour.distance) {
            neighbour.distance = newDist
            neighbour.previousNode = node
        }
    }
}

// Walk backwards from end node using the previousNode trail
// Returns the path from start → end
export function getShortestPath(endNode) {
    const path = []
    let current = endNode
    while (current !== null) {
        path.unshift(current)
        current = current.previousNode
    }
    return path
}