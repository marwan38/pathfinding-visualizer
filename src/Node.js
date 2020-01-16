import React from 'react';
import './App.css';
import Two from 'two.js';

function App({ two, coords, size }) {

    const [x, y] = coords;
    const rect = two.makeRectangle(x, y, size, size);
    rect.fill = 'rgb(255, 255, 255)';
    rect.opacity = 1;
    rect.linewidth = 0.45;
    console.log('run')
    return (
        null
    );
}

export default App;
