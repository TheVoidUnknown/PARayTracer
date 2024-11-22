import RayMarcher from './src/classes/RayMarcher.js';
import {
    LightSource,
    PointLightSource,
    ConeLightSource,
    LaserLightSource
} from './src/classes/LightSource.js';

/**
 * @typedef {import('./src/classes/Buffer.js').default} Buffer
 * @typedef {import('./src/classes/Animation.js').Animator} Animator
 * @typedef {import('./src/classes/LevelHandler.js').default} LevelHandler
 */

/**
 * Extremely slowly render a level with the given parameters
 * 
 * @param {Buffer} Buffer 
 * @param {Animator} Animator 
 * @param {LevelHandler} LevelHandler 
 * @param {Object} rayTracerOptions 
 * @param {number} startTime 
 * @param {number} endTime 
 * 
 * @returns {void}
 */
function renderSingleThreaded(Buffer, Animator, LevelHandler, rayTracerOptions, startTime, endTime) {
    const lights = {} // Define the list of light sources
    for (const key in Animator.lightSources) { // For every light source the Animator has identified
        const light = Animator.lightSources[key] // Get the light source for this iteration

        switch (true) {
            case /cone/g.test(light.name): // If the pa object name contains "cone", make it a cone source
                lights[light.id] = new ConeLightSource()
                lights[light.id].name = light.name
            break;

            case /point/g.test(light.name): // If the pa object name contains "point", make it a point source
                lights[light.id] = new PointLightSource()
                lights[light.id].name = light.name
            break;

            case /laser/g.test(light.name): // If the pa object name contains "laser", make it a laser source
                lights[light.id] = new LaserLightSource()
                lights[light.id].name = light.name
            break;

            default: // If the pa object doesnt have any of these, default to generic light source
                lights[light.id] = new LightSource()
                lights[light.id].name = light.name
            break
        }
    }

    const startFrames = startTime * rayTracerOptions.simulationRate;
    const frames = endTime * rayTracerOptions.simulationRate; // How many frames to render, 60 = 1 second
    const framesToRender = frames - startFrames;
    console.warn(`Rendering ${framesToRender} frames`);

    const now = new Date().getTime(); // Get the time before rendering, for satisfying statistics
    let completionPercent = 0;
    let startTimeFrame = Date.now(); // Start time for the first frame

    const raytracer = new RayMarcher(rayTracerOptions) // Create the ray tracing engine
    raytracer.setLightSourcesProperties(lights);

    for (let i = startFrames; i < frames; i++) { // For every frame
        raytracer.scene.frameCount = i; // Increase the frame count
    
        // Set the obstacles that correspond to the level at this point in time
        raytracer.setObstacles(Animator.getAllObstaclesAtTime(i));
    
        // Set the light sources according to this point in time
        raytracer.setLightSources(Animator.getLightVerticesAtTime(i));
        
        const events = raytracer.castRays(raytracer.scene.lightSources); // Simulate the scene we set up
    
        Buffer.handleCollisionEvents(events); // Add collision events to Buffer
        Buffer.setKeyframes(i, rayTracerOptions.simulationRate); // Set the colors of each pixel for this frame
    
        raytracer.clearCollisionRecords(); // Clear collision data so frames dont overlap
    
        // CLI loading bar logic
        const percentDone = Math.round(100 * ((i - startFrames) / (frames - startFrames)));
        if (percentDone > completionPercent) {
            const barLength = 50; // Length of the loading bar
            const filledLength = Math.floor(((percentDone + 1) / 100) * barLength);
            const bar = '='.repeat(filledLength) + ' '.repeat(barLength - filledLength);
            completionPercent = percentDone;
    
            // Calculate elapsed time and ETA
            const elapsedTime = Date.now() - startTimeFrame; // Time taken for the current frame
            const totalElapsedTime = Date.now() - now; // Total time since rendering started
            const estimatedTotalTime = (totalElapsedTime / percentDone) * 100; // Estimate total time
            const eta = estimatedTotalTime - totalElapsedTime; // Remaining time in milliseconds
    
            // Convert ETA to seconds and then to MM:SS format
            const etaSeconds = Math.round(eta / 1000);
            const minutes = Math.floor(etaSeconds / 60);
            const seconds = etaSeconds % 60;
            const etaDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`; // Format as MM:SS
    
            process.stdout.write(`\r                                                                       `);
            process.stdout.write(`\r[${percentDone}% rendered] [${bar}] [ETA: ${etaDisplay}]`);
        }
    
        // Update start time for the next frame
        startTimeFrame = Date.now();
    } // Repeat
    
    // Create new line
    console.log('');

    Buffer.discardEmptyPixels(); // Toss out all the empty pixels (Usually over 80% of them)
    let objects = Buffer.translateBufferToPA(); // Turn all the remaining pixels into PA objects

    let level = LevelHandler.level; // Get the level from LevelHandler

    level.prefabs.push(
        Buffer.packObjectsIntoPrefab(objects)  // Add pixels into the level as a prefab
    );

    LevelHandler.writeLevel(level); // Write the level

    const now2 = new Date().getTime(); // Get the time after this lengthy process
    console.log((now2 - now)/1000, `seconds of runtime.`) // Log runtime
}

export default renderSingleThreaded;