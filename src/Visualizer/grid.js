import { GRID_SIZE, FINDER_COLOR, FINDER_FAIL_COLOR } from './constants';
import { drawRect } from './helpers';

export function Grid(rows, cols) {
    const _grid = [];
    for (let r = 0; r < rows; r++) {
        _grid.push([]);
    }

    let _indexCount = 0;

    return {
        get length() {
            return _indexCount;
        },
        get grid() {
            return _grid;
        },
        get(_col, _row) {
            let col = _col, row = _row;
            if (typeof _col === 'object') {
                col = _col.col;
                row = _col.row;
            }
            return _grid[row][col];
        },
        add(col, row, node) {

            _grid[row][col] = node;
        },
    }
}

export function GridNode(col, row) {
    return {
        distance: Infinity,
        // For AStarAlgo
        f: Infinity,
        g: Infinity,
        h: Infinity,
        previousNode: null,
        isVisited: false,
        weight: 0,
        empty: true,
        _reset() {
            this.distance = Infinity;
            this.globalDistance = Infinity;
            this.previousNode = null;
            this.isVisited = false;
            this.weight = 0;
            this.empty = true;
        },
        get id() { return `${col}${row}` },
        get position() { return { col, row } },
    }
}

// Probably doesn't belong in this file but whatever
export function withGraphic(node, two) {
    const { row, col } = node.position;
    const x = col * GRID_SIZE + (GRID_SIZE / 2);
    const y = row * GRID_SIZE + (GRID_SIZE / 2);

    const mesh = drawRect({ x, y }, two);

    // For pathfinding
    const pathfinderRect = drawRect({ x, y, color: FINDER_COLOR, size: 0 }, two);
    pathfinderRect.opacity = 0;
    pathfinderRect.noStroke();

    const anim = () => {
        pathfinderRect.opacity += 1 / GRID_SIZE;
        pathfinderRect.width++;
        pathfinderRect.height++;

        if (pathfinderRect.width >= GRID_SIZE) {
            two.unbind('update', anim);
        }
    }

    const failAnim = () => {
        pathfinderRect.opacity += 0.05;
        if (pathfinderRect.opacity >= 1)
            two.unbind('update', failAnim);
    }

    return Object.assign(node, {
        anim() {
            two.bind('update', anim);
        },
        panic() {
            pathfinderRect.fill = FINDER_FAIL_COLOR;
            pathfinderRect.opacity = 0;
            two.bind('update', failAnim);
        },
        makeWall() {
            pathfinderRect.opacity = 1;
            pathfinderRect.fill = 'black';
            pathfinderRect.width = GRID_SIZE;
            pathfinderRect.height = GRID_SIZE;
            this.weight = 1;
            this.empty = false;
        },
        reset() {
            this._reset();
            pathfinderRect.fill = FINDER_COLOR;
            pathfinderRect.opacity = 0;
            pathfinderRect.width = 0;
            pathfinderRect.height = 0;
        },
        get coords() { return { x, y } },
        get translation() {
            return mesh.translation;
        },
        get finderNode() { return pathfinderRect; }
    });
}
