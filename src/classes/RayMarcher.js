class RayMarcher {
    constructor(options = {}) {
        this.options = {
            maxReflections: options.maxReflections || 20,
            simulationRate: options.simulationRate || 60,
            minimumBrightnessBeforeDrop: 0.1,

            renderRays: options.renderRays || false,
            renderColorImparts: options.renderColorImparts || true,
            renderRayDiffusion: options.renderRayDiffusion || false,
            useGradientCollisionPoints: options.useGradientCollisionPoints || false,

            stepSpeed: 0.25,
            largeStepMultiplier: 1,
            collisionTolerance: 0.125,
            maxDistanceBeforeDrop: 500,

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
    castRays(LightSources) {
        for (let x = 0; x < LightSources.length; x++) {
            const LightSource = this.scene.lightSources[x];
            const LightSourceProperties = this.scene.lightSourcesProperties[x];

            if (this.scene.obstacles == undefined || this.scene.obstacles.length == 0) {console.error(`WARNING: There are no scene obstacles!\nthis.scene.obstacles = ${JSON.stringify(this.scene.obstacles)}`)}
    
            for (var i = 0; i < LightSourceProperties.rays; i++) {
                const rotation = (((this.degreesToRadians(LightSourceProperties.span)) * (i / LightSourceProperties.rays)) - (this.degreesToRadians(LightSourceProperties.span) / 2)) + this.degreesToRadians(LightSource.rotate);
    
                const color = {"color": LightSource.color, "transparency": LightSourceProperties.brightness}
                const newCollisions = this.castRay([], LightSource.move, rotation, this.scene.obstacles, this.options.stepSpeed, 0, color);
    
                if (newCollisions.length > 0) {
                    this.collisions = this.collisions.concat(newCollisions)
                }
            }
        }
        return this.collisions;
    }

    /**
     * Cast a single ray and handle collisions and reflections
     * @param {Object} ray - The ray to cast
     */
    castRay(collisions, origin, rotation, obstacles, stepSpeed, reflections, color) {
        if (collisions == undefined) {
            collisions = []
        }
        const colorData = color
        if (colorData.transparency < 1) {return []}
        const vector = [Math.cos(rotation), Math.sin(rotation)];
        const pos = [origin[0], origin[1]];
        var steps = 0;
    
        if (reflections > 0) {
            while (this.checkForCollision(pos, obstacles).result) {
                pos[0] += (vector[0] * stepSpeed);
                pos[1] += (vector[1] * stepSpeed);
            }
        }
    
        while (
            !this.checkForCollision(pos, obstacles).result &&
            Math.abs(pos[0]) <= this.options.maxDistanceBeforeDrop && 
            Math.abs(pos[1]) <= this.options.maxDistanceBeforeDrop
        ) {
            steps++
            pos[0] += (vector[0] * stepSpeed);
            pos[1] += (vector[1] * stepSpeed);
        }
        const obstacle = this.checkForCollision(pos, obstacles).obstacle;       

        if (obstacle && true) {
            if (obstacle.reflectance == undefined) {
                console.error(`Obstacle has undefined reflectance! Please check your scene JSON.`);
                obstacle.reflectance = 0;
            } 
            const newColorData = { 
                "transparency": (colorData.transparency * (obstacle.reflectance / 100)),
                "color": colorData.color
            }

            if (this.options.renderColorImparts) {
                collisions.push({
                    position: { x: pos[0], y: pos[1] },
                    color: colorData.color, 
                    brightness: colorData.transparency * (1 - (obstacle.reflectance / 100))
                })
            }
    
            if (reflections + 1 > this.options.maxReflections) {return collisions}

            var obstacleVector = [(obstacle.position.x2 - obstacle.position.x1), (obstacle.position.y2 - obstacle.position.y1)];
            var newRotation
            if (obstacle.opacity > 0) {
                newRotation = this.vectorToRadians(this.reflectRay(obstacleVector, vector, pos));
            } else {
                newRotation = rotation
            }

            if (newColorData.transparency > this.options.minimumBrightnessBeforeDrop) {
                this.castRay(collisions, pos, newRotation, obstacles, stepSpeed, reflections + 1, newColorData);
            }
        }
        return collisions
    }

    checkForCollision(position, obstacles) {
        const posX = position[0];
        const posY = position[1];
        const toleranceSquared = this.options.collisionTolerance ** 2;
    
        for (const obstacle of obstacles) {
            const point1 = {x: obstacle.position.x1, y: obstacle.position.y1};
            const point2 = {x: obstacle.position.x2, y: obstacle.position.y2};
    
            if (this.isPointOnSegment(posX, posY, point1.x, point1.y, point2.x, point2.y, toleranceSquared)) {
                return { result: true, obstacle: obstacle };
            }
        }
    
        return { result: false, obstacle: null };
    }

    isWithinCollisionRadius(position, obstacles, radius) {
        const posX = position[0];
        const posY = position[1];
        const toleranceSquared = radius ** 2;
    
        for (const obstacle of obstacles) {
            const point1 = {x: obstacle.position.x1, y: obstacle.position.y1};
            const point2 = {x: obstacle.position.x2, y: obstacle.position.y2};
    
            if (this.isPointOnSegment(posX, posY, point1.x, point1.y, point2.x, point2.y, toleranceSquared)) {
                return { result: true, obstacle: obstacle };
            }
        }
    
        return { result: false, obstacle: null };
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    absoluteDistance(x1, y1, x2, y2) {
        return Math.abs(Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1))));
    }
    
    roundToNearest(num, nearest) {
        const remainder = num % nearest;
        if (remainder < nearest / 2) {
            return num - remainder;
        } else {
            return num + (nearest - remainder);
        }
    }
    
    vectorToRadians(vector) {
        const x = vector[0];
        const y = vector[1];
    
        const angleInRadians = Math.atan2(y, x);
        
        return angleInRadians;
    }
    
    squaredDistance(x1, y1, x2, y2) {
        return (x2 - x1) ** 2 + (y2 - y1) ** 2;
    }
    
    isPointOnSegment(px, py, x1, y1, x2, y2, toleranceSquared) {
        const d1 = this.squaredDistance(px, py, x1, y1);
        const d2 = this.squaredDistance(px, py, x2, y2);
        const lineSquared = this.squaredDistance(x1, y1, x2, y2);

        if (d1 <= toleranceSquared || d2 <= toleranceSquared) {
            return true;
        }
    
        if (lineSquared === 0) {
            return d1 <= toleranceSquared;
        }
    
        const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineSquared;
    
        if (t < 0 || t > 1) {
            return false;
        }
    
        const closestX = x1 + t * (x2 - x1);
        const closestY = y1 + t * (y2 - y1);
    
        const distanceToSegment = this.squaredDistance(px, py, closestX, closestY);
        return distanceToSegment <= toleranceSquared;
    }

    reflectRay(normal, incoming) {
        const normalLength = Math.sqrt(normal[0]**2 + normal[1]**2);
        var normalizedNormal = [normal[0] / normalLength, normal[1] / normalLength];
    
        normalizedNormal = [normalizedNormal[1], 0 - normalizedNormal[0]]
    
        const dotProduct = (incoming[0] * normalizedNormal[0]) + (incoming[1] * normalizedNormal[1]);
    
        const reflected = [
            incoming[0] - 2 * dotProduct * normalizedNormal[0],
            incoming[1] - 2 * dotProduct * normalizedNormal[1]
        ];
        return reflected;
    }
}

export default RayMarcher;