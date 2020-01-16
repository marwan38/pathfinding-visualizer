This project was inspired by [Clément Mihailescu's path finding visualizer](https://github.com/clementmihailescu/Pathfinding-Visualizer).

# Pathfinding Visualizer

I made this because I watched a video of Clement doing it and thought it's a great idea to try and re-create it with what I've learned
about drawing using Javascript's canvas/webgl. Although I later switched to rendering in SVG (Two.js is a high level api that can draw in canvas, webgl, or svg)
due to performance issues. The point of this project wasn't to optimize it for performance, but rather in drawing and writing out the algorithms.
The AStar algorithm was written by myself after reading a few articles online. It's almost accurate. See if you can figure out what's the missing small detail
in it's implementation ;).

This works both in web and on mobile.

## Libraries used

- [Two.js](https://two.js.org/) A two-dimensional drawing api
- [RBush](https://github.com/mourner/rbush) - A high-performance JavaScript library for 2D spatial indexing of points and rectangles

