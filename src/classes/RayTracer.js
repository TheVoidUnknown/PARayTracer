class RayTracer {
    constructor(options = {}) {
        this.options = {
            maxReflections: options.maxReflections || 20,
            simulationRate: options.simulationRate || 60,
            minimumBrightnessBeforeDrop: 0.1,

            renderRays: options.renderRays || false,
            renderColorImparts: options.renderColorImparts || true,
            renderRayDiffusion: options.renderRayDiffusion || false,
            useGradientCollisionPoints: options.useGradientCollisionPoints || false,

            logMaxCollisionDrops: false,
            logRayTraceProgress: false
        };

        this.scene = {
            obstacles: [],
            lightSources: [],
            lightSourcesProperties: [],
            frameCount: 1
        };

        this.collisions = [];
    }

    setLightSources(lightSources) {
        this.scene.lightSources = lightSources;
    }

    setLightSourcesProperties(lightSourcesProperties) {
        this.scene.lightSourcesProperties = Object.values(lightSourcesProperties);
    }

    setObstacles(obstacles) {
        this.scene.obstacles = obstacles;
    }

    clearCollisionRecords() {
        this.collisions = [];
    }

    /**
     * Cast rays from all light sources
     */
    castRays(lightSources) {
        for (let x = 0; x < lightSources.length; x++) {
            const lightSource = this.scene.lightSources[x];
            const properties = this.scene.lightSourcesProperties[x];
            for (let i = 0; i < properties.rays; i++) {

                // Calculate the angle for each ray based on span
                const angle = degToRad(lightSource.rotate) - degToRad(properties.span) / 2 + (degToRad(properties.span) / properties.rays) * i;
                this.castRay({
                    origin: {x: lightSource.move[0], y: lightSource.move[1]},
                    direction: angle,
                    brightness: lightSource.opacity,
                    color: lightSource.color,
                    depth: 0,
                });
            }
        }
        return this.collisions;
    }

    /**
     * Cast a single ray and handle collisions and reflections
     * @param {Object} ray - The ray to cast
     */
    castRay(ray) {
        if (ray.depth > this.options.maxReflections || ray.brightness <= this.options.minimumBrightnessBeforeDrop) {
            return;
        }

        let closestIntersection = null;
        let minDistance = Infinity;

        // Iterate through all obstacles to find the closest intersection
        for (const obstacle of this.scene.obstacles) {
            const intersection = getRayIntersection(
                ray.origin,
                ray.direction,
                obstacle.position,
                obstacle.rotation
            );

            if (intersection) {
                const distance = getDistance(ray.origin, intersection.point);
                if (distance > 5) {
                    minDistance = distance;
                    closestIntersection = {
                        point: intersection.point,
                        obstacle: obstacle,
                        normal: intersection.normal,
                    };
                }
            }
        }

        if (closestIntersection) {
            // Log the collision point
            //console.log(`Collision at [${closestIntersection.point.x.toFixed(2)}, ${closestIntersection.point.y.toFixed(2)}]`);
            //console.log(closestIntersection.obstacle)
            
            // Add to collisions
            this.collisions.push({
                position: {x: closestIntersection.point.x, y: closestIntersection.point.y},
                color: ray.color,
                brightness: ray.brightness,
            });

            // Calculate reflected direction
            const reflectionDir = reflect(ray.direction, closestIntersection.normal);
            // Apply roughness
            const roughnessOffset = (Math.random() - 0.5) * degToRad(closestIntersection.obstacle.roughness);
            const newDirection = reflectionDir + roughnessOffset;

            // Calculate new brightness
            const newBrightness = ray.brightness * (closestIntersection.obstacle.reflectance / 100);

            // Recursive call for the reflected ray
            this.castRay({
                origin: closestIntersection.point,
                direction: newDirection,
                brightness: newBrightness,
                color: ray.color,
                depth: ray.depth + 1,
            });
        }
    }
}

/**
 * Utility function to convert degrees to radians
 * @param {number} degrees 
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Utility function to calculate distance between two points
 * @param {Object} p1 
 * @param {Object} p2 
 */
function getDistance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Reflect a vector around a normal
 * @param {number} direction - Angle in radians
 * @param {number} normal - Angle in radians
 * @returns {number} - Reflected direction in radians
 */
function reflect(direction, normal) {
    return direction - 2 * (direction - normal) + Math.PI;
}

/**
 * Get intersection point between a ray and an obstacle
 * @param {Object} rayOrigin - {x, y}
 * @param {number} rayDir - Radians
 * @param {Object} obstaclePos - {x1, y1, x2, y2}
 * @param {number} obstacleRot - Radians
 * @returns {Object|null} - { point: {x, y}, normal: radians } or null
 */
function getRayIntersection(rayOrigin, rayDir, obstacle) {
    const p0 = rayOrigin;
    const p1 = {
        x: p0.x + Math.cos(rayDir),
        y: p0.y + Math.sin(rayDir),
    };

    const p2 = { x: obstacle.x1, y: obstacle.y1 };
    const p3 = { x: obstacle.x2, y: obstacle.y2 };

    const denom = (p1.x - p0.x) * (p3.y - p2.y) - (p1.y - p0.y) * (p3.x - p2.x);
    if (denom === 0) return null; // Parallel lines

    const t = ((p2.x - p0.x) * (p3.y - p2.y) - (p2.y - p0.y) * (p3.x - p2.x)) / denom;
    const u = ((p2.x - p0.x) * (p1.y - p0.y) - (p2.y - p0.y) * (p1.x - p0.x)) / denom;

    if (t >= 0 && u >= 0 && u <= 1) {
        const intersection = {
            x: p0.x + t * (p1.x - p0.x),
            y: p0.y + t * (p1.y - p0.y),
        };
        // Calculate normal of the obstacle
        const dx = obstacle.x2 - obstacle.x1;
        const dy = obstacle.y2 - obstacle.y1;
        const normal = Math.atan2(-dx, dy);
        return { point: intersection, normal: normal };
    }

    return null;
}

export default RayTracer;