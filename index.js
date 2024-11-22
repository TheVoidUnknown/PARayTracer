import LevelHandler from './src/classes/LevelHandler.js';
import Buffer from './src/classes/Buffer.js';
import { Animator } from './src/classes/Animation.js';
import renderSingleThreaded from './renderSingleThread.js';

const rayTracerOptions = {
    maxReflections: 5,
    simulationRate: 60 // Changing this will break a lot of things
};

const bufferOptions = {
    bufferPrecision: 0.1,
    bufferPixelBlur: 4
}

const handler = new LevelHandler();
handler.readLevel(); // Get the level and its contents
handler.writeBackup(); // Can't ever be too careful
let objects = handler.level.objects;

//level.prefabs = []; // Delete all prefabs

const animator = new Animator(objects) // Create a new animation constructor to simulate the game's objects
const buffer = new Buffer(bufferOptions) // Create the buffer manager

const startTime = 5 // Timestamp to start rendering, in seconds
const endTime = 5.5 // Timestamp to stop rendering

buffer.createBuffer(); // Make the pixel buffer



renderSingleThreaded( // single-threaded magic
    buffer, 
    animator, 
    handler,
    rayTracerOptions, 
    startTime, 
    endTime
);