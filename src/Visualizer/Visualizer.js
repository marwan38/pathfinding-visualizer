import React, { useEffect, useState, useRef } from 'react';
import './Visualizer.scss';
import Two from 'two.js';
import { useMachine } from '@xstate/react';

import machine from './machine';
import { dijkstra, getNodesInShortestPathOrder, aStar } from './algorithm';
import { START_NODE_COLOR, END_NODE_COLOR, GRID_SIZE, PATH_COLOR, algorithms } from './constants';
import { Grid, GridNode, withGraphic } from './grid';
import {
    drawRect,
    drawPoint,
    randomNumber
} from './helpers';
import { RTree } from './rtree';

// Stuff that don't belong inside the component
let two, rtree, grid;
function setupTwoJs(canvasRef) {
    if (two)
        return two;

    two = new Two({ type: Two.Types.svg });
    two.appendTo(canvasRef);
}
function getDimensions(ref) {
    const width = ref.clientWidth;
    const height = ref.clientHeight;
    return { width, height };
}
function resizeCanvas(ref) {
    const { width, height } = getDimensions(ref);

    two.width = width;
    two.height = height;
}
function setupGrid(ref) {
    const { width, height } = getDimensions(ref);
    const GRID_ROWS = height / GRID_SIZE;
    const GRID_COLUMNS = width / GRID_SIZE;

    grid = Grid(GRID_ROWS, GRID_COLUMNS, GRID_SIZE, two);
    return { rows: GRID_ROWS, columns: GRID_COLUMNS };
}
function drawGrid(columns, rows, ref) {
    const halfGrid = GRID_SIZE / 2;
    const { y: offsetY } = ref.getBoundingClientRect();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = halfGrid + (col * GRID_SIZE);
            const y = offsetY + halfGrid + (row * GRID_SIZE);
            const x1 = x - halfGrid;
            const y1 = y - halfGrid;
            const x2 = x + halfGrid;
            const y2 = y + halfGrid;
            const opts = {
                position: { col, row }
            };
            rtree.insert(x1, y1, x2, y2, opts);

            const node = withGraphic(GridNode(col, row, GRID_SIZE, two), two);
            grid.add(col, row, node);
        }
    }
}
function randomizeStartingUnits() {
    const { grid: mappedGrid } = grid;

    const rowl = mappedGrid.length - 1;
    const coll = mappedGrid[0].length - 1;
    let start = mappedGrid[randomNumber(rowl)][randomNumber(coll)];
    let end = mappedGrid[randomNumber(rowl)][randomNumber(coll)];

    // Make sure we're not on the same spot
    while (start === end) {
        start = mappedGrid[randomNumber(rowl)][randomNumber(coll)];
    }

    placePremadeUnit(getUnit('Starting node'), start);
    placePremadeUnit(getUnit('End node'), end);
}
function onWindowResize() {
    // For this project, this is fine
    // otherwise we want to actually re-draw the grid and units
    window.location.reload();
}
function placePremadeUnit(unit, targetNode) {
    unit.mesh.opacity = 1.0;
    unit.mesh.translation.copy(targetNode.translation);
    unit.prevLocation = unit.location;
    unit.location = targetNode.position;
    targetNode.empty = false;
}
function getRectByVec2(x, y) {
    const inBounds = rtree.searchTree(x, y);

    if (!!inBounds.length) {
        const inBoundsRect = grid.get(inBounds[0].position);
        return inBoundsRect;
    }

    return null;
}
const getUnit = (id) => premadeUnits.find(u => u.id === id);


const premadeUnits = [{
    id: 'Starting node',
    color: START_NODE_COLOR,
    type: 'circle',
    isSingular: true,
    location: null,
    prevLocation: null,
    mesh: null
}, {
    id: 'End node',
    color: END_NODE_COLOR,
    type: 'circle',
    isSingular: true,
    location: null,
    prevLocation: null,
    mesh: null
}, {
    id: 'Wall',
    color: '#040000',
    type: 'rect',
    isSingular: false,
    location: null,
    prevLocation: null,
    mesh: null
}];



