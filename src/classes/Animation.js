import  { 
    Shapes, 
    ShapeMap 
} from '../resources/shapes.js';

import { 
    getEaseFunctionOrDefault,
    interpolate 
} from '../resources/easeFunctions.js';



class Shape {
    constructor(vertices, keyframes, id, parentKeyframes, parentId, parentType, startTime) {
        this.id = id
        this.parent = parentId
        this.vertices = vertices.map(vertex => ({ x: vertex.x, y: vertex.y }));
        this.originalVertices = vertices.map(vertex => ({ x: vertex.x, y: vertex.y }));
        this.startTime = startTime
        this.parentType = {
            move: (parentType.split("")[0] == 1 ? true : false),
            scale: (parentType.split("")[1] == 1 ? true : false),
            rotate: (parentType.split("")[2] == 1 ? true : false)
        }
        this.keyframes = {
            move: keyframes[0].k,
            scale: keyframes[1].k,
            rotate: keyframes[2].k,
            color: keyframes[3].k
        }

        this.parentKeyframes = {
            move: parentKeyframes[0].k,
            scale: parentKeyframes[1].k,
            rotate: parentKeyframes[2].k
        }

        this.info = {
            move: [0, 0],
            scale: [1, 1],
            rotate: 0,
            opacity: 100
        }
    }

    move(dx, dy) {
        this.vertices = this.vertices.map(vertex => ({
            x: vertex.x + dx,
            y: vertex.y + dy
        }));
    }

    scale(sx, sy) {
        this.vertices = this.vertices.map(vertex => ({
            x: vertex.x * sx,
            y: vertex.y * sy
        }));
    }

    rotate(angle) {
        const radians = angle * (Math.PI / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        this.vertices = this.vertices.map(vertex => ({
            x: vertex.x * cos - vertex.y * sin,
            y: vertex.x * sin + vertex.y * cos
        }));
    }

    getVertices() {
        return this.vertices;
    }

    resetVertices() {
        this.vertices = this.originalVertices.map(vertex => ({ x: vertex.x, y: vertex.y }));
        this.info = {
            move: [0, 0],
            scale: [1, 1],
            rotate: 0,
            opacity: 0,
            color: 0
        }
    }

    getVerticesAtTime(time) {
        if (time < this.startTime) {
            return { // Make sure this obstacle never sees the light of day
                vertices: [{x:9999, y:9999}],
                move: [0, 0],
                scale: [0, 0],
                rotate: 0,
                opacity: 0,
                color: 0
            }
        }
        time = time - this.startTime
        // Scale Calculation
        let finalScaleX = 1
        let finalScaleY = 1
    
        for (let i = 0; i < this.keyframes.scale.length; i++) {
            const keyframe = this.keyframes.scale[i];
    
            // If the keyframe occurs before or at the current time
            if ((keyframe.t || 0) <= time) {
                // Directly use the keyframe values to set the scale
                finalScaleX = keyframe.ev[0]; // Assuming this is the target scale
                finalScaleY = keyframe.ev[1];
                continue;
            }
    
            // If the keyframe occurs after the current time
            if (i > 0 && keyframe.t > time) {
                const startTime = this.keyframes.scale[i - 1].t || 0;
                const endTime = keyframe.t;
                const percentDone = (time - startTime) / (endTime - startTime);
                const interpolatedScale = [
                    interpolate(this.keyframes.scale[i - 1].ev[0], keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct)),
                    interpolate(this.keyframes.scale[i - 1].ev[1], keyframe.ev[1], percentDone, getEaseFunctionOrDefault(keyframe.ct))
                ];
                
                // Apply the interpolated scale values directly
                finalScaleX = interpolatedScale[0];
                finalScaleY = interpolatedScale[1];
                break; // Find the relevant keyframe and apply
            }
        }
    
        // Apply the scaling based on fresh interpolated values
        this.info.move[0] = finalScaleX
        this.info.move[1] = finalScaleY
        this.scale(finalScaleX, finalScaleY);


        // Rotation Calculation
        let finalRotation = 0
        for (let i = 0; i < this.keyframes.rotate.length; i++) {
            const keyframe = this.keyframes.rotate[i];
            // If the keyframe occurs before or at the current time
            if ((keyframe.t || 0) <= time) {
                finalRotation += keyframe.ev[0]; // Use the keyframe rotation value directly
                continue;
            }
            
            // If the keyframe occurs after the current time
            if (keyframe.t > time && keyframe.t !== undefined) {
                const startTime = this.keyframes.rotate[i - 1].t || 0;
                const endTime = keyframe.t;
                const percentDone = (time - startTime) / (endTime - startTime);
                const interpolatedRotation = interpolate(0 /*this.keyframes.rotate[i - 1].ev[0]*/, keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct));
                finalRotation += interpolatedRotation;
                break; // Find the relevant keyframe and apply
            }
        }

