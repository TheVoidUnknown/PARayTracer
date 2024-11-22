import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import RayMarcher from './RayMarcher.js'; // Assuming RayMarcher is in the same directory

// Manager class to handle multithreading
class RayMarcherManager {
  constructor(scene, options, threadCount = 4) {
    this.scene = scene;
    this.options = options;
    this.threadCount = threadCount;
    this.collisions = [];
  }

  // Distribute rays across workers
  async render() {
    const raysPerWorker = Math.ceil(this.scene.lightSources.length / this.threadCount);
    const workerPromises = [];

    for (let i = 0; i < this.threadCount; i++) {
      const start = i * raysPerWorker;
      const end = start + raysPerWorker;
      const rays = this.scene.lightSources.slice(start, end);

      if (rays.length === 0) continue;

      workerPromises.push(
        new Promise((resolve, reject) => {
          const worker = new Worker('./src/classes/RayMarcherWorker.js', {
            workerData: {
              scene: this.scene,
              options: this.options,
              rays
            }
          });

          worker.on('message', resolve);
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
          });
        })
      );
    }

    // Collect results from workers
    const results = await Promise.all(workerPromises);
    this.collisions = results.flat();
    return this.collisions;
  }

  clearCollisionRecords() {
    this.collisions = [];
  }
}

export default RayMarcherManager ;