const Visualizer = () => {
    const canvasContainerRef = useRef(null);
    const [isMouseDown, setMouseDown] = useState(false);
    const [animSpeed, setAnimSpeed] = useState(7.5);
    const [current, send] = useMachine(machine);

    // Mouse stuff
    const getMouseCoords = (e) => {
        if (!rtree) return;
        const x = e.pageX;
        const y = e.pageY;
        return { x, y };
    }

    const mouseMove = (e) => {
        if (!current.matches('drawing'))
            return;

        const { x, y } = getMouseCoords(e);
        const node = getRectByVec2(x, y);

        if (node) {
            const premadeUnit = getUnit(current.context.activeSelection?.id);

            if (premadeUnit) {
                premadeUnit.mesh.opacity = 0.2;
                premadeUnit.mesh.translation.copy(node.translation);
            }

            if (isMouseDown) {
                // Just call the mousedown function.. it does what we want
                mouseDown(e);
            }
        }
    }

    const mouseUp = () => {
        // Set mouse down for hold clicks
        setMouseDown(false);
    }

    const mouseDown = (e) => {
        if (!current.matches('drawing'))
            return;

        const { x, y } = getMouseCoords(e);

        const node = getRectByVec2(x, y);

        if (!node)
            return;

        const premadeUnit = getUnit(current.context.activeSelection.id);
        const gridUnit = grid.get(node.position);

        if (!premadeUnit.isSingular) {

            gridUnit.makeWall();
            // gridUnit.isWall = true;
            resetUnit(current.context.activeSelection.id);

        } else {

            placePremadeUnit(premadeUnit, gridUnit);
            gridUnit.empty = false;
        }

        send('DROP');

        // Set mouse down for hold clicks
        setMouseDown(true);
    }

    function selectUnitAndBeginDrawing(activeSelection) {
        // If already in drawing means we're cancelling selection
        if (current.matches("drawing")) {
            activeSelection.prevLocation = activeSelection.location;
            send('IDLE');
            return;
        }
        send('DRAW');
        resetUnit(activeSelection.id);
        send('SELECT', { activeSelection });
    }

    function selectAlgorithm(selectedAlgorithm) {
        send('SELECT_ALGORITHM', { selectedAlgorithm });
    }

    function resetUnit(id) {
        if (!id || !current.matches('drawing'))
            return;

        const { mesh } = getUnit(id);
        mesh.translation.set(-100, -100);
        mesh.location = null;
    }

    // Algorithm related stuff
    // Drawing
    function drawPath(nodesInShortestPath) {
        for (let i = 0; i <= nodesInShortestPath.length; i++) {
            if (i === nodesInShortestPath.length) {
                send('RESET');
                return;
            }
            const node = nodesInShortestPath[i];
            setTimeout(() => {
                node.finderNode.fill = PATH_COLOR;
            }, 35 * i);
        }
    }
    function drawFailedUnits(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].panic();
        }
    }
    function visualizeAlgorithm(visitedNodesInOrder, nodesInShortestPath) {
        const hasFailed = nodesInShortestPath.length <= 1;

        for (let i = 0; i <= visitedNodesInOrder.length; i++) {
            const node = visitedNodesInOrder[i];

            // Finished loop
            if (i === visitedNodesInOrder.length) {

                setTimeout(() => {

                    drawPath(nodesInShortestPath);

                    if (hasFailed) {

                        drawFailedUnits(visitedNodesInOrder);

                    }

                }, animSpeed * i);

            } else {

                setTimeout(() => {
                    const f = node.anim();
                }, animSpeed * i);

            }

        }

    }
    // Algo
    function startAlgorithm() {
        send('START');

        const startNode = grid.get(premadeUnits[0].location);
        const finishNode = grid.get(premadeUnits[1].location);

        let visitedNodesInOrder = [];
        if (current.context.selectedAlgorithm === algorithms[0]) {
            visitedNodesInOrder = dijkstra(grid.grid, startNode, finishNode);
        } else if (current.context.selectedAlgorithm === algorithms[1])
            visitedNodesInOrder = aStar(grid.grid, startNode, finishNode);

        const nodesInShortestPath = getNodesInShortestPathOrder(finishNode);
        visualizeAlgorithm(visitedNodesInOrder, nodesInShortestPath);
    }


    // UI related functions
    function reset() {
        const rows = grid.grid;
        rows.forEach(col => {
            col.forEach(node => node.reset())
        });
        randomizeStartingUnits();
        send('RESET');
    }
    function randomizeWalls() {
        const rows = grid.grid;
        rows.forEach(col => {
            col.forEach(node => {
                if (Math.random() < 0.1 && node.empty)
                    node.makeWall();
            })
        })
    }

    useEffect(() => {
        const ref = canvasContainerRef.current;
        setupTwoJs(ref);
        const { columns, rows } = setupGrid(ref);
        resizeCanvas(ref);

        rtree = RTree();

        drawGrid(columns, rows, ref);
        // Start rendering
        two.play();
        // Instantiate units
        premadeUnits.forEach((unit, i) => {
            const opts = { x: -100, y: -100, color: unit.color };
            premadeUnits[i].mesh = unit.type === 'rect' ? drawRect(opts, two) : drawPoint(opts, two);
        });
        // Makeit easier for the user by randomizing start and end
        randomizeStartingUnits();
        // Resizer listener
        window.addEventListener('resize', onWindowResize);

        return function cleanup() {
            window.removeEventListener('resize', onWindowResize);
        }
    }, []);

    return (
        <>
            <div id="actions" className="container is-fluid has-background-light box is-marginless">
                <div className="columns is-desktop container is-fullhd">
                    <div className="column has-text-centered buttons is-marginless">
                        <div className="dropdown is-hoverable">
                            <div className="dropdown-trigger">
                                <button className="button" aria-haspopup="true" aria-controls="dropdown-menu4">
                                    <span>{current.context.selectedAlgorithm ? current.context.selectedAlgorithm : 'Pick an algorithm'}</span>
                                    <span className="icon is-small">
                                        <i className="fas fa-angle-down" aria-hidden="true"></i>
                                    </span>
                                </button>
                            </div>
                            <div className="dropdown-menu" id="dropdown-menu4" role="menu">
                                <div className="dropdown-content">
                                    {
                                        algorithms.map(a =>
                                            // eslint-disable-next-line
                                            <a key={a} onClick={() => selectAlgorithm(a)} href="#" className="dropdown-item">
                                                {a}
                                            </a>

                                        )
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="dropdown is-hoverable">
                            <div className="dropdown-trigger">
                                <button className="button" aria-haspopup="true" aria-controls="dropdown-menu4">
                                    <span>{animSpeed === 7.5 ? 'Fast' : 'Slow'}</span>
                                    <span className="icon is-small">
                                        <i className="fas fa-angle-down" aria-hidden="true"></i>
                                    </span>
                                </button>
                            </div>
                            <div className="dropdown-menu" id="dropdown-menu5" role="menu">
                                <div className="dropdown-content">
                                    {/* eslint-disable-next-line */}
                                    <a onClick={() => setAnimSpeed(7.5)} className="dropdown-item">
                                        Fast
                                    </a>
                                    {/* eslint-disable-next-line */}
                                    <a onClick={() => setAnimSpeed(40)} className="dropdown-item">
                                        Slow
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="column has-text-centered buttons is-marginless">

                        {
                            premadeUnits.map(n =>
                                <button
                                    key={n.id + Math.random()}
                                    onClick={() => selectUnitAndBeginDrawing(n)}
                                    className={`button is-outlined ${current.context.activeSelection?.id === n.id ? 'is-active' : ''}`}
                                    disabled={current.matches("pathfinding")}>
                                    {n.id}
                                </button>
                            )

                        }
                    </div>
                    <div className="column has-text-centered buttons is-marginless">

                        <button
                            onClick={() => randomizeWalls()}
                            className={`button is-outlined`}
                            disabled={current.matches("pathfinding")}
                        >
                            Randomize walls
                            </button>
                        <button
                            onClick={startAlgorithm}
                            className={`button is-primary ${current.matches("pathfinding") && 'is-loading'}`}
                            disabled={current.matches("pathfinding")}
                        >
                            Start
                            </button>
                        <button
                            onClick={reset}
                            className={`button is-info`}
                            disabled={current.matches("pathfinding")}
                        >
                            Reset
                            </button>
                    </div>
                </div>
            </div>
            <div id="canvas"
                ref={canvasContainerRef}
                onMouseMove={mouseMove}
                onMouseDown={mouseDown}
                onMouseUp={mouseUp}
                onTouchMove={mouseMove}
                onTouchStart={mouseDown}
                onTouchEnd={mouseUp}
                onMouseLeave={() => resetUnit(current.context.activeSelection?.id)}></div>
        </>
    );

}

export default Visualizer;