        // Apply the computed rotation to the vertices
        this.info.rotate = finalRotation
        this.rotate(finalRotation);

        // Movement Calculation
        let finalMoveX = 0
        let finalMoveY = 0

        for (let i = 0; i < this.keyframes.move.length; i++) {
            const keyframe = this.keyframes.move[i];

            if (keyframe.t == undefined) { // If this keyframe already passed
                finalMoveX = keyframe.ev[0]; // Apply its movement
                finalMoveY = keyframe.ev[1];
                continue;
            }

            if (keyframe.t > time) { // If this keyframe is already in progress
                var startTime = this.keyframes.move[i - 1].t
                if (startTime === undefined) {
                    startTime = 0;
                }
                const endTime = keyframe.t;
                const percentDone = (time - startTime) / (endTime - startTime);
                const interpolatedMove = [ // Interpolate the remaining distance
                    interpolate(this.keyframes.move[i - 1].ev[0], keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct)),
                    interpolate(this.keyframes.move[i - 1].ev[1], keyframe.ev[1], percentDone, getEaseFunctionOrDefault(keyframe.ct))
                ];

                // Apply the interpolated move values
                finalMoveX = interpolatedMove[0];
                finalMoveY = interpolatedMove[1];
                break; // Break to prevent calcualting irrelevant future keyframes
            }
        }

        // Apply the movement to vertices
        this.info.move[0] = finalMoveX
        this.info.move[1] = finalMoveY
        this.move(finalMoveX, finalMoveY);

        // opacity Calculation, solely for light source brightness
        let finalOpacity = 0
        let finalColor = 0
        for (let i = 0; i < this.keyframes.color.length; i++) {
            const keyframe = this.keyframes.color[i];
            // If the keyframe occurs before or at the current time
            if ((keyframe.t || 0) <= time) {
                finalOpacity = keyframe.ev[1]; // Use the keyframe rotation value directly
                finalColor = keyframe.ev[0]
                continue;
            }
            // If the keyframe occurs after the current time
            if (i > 0 && keyframe.t > time) {
                const startTime = this.keyframes.color[i - 1].t || 0;
                const endTime = keyframe.t;
                const percentDone = (time - startTime) / (endTime - startTime);
                const interpolatedopacity = interpolate(this.keyframes.color[i - 1].ev[1], keyframe.ev[1], percentDone, getEaseFunctionOrDefault(keyframe.ct));
                finalOpacity = interpolatedopacity;
                break; // Find the relevant keyframe and apply
            }
        }
    
        if (this.parent != null) {
            this.simulateParentKeyframes(time)
        }
        return { 
            vertices: this.getVertices(),
            move: [this.info.move[0], this.info.move[1]],
            scale: [this.info.scale[0], this.info.scale[1]],
            rotate: this.info.rotate,
            opacity: finalOpacity,
            color: finalColor
        }
    }

    simulateParentKeyframes(time) { 
        if (this.parentType.scale) {
            // Scale Calculation
            let finalScaleX = 1
            let finalScaleY = 1
        
            for (let i = 0; i < this.parentKeyframes.scale.length; i++) {
                const keyframe = this.parentKeyframes.scale[i];
        
                // If the keyframe occurs before or at the current time
                if ((keyframe.t || 0) <= time) {
                    // Directly use the keyframe values to set the scale
                    finalScaleX = keyframe.ev[0]; // Assuming this is the target scale
                    finalScaleY = keyframe.ev[1];
                    continue;
                }
        
                // If the keyframe occurs after the current time
                if (i > 0 && keyframe.t > time) {
                    const startTime = this.parentKeyframes.scale[i - 1].t || 0;
                    const endTime = keyframe.t;
                    const percentDone = (time - startTime) / (endTime - startTime);
                    const interpolatedScale = [
                        interpolate(this.parentKeyframes.scale[i - 1].ev[0], keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct)),
                        interpolate(this.parentKeyframes.scale[i - 1].ev[1], keyframe.ev[1], percentDone, getEaseFunctionOrDefault(keyframe.ct))
                    ];
                    
                    // Apply the interpolated scale values directly
                    finalScaleX = interpolatedScale[0];
                    finalScaleY = interpolatedScale[1];
                    break; // Find the relevant keyframe and apply
                }
            }
        
            // Apply the scaling based on fresh interpolated values
            this.scale(finalScaleX, finalScaleY);
            this.info.scale[0] *= finalScaleX
            this.info.scale[1] *= finalScaleY
        }

        if (this.parentType.rotate) {
            // Rotation Calculation
            let finalRotation = 0 
            for (let i = 0; i < this.parentKeyframes.rotate.length; i++) {
                const keyframe = this.parentKeyframes.rotate[i];
                // If the keyframe occurs before or at the current time
                if ((keyframe.t || 0) <= time) {
                    finalRotation = keyframe.ev[0]; // Use the keyframe rotation value directly
                }
                // If the keyframe occurs after the current time
                if (i > 0 && keyframe.t > time) {
                    const startTime = this.parentKeyframes.rotate[i - 1].t || 0;
                    const endTime = keyframe.t;
                    const percentDone = (time - startTime) / (endTime - startTime);
                    const interpolatedRotation = interpolate(this.parentKeyframes.rotate[i - 1].ev[0], keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct));
                    finalRotation += interpolatedRotation;
                    break; // Find the relevant keyframe and apply
                }
            }

            // Apply the computed rotation to the vertices
            this.rotate(finalRotation);
            this.info.rotate += finalRotation;
        }

        if (this.parentType.move) {
            // Movement Calculation
            let finalMoveX = 0
            let finalMoveY = 0

            for (let i = 0; i < this.parentKeyframes.move.length; i++) {
                const keyframe = this.parentKeyframes.move[i];
    
                if ((keyframe.t || 0) <= 0 ) { // If this keyframe already passed
                    finalMoveX = keyframe.ev[0]; // Apply its movement
                    finalMoveY = keyframe.ev[1];
                    continue;
                }
    
                if (keyframe.t > time) { // If this keyframe is already in progress
                    var startTime = this.parentKeyframes.move[i - 1].t
                    if (startTime === undefined) {
                        startTime = 0;
                    }
                    const endTime = keyframe.t;
                    const percentDone = (time - startTime) / (endTime - startTime);
                    const interpolatedMove = [ // Interpolate the remaining distance
                        interpolate(this.parentKeyframes.move[i - 1].ev[0], keyframe.ev[0], percentDone, getEaseFunctionOrDefault(keyframe.ct)),
                        interpolate(this.parentKeyframes.move[i - 1].ev[1], keyframe.ev[1], percentDone, getEaseFunctionOrDefault(keyframe.ct))
                    ];
    
                    // Apply the interpolated move values
                    finalMoveX = interpolatedMove[0];
                    finalMoveY = interpolatedMove[1];
                    break; // Break to prevent calcualting irrelevant future keyframes
                }
            }

            // Apply the computed movement to the vertices
            this.move(finalMoveX, finalMoveY);
            this.info.move[0] += finalMoveX
            this.info.move[1] += finalMoveY
        }
    }
}

