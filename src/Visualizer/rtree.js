import RBush from "rbush";

export function RTree() {
    const rtree = new RBush();

    return {
        insert(x1, y1, x2, y2, opts) {
            rtree.insert({
                minX: x1,
                minY: y1,
                maxX: x2,
                maxY: y2,
                ...opts
            });
        },
        searchTree(x, y) {
            const inBounds = rtree.search(
                {
                    minX: x - 5,
                    minY: y - 5,
                    maxX: x + 5,
                    maxY: y + 5
                }
            )
            return inBounds;
        }
    }
}