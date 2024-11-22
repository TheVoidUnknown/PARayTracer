# PARayTracer

A bare-bones external Ray Tracing engine for Project Arrhythmia.
**The rendering pipeline is still single-threaded. Expect rendering times to be EXTREMELY slow.**

### This is not a mod for Project Arrhythmia, it runs purely in vanilla.

### This is an external tool, you apply to an existing level file.

# How do I use it?

Include the word "SCENE" (in all caps) anywhere in the name of objects you'd like to simulate.
Include the word "LIGHT" (in all caps) anywhere in the name of objects to be simulated as light sources.

The raytracer will use the color of the object marked as "LIGHT" for the color of light that ends up in the final render.
The current version supports multiple light sources and multiple colors.

To render a level, copy your **level.vgd** into the **input** folder.
Open a terminal with **Win+R > (type cmd) > hit Enter** on windows, or **Ctrl+Alt+T** on Linux.
Navigate to the folder you downloaded this in, and run `npm install` to install the `fs` and `path` packages.
After that, run `node .` to start rendering. Your output **level.vgd** will be in the **output** folder.
Open the editor, and spawn the internal prefab named **PA RayTracer Render** and spawn it **at the very start of the level.** If you wish to crash the editor, you can unpack the prefab.

## Simulation may be buggy.

This engine has to simulate exactly how the game behaves in order to render a level file, and as such may not be 100% accurate. Please report any issues to me @TheVoidUnknown on Discord.

### Known Issues:

- Does not scale properly with prefabs

# TODO List

- Refactor `/src/classes/Animation.js`
- Implement ray collision checks in place of ray marching (progress can be tracked in `/src/classes/RayTracer.js`)
- Implement multi-threaded raytracing (progress can be tracked in `/src/classes/RayMarcherManager.js` and `/src/classes/RayMarcherWorker.js`)