class Animator {
    constructor(levelObjects) {
        this.levelObjects = levelObjects
        this.shapes = this.createVectorShapes()
        this.lightSources = this.createLightSources()
    }

    createVectorShapes() {
        const shapes = {};
        for (const object of this.levelObjects) {
            if (/SCENE/g.test(object.n)) {
                if (object.s == undefined) {object.s = 0};
                if (object.so == undefined) {object.so = 0};
                
                if (object.s == 4) { break } // fuck text objects

                if (object.p_id !== undefined) { // If the object has a parent
                    const parentObject = this.findObjectWithId(object.p_id) // Find the parent

                    shapes[object.id] = new Shape( // Create the parented shape
                        ShapeMap[object.s][object.so],
                        object.e,
                        object.id,
                        parentObject.e,
                        object.p_id,
                        (object.p_t == undefined ? "101" : object.p_t), // Check for undefined values which means default
                        object.st
                    )
                } else {
                    shapes[object.id] = new Shape( // Otherwise create a shape without parenting data
                        ShapeMap[object.s][object.so],
                        object.e,
                        object.id,
                        [{},{},{},{}],
                        null,
                        "000",
                        object.st
                    )
                }
            }
        }
        if (Object.keys(shapes).length == 0) {console.error(`Animator: No obstacles detected! Label your obstacles objects by putting "SCENE" in all caps at the start of their name.`)};
        console.log(`Animator: Generated ${Object.keys(shapes).length} animated scene shapes`)
        return shapes;
    }

