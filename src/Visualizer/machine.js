
import { Machine, assign, send } from 'xstate';

export default Machine(
    {
        id: 'machine',
        initial: 'idle',
        context: {
            activeSelection: null,
            selectedAlgorithm: null
        },
        states: {
            idle: {
                on: {
                    DRAW: 'drawing',
                    START: 'pathfinding',
                    SELECT_ALGORITHM: {
                        actions: 'selectedAlgorithm'
                    }
                }
            },
            drawing: {
                on: {
                    START: {
                        target: 'pathfinding',
                        cond: 'canStart'
                    },
                    SELECT_ALGORITHM: {
                        actions: ['selectedAlgorithm', 'idle']
                    },
                    SELECT: {
                        actions: assign({
                            activeSelection: (ctx, { activeSelection }) => {
                                const isSame = ctx.activeSelection === activeSelection;
                                return isSame ? null : activeSelection;
                            }
                        })
                    },
                    DROP: {
                        actions: [
                            assign({
                                activeSelection: (ctx) => ctx.activeSelection?.isSingular ? null : ctx.activeSelection
                            }),
                            'idle'],
                        cond: 'isSingular'
                    },
                    IDLE: {
                        target: '#machine.idle',
                        actions: assign({
                            activeSelection: () => null
                        })
                    }
                }
            },
            pathfinding: {
                on: { RESET: 'idle' }
            }
        }
    },
    {
        actions: {
            selectedAlgorithm: assign({
                selectedAlgorithm: (ctx, { selectedAlgorithm }) => {
                    return selectedAlgorithm || ctx.selectedAlgorithm;
                }
            }),
            idle: send('IDLE')
        },
        guards: {
            isSingular: (ctx, _event) => ctx.activeSelection && ctx.activeSelection.isSingular,
            canStart: (ctx, _event) => ctx.activeSelection && ctx.selectedAlgorithm
        }
    }
);