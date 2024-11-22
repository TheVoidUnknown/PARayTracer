import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import RayMarcher from './RayMarcher.js'; // Assuming RayMarcher is in the same directory\

class RayMarcherWorker {
    constructor(scene, options, rays) {
      this.scene = scene;
      this.options = options;
      this.rays = rays;
      this.collisions = [];
    }
  
    // Cast rays assigned to this worker
    processRays() {
      const rayMarcher = new RayMarcher(this.options);
      rayMarcher.setLightSources(this.scene.lightSources);
      rayMarcher.setLightSourcesProperties(this.scene.lightSourcesProperties);
      rayMarcher.setObstacles(this.scene.obstacles);
      this.collisions = rayMarcher.castRays(this.rays);
      return this.collisions;
    }
  }
  
// If inside a worker thread, handle processing
    if (!isMainThread) {
    const { scene, options, rays } = workerData;
    const worker = new RayMarcherWorker(scene, options, rays);
    parentPort.postMessage(worker.processRays());
}

export default RayMarcherWorker
