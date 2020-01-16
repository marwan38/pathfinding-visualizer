import { GRID_SIZE } from './constants';

export function drawRect(opts = {}, two) {
    const { x = 0, y = 0, color, size = GRID_SIZE } = opts;
    const rect = two.makeRectangle(x, y, size, size);

    if (color)
        rect.fill = color;
    else
        rect.noFill();

    rect.opacity = 1;
    rect.linewidth = 0.45;

    return rect;
}

export function drawPoint(opts, two) {
    const { x = 0, y = 0, color, size = GRID_SIZE / 2 } = opts;
    const shape = two.makeCircle(x, y, size);

    shape.fill = color;
    shape.opacity = 1;
    shape.linewidth = 0.45;

    return shape;
}

export const randomNumber = (size) => Math.floor(Math.random() * size);
