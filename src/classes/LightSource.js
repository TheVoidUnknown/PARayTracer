/**
 * Represents a light source in a 2D space.
 * 
 * @class
 */
class LightSource {
    /**
     * Creates an instance of LightSource.
     * 
     * @param {Object} [options={}] - The options for the light source.
     * @param {{x: number, y: number}} [options.position={x: 0, y: 0}] - Objective position of the light source.
     * @param {number} [options.rays=90] - The number of rays to simulate.
     * @param {number} [options.direction=0] - The direction the light source is facing, in degrees (0 is east).
     * @param {number} [options.color=0] - The color palette option, an integer from 0 to 8.
     * @param {number} [options.span=90] - The degrees over which rays are spread.
     * @param {number} [options.brightness=100] - The starting brightness of the light source.
     */
    constructor(options = {}) {
        this.position = options.position || { x: 0, y: 0 };
        this.rays = options.rays || 450;
        this.direction = options.direction || 0;
        this.color = options.color || 0;
        this.span = options.span || 45;
        this.brightness = options.brightness || 90;
    }
}

/**
 * Represents a point light source.
 * 
 * @class
 * @extends LightSource
 */
class PointLightSource extends LightSource {
    /**
     * Creates an instance of PointLightSource.
     * 
     * @param {Object} [options={}] - The options for the point light source.
     * @param {{x: number, y: number}} [options.position={x: 0, y: 0}] - The position of the light source in 2D space.
     * @param {number} [options.rays=1000] - The number of rays to simulate.
     * @param {number} [options.color=0] - The color palette option, an integer from 0 to 8.
     * @param {number} [options.brightness=50] - The starting brightness of the light source.
     */
    constructor(options = {}) {
        super(options);
        this.type = 'Point'; // Type of light source
        options.rays = 3600;
        options.span = 360;
        options.brightness = 100;
    }
}

/**
 * Represents a cone light source.
 * 
 * @class
 * @extends LightSource
 */
class ConeLightSource extends LightSource {
    /**
     * Creates an instance of ConeLightSource.
     * 
     * @param {Object} [options={}] - The options for the cone light source.
     * @param {{x: number, y: number}} [options.position={x: 0, y: 0}] - The position of the light source in 2D space.
     * @param {number} [options.rays=1000] - The number of rays to simulate.
     * @param {number} [options.direction=0] - The direction the light source is facing, in degrees.
     * @param {number} [options.color=0] - The color palette option, an integer from 0 to 8.
     * @param {number} [options.span=45] - The degrees over which rays are spread.
     * @param {number} [options.brightness=50] - The starting brightness of the light source.
     */
    constructor(options = {}) {
        super(options);
        options.rays = 450; // A laser typically emits a single ray
        options.span = 45; // A laser has no spread
        options.brightness = 100;
        this.type = 'Cone'; // Type of light source
    }
}

/**
 * Represents a single laser light source.
 * 
 * @class
 * @extends LightSource
 */
class LaserLightSource extends LightSource {
    /**
     * Creates an instance of LaserLightSource.
     * 
     * @param {Object} [options={}] - The options for the laser light source.
     * @param {{x: number, y: number}} [options.position={x: 0, y: 0}] - The position of the light source in 2D space.
     * @param {number} [options.direction=0] - The direction the laser is facing, in degrees.
     * @param {number} [options.color=0] - The color palette option, an integer from 0 to 8.
     * @param {number} [options.brightness=100] - The starting brightness of the laser source (typically higher).
     */
    constructor(options = {}) {
        options.rays = 1; // A laser typically emits a single ray
        options.span = 1; // A laser has no spread
        options.brightness = 100;
        super(options);
        this.type = 'Laser'; // Type of light source
    }
}

export {
    LightSource,
    PointLightSource,
    ConeLightSource,
    LaserLightSource
}