    createLightSources() {
        const lights = {};
        for (const object of this.levelObjects) {
            if (/LIGHT/g.test(object.n)) {
                if (object.p_id !== undefined) { // If the object has a parent
                    const parentObject = this.findObjectWithId(object.p_id) // Find the parent

                    lights[object.id] = new Shape( // Create the parented shape
                        Shapes.Shapes.SquareFilled,
                        object.e,
                        object.id,
                        parentObject.e,
                        object.p_id,
                        (object.p_t == undefined ? "101" : object.p_t), // Check for undefined values which means default
                        object.st
                    )
                    lights[object.id].name = object.n;
                } else {
                    lights[object.id] = new Shape( // Otherwise create a shape without parenting data
                        ShapeMap[object.s || 0][object.so || 0],
                        object.e,
                        object.id,
                        [{},{},{},{}],
                        null,
                        "000",
                        object.st
                    )
                    lights[object.id].name = object.n;
                }
            }
        }
        if (Object.keys(lights).length == 0) {console.error(`No light sources detected! Label your light source objects by putting "LIGHT" in all caps at the start of their name.`)};
        console.log(`Animator: Generated ${Object.keys(lights).length} animated light sources`)
        return lights;
    }

    getAllVerticesAtTime(time) {
        time = time * (1 / 60);
        const vertices = [];
        for (const key in this.shapes) {
            const shape = this.shapes[key];
            shape.resetVertices();
            vertices.push(shape.getVerticesAtTime(time));
        }
        //console.log(vertices)
        return vertices
    }

    getLightVerticesAtTime(time) {
        time = time * (1 / 60);
        const vertices = [];
        for (const key in this.lightSources) {
            const shape = this.lightSources[key];
            shape.resetVertices();
            vertices.push(shape.getVerticesAtTime(time));
        }
        //console.log(vertices)
        return vertices
    }

    convertVerticesToObstacles(events) {
        const obstacles = [];
        for (const positions of events) {
            var i = 0;
            for (const pos of positions.vertices) {
                obstacles.push(
                    {
                        position: {
                            x1: pos.x,
                            y1: pos.y,

                            x2: positions.vertices[i+1] == undefined ? positions.vertices[0].x : positions.vertices[i+1].x,
                            y2: positions.vertices[i+1] == undefined ? positions.vertices[0].y : positions.vertices[i+1].y
                        },
                        opacity: positions.opacity,
                        reflectance: 20,
                        roughness: 0,
                        color: 0
                    }
                )
                i++;
            }
        }
        return obstacles;
    }

    getAllObstaclesAtTime(time) {
        const vertices = this.getAllVerticesAtTime(time);
        const obstacles = this.convertVerticesToObstacles(vertices);
        return obstacles;
    }

    findObjectWithId(id) {
        for (const object of this.levelObjects) {
            if (object.id == id) {
                return object;
            }
        }
        console.warn(`Search for object with id "${id}" failed.`)
        return null;
    }
}

export { 
    Shape,
    Animator
}