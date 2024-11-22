class Buffer {
    constructor(options = {}) {
        this.options = this.initializeOptions(options);
        this.data = {
            values: new Map(),
            keyframes: new Map()
        };
        this.objects = [];
    }

    initializeOptions(options) {
        let bufferPrecision = options.bufferPrecision || 0.4
        let bufferPrecisionMultiplier = (1 / bufferPrecision)
        let bufferWidth = ((options.bufferWidth || 192) * bufferPrecisionMultiplier)
        let bufferHeight = ((options.bufferHeight || 108) * bufferPrecisionMultiplier)
        let bufferPixelBlur = options.bufferPixelBlur || 2
        let spawnTime = 1

        return {
            bufferPrecision: bufferPrecision,
            bufferPrecisionMultiplier: bufferPrecisionMultiplier,
            bufferWidth: bufferWidth,
            bufferHeight: bufferHeight,
            bufferPixelBlur: bufferPixelBlur,
            spawnTime: spawnTime,
            logBufferExceeded: true
        }
    }

    absoluteDistance(x1, y1, x2, y2) {
        return Math.abs(Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1))));
    }

    /**
     * Populates the buffer with initial values and keyframes.
     * @returns {Object} The populated buffer data containing values and keyframes.
     */
    createBuffer() {
        console.warn(`Populating buffer of size ${this.options.bufferWidth}x${this.options.bufferHeight}`);
        for (let x = 0; x < this.options.bufferWidth; x++) {
            for (let y = 0; y < this.options.bufferHeight; y++) {
                const position = this.translateToBufferCoordinates(x, y);

                this.data.values.set(`${x}-${y}`, {
                    0: -1,
                    1: -1,
                    2: -1,
                    3: -1,
                    4: -1,
                    5: -1,
                    6: -1,
                    7: -1,
                    8: -1,
                    position: position
                });
                this.data.keyframes.set(`${x}-${y}`, {
                    0: null,
                    1: null,
                    2: null,
                    3: null,
                    4: null,
                    5: null,
                    6: null,
                    7: null,
                    8: null,
                    position: position
                });
            }
        }
        return this.data;
    }

    /**
     * Retrieves the pixel data at the specified coordinates.
     * @param {number} x - The x-coordinate of the pixel.
     * @param {number} y - The y-coordinate of the pixel.
     * @returns {Object|null} An object containing the pixel values and keyframes, or null if the pixel is out of bounds.
     */
    getPixel(x, y) {
        let pixelX = this.roundToNearest(x * this.options.bufferPrecisionMultiplier, 1);
        let pixelY = this.roundToNearest(y * this.options.bufferPrecisionMultiplier, 1);
        pixelX += (this.options.bufferWidth / 2);
        pixelY += (this.options.bufferHeight / 2);

        if (this.data.values.get(`${pixelX}-${pixelY}`) === undefined) {
            if (this.options.logBufferExceeded) {
                console.warn(`buffer [${pixelX}, ${pixelY}] is null (Ray may have exceeded buffer bounds)`);
            }
            return null;
        }

        return {
            values: this.data.values.get(`${pixelX}-${pixelY}`),
            keyframes: this.data.keyframes.get(`${pixelX}-${pixelY}`)
        };
    }

    /**
     * Retrieves the pixel data at the specified coordinates.
     * @param {string} key - The Map key entry of the pixel
     * @returns {Object|null} An object containing the pixel values and keyframes, or null if the pixel is out of bounds.
     */
    getPixelFromKey(key) {
        if (this.data.values.get(key) === undefined) {
            if (this.options.logBufferExceeded) {
                console.warn(`buffer [${pixelX}, ${pixelY}] is null (Ray may have exceeded buffer bounds)`);
            }
            return null;
        }

        return {
            values: this.data.values.get(key),
            keyframes: this.data.keyframes.get(key)
        };
    }

    /**
     * Adds a specific value for a pixel at the given coordinates, incrementing it by a specified amount.
     * If the pixel does not exist, it returns null.
     * The value is capped at 100.
     *
     * @param {number} x - The x-coordinate of the pixel.
     * @param {number} y - The y-coordinate of the pixel.
     * @param {number} value - The index of the value to set (0-8).
     * @param {number} amount - The amount to increment the value by.
     * @returns {boolean|null} Returns true if the value was successfully set, or null if the pixel does not exist.
     */
    addValue(x, y, value, amount) {
        const pixel = this.getPixel(x, y);
        if (pixel == null) { return null; }
        
        pixel.values[value] = 0; // Reset the value to 0 before incrementing
        pixel.values[value] += amount; // Increment the value by the specified amount
        
        // Cap the value at 100
        if (pixel.values[value] > 100) {
            pixel.values[value] = 100;
        }
        
        return true;
    }

    /**
     * Processes incoming collision data from the RayTracer and sets pixel values appropriately.
     *
     * @param {Set} collisionData - Collision data to be processed
     * @returns {boolean} Returns true
     */
    handleCollisionEvents(collisionData) {
        collisionData.forEach((collision) => {
            this.addValue(collision.position.x, collision.position.y, collision.color, collision.brightness)
        })
        return true;
    }

    /**
     * Rounds a number to the nearest specified precision.
     *
     * @param {number} num - The number to round.
     * @param {number} nearest - The value to round to the nearest multiple of.
     * @returns {number} The rounded number.
     */
    roundToNearest(num, nearest) {
        const remainder = num % nearest;
        if (remainder < nearest / 2) {
            return num - remainder;
        } else {
            return num + (nearest - remainder);
        }
    }

    /**
     * Generates a random string of 10 characters.
     *
     * @returns {string} A random string of 10 characters.
     */
    makeId() {
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890()[]{}/?<>".split("");
        let string = "";
        for (let i = 0; i < 10; i++) {
            string += alphabet[Math.round(Math.random() * (alphabet.length - 1))];
        }
        return string;
    }

    addPoint(x, y, size, parentId, keyframes) {
        this.objects.push(
            {
                "id": this.makeId(),
                "p_id": parentId,
                "p_t": 111,
                "ak_t": 1,
                "ak_o": 0,
                "ot": 5,
                "n": `Pixel | x:${x}, y:${y}`,
                "o": {
                  "x": 0,
                  "y": 0
                },
                "ed":{"l":5},
                "e": [
                  {"k": [{"ev": [x, y]}]},
                  {"k": [{"ev": [size, size]}]},
                  {"k": [{"ev": [0]}]},
                  {"k": keyframes}
                ],
                "st": this.options.spawnTime
            }
        )
    }

    addParent() {
        const id = this.makeId()
        this.objects.push(
            {
                "id": id,
                "ak_t": 2,
                "ak_o": 100,
                "ot": 0,
                "n": `Scene Parent`,
                "o": {
                  "x": 0,
                  "y": 0
                },
                "ed":{"l":0},
                "e": [
                  {"k": [{"ev": [0, 0]}]},
                  {"k": [{"ev": [1, 1]}]},
                  {"k": [{"ev": [0]}]},
                  {"k": [{"ev": [0]}]}
                ],
                "st": this.options.spawnTime
            }
        )
        return id
    }

    /**
     * Adds a keyframe to a pixel at the specified coordinates.
     *
     * @param {string} key - The Map entry key of the pixel
     * @param {number} time - The time (in seconds) at which the keyframe happens
     * @param {string} [easing="Instant"] - The easing function to apply (default is "Instant").
     * @param {string} color - The color associated with the keyframe (0 to 8).
     * @param {number} transparency - The transparency level for the keyframe (0 to 100).
     * @returns {boolean} Returns true if the keyframe was added successfully.
     */
    addKeyframe(key, time, easing, color, transparency) {
        const pixel = this.getPixelFromKey(key);
        if (!pixel) {
            console.error(`Tried to add keyframe to pixel at [${x}, ${y}], but got ${pixel}`);
            return;
        }

        if (pixel.keyframes[color] === null) { // If no keyframes exist
            pixel.keyframes[color] = []; // format as array so checks return true

            pixel.keyframes[color].push({ // add default keyframe
                "ev": [color, 0]
            });
        }

        if (!easing) {
            easing = "Instant";
        }

        pixel.keyframes[color].push({
            "t": time,
            "ct": pixel.keyframes[color].length == 1 ? "Instant" : easing,
            "ev": [color, transparency, color]
        });

        return true;
    }

    /**
     * Sets keyframes for the given frame based on the simulation rate.
     * This method iterates through the values of the data and adds keyframes 
     * for modified colors, skipping any pixels that have not been modified.
     *
     * @param {number} frame - The current frame number to set keyframes for.
     * @param {number} simulationRate - The rate of simulation, usually 60 FPS.
     * @returns {boolean|void} - Returns true 
     */
    setKeyframes(frame, simulationRate) {
        this.data.values.forEach((values, key) => {
            const colors = values;
            const keyframes = this.data.keyframes.get(key);

            for (let i = 0; i <= 8; i++) { // For each color group

                if (!(colors[i] === -1)) { // If this color was modified
                    const transparency = colors[i];
                    const time = ((1 / simulationRate) * (frame + 1));

                    this.addKeyframe( // Add keyframe
                        key,
                        time,
                        "Instant",
                        i,
                        transparency
                    );

                    colors[i] = -1; // And reset
                    continue;
                }

                if (!(keyframes[i] === null)) { // If pixel was unmodified, but previous keyframes exist
                    const time = ((1 / simulationRate) * (frame + 1));
                    this.addKeyframe( // Add blank keyframe
                        key,
                        time,
                        "Instant",
                        i,
                        0
                    );
                    colors[i] = -1; // And reset
                    continue;
                }

                // If none of these conditions are met, ignore the pixel
            }
        });
        return true;
    }

    /**
     * Strips empty pixels from the pixel data.
     * An empty pixel is defined as a pixel where all values are -1.
     * 
     * @returns {number} Returns the number of removed pixels
     */
    discardEmptyPixels() {
        console.warn(`Stripping empty pixels...`);
        let removed = 0;

        this.data.keyframes.forEach((pixel, key) => {
            const keyframes = Object.values(pixel).slice(0, -1); // Remove coordinates entry

            if (keyframes.every(value => value === null)) {
                this.data.values.delete(key);
                removed++;
            }
        });

        const strippedPercentage = (Math.floor((removed / (this.options.bufferHeight * this.options.bufferWidth)) * 10000) / 100);

        console.log(`Stripped ${strippedPercentage}% (${removed} total) unmodified pixels.`);
        if (strippedPercentage === 100) {
            console.error(`No pixels were preserved; it's possible nothing was rendered.`);
        };

        return removed;
    }

    /**
     * Optimizes keyframes by removing unnecessary keyframes where the transparency
     * value is 0 and the previous keyframe's transparency value is also 0.
     *
     * This method iterates through the keyframes data and removes any keyframes
     * that do not contribute to the animation.
     *
     * @returns {number} - Returns number of removed keyframes.
     */
    optimizeEmptyKeyframes() {
        console.warn(`Optimizing keyframes...`);
        var removed = 0;
        this.data.keyframes.forEach((values) => {
            for (let i = 0; i <= 8; i++) {
                const keyframes = values[i];
                if (!keyframes) { continue; } // If no keyframes were ever made (keyframes is null)

                // Start x at 1 to skip default keyframe
                for (var x = 1; x < keyframes.length; x++) {
                    if (keyframes[x].ev[1] === keyframes[x - 1].ev[1]) { // If current transparency and previous transparency are equal
                        keyframes.splice(x, 1); // Remove current keyframe
                        x--; // Go back to previous keyframe
                        removed++;
                    }
                }
            }
        });
        console.log(`Removed ${removed} unnecessary keyframes.`);
        return removed;
    }

    /**
     * Optimizes the start times of objects by adjusting keyframe timings.
     * 
     * This function iterates through an array of objects and checks the keyframes 
     * associated with each object. If the second keyframe's time is greater than 
     * 1/60, it adjusts the start time of the object and modifies the timing of 
     * all subsequent keyframes accordingly.
     * 
     * @param {Array<Object>} objects - An array of objects to optimize.
     * 
     * @returns {Array<Object>} The modified array of objects with optimized start times.
     */
    optimizeObjectStartTimes(objects) {
        console.warn(`Optimizing object spawn times...`);
        for (const object of objects) {
            if (object.e[3].k.length < 2) { continue; }
            if (object.e[3].k[1].t > (1 / 60)) {
                const difference = object.e[3].k[1].t;
                object.st += difference;
                for (const keyframe of object.e[3].k) {
                    if (keyframe.t !== undefined) {
                        keyframe.t -= difference;
                    }
                }
            }
        }
        console.log(`Done.`)
        return objects;
    }

    translateBufferToPA() {
        this.optimizeEmptyKeyframes();
        console.warn(`Translating buffer to PA objects...`);
        this.objects = [];
        const parentId = this.addParent();

        this.data.keyframes.forEach((values) => {
            if (Object.values(values).every(value => value === null)) { return; } // If the pixel went completely unmodified

            for (let group = 0; group <= 8; group++) {
                if (values[group] === null) { continue; } // If there are no keyframes for this color

                const position = this.translateToPACoordinates(values.position.x, values.position.y);
                const pixelSize = this.options.bufferPrecision * this.options.bufferPixelBlur;
                const keyframes = values[group];

                this.addPoint(
                    position.x,
                    position.y,
                    pixelSize,
                    parentId,
                    keyframes,
                )
            }
        })

        console.log(`Exported ${this.objects.length} objects.`);

        if (this.objects.length > 10000) {
            console.error(`Finished render has more than 10,000 objects, you may want to reduce your buffer precision or make your scene less complicated.`)
        } 
        if (this.objects.length > 100000) {
            console.error(`Finished render has more than 100,000 objects, this will not open in-editor.`)
        }
        return this.optimizeObjectStartTimes(this.objects);
    }

    translateToBufferCoordinates(x, y) {
        return {
            x: x * this.options.bufferPrecision,
            y: y * this.options.bufferPrecision
        }
    }

    translateToPACoordinates(x, y) {
        return {
            x: (x - (this.options.bufferWidth / 2) * this.options.bufferPrecision),
            y: (y - (this.options.bufferHeight / 2) * this.options.bufferPrecision),
        }
    }

    packObjectsIntoPrefab(objects) {
        const prefabId = this.makeId();

        // shameless self-promo
        const preview = "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"

        const prefab = {
            n: "PA RayTracer Render",
            id: prefabId,
            type:11,
            preview:preview,
            o:0.0,
            objs: objects
        }
        return prefab;
    }
}

export default Buffer