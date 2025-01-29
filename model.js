import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#ring');
    const container = document.querySelector('.model-container');

    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: false, 
        alpha: true 
    });

    const scene = new THREE.Scene();

    // Set the camera to a bird's-eye view directly above the helix
    const camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 0, -28); // Directly above the helix
    camera.lookAt(0, 0, 0);  // Look at the center of the helix

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const radius = 3;
    const height = 30; 
    const turns = 8; 

    const points_helix = [];
    const segments = 300;

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * (Math.PI * 2 * turns); // Full circle for each turn
        const x = radius * (1 + (2*i / segments)) * Math.cos(angle);
        const y = radius * (1 + (2*i / segments)) * Math.sin(angle);
        const z = (i / segments) * height - height / 2 - 1; // Linear height increase
        const turn = Math.floor(i * (turns / segments));
        if (turn < turns) {
            points_helix.push(new THREE.Vector3(x, y, z));
        }
    }

    const curve_helix = new THREE.CatmullRomCurve3(points_helix);
    const geometry_helix = new THREE.TubeGeometry(curve_helix, 3000, 0.7, 10, false);

    // Enable vertex colors
    geometry_helix.setAttribute('color', new THREE.Float32BufferAttribute(new Array(geometry_helix.attributes.position.count * 3).fill(1), 3));

    // const textureLoader = new THREE.TextureLoader();
    // const glassTexture = textureLoader.load('resources/glass_texture.jpeg')

    const helixMaterial = new THREE.MeshStandardMaterial({
        // map: glassTexture,
        color: 0xffffff, 
        vertexColors: true,
        metalness: 0.9,  // High metalness for reflective appearance
        roughness: 1,  // Smooth surface
        transparent: true, // Enable transparency
        opacity: 0.3, // Semi-transparent
    });

    const helix = new THREE.Mesh(geometry_helix, helixMaterial);

    const ambientLight = new THREE.AmbientLight(0xffffff, 10.5); // Soft white light
    scene.add(ambientLight);

    const sphereRadius = 1; // Define the radius for the spheres
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32); // Create sphere geometry
    // Calculate positions for the spheres at the ends of the helix

    // Create a new material for the bottom sphere with the color #666
    const bottomSphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, 
    });

    // Create bottom sphere with the new material
    const bottomSphere = new THREE.Mesh(sphereGeometry, bottomSphereMaterial); // Create bottom sphere
    bottomSphere.position.set(0, 0, -1); // Position at the bottom of the helix (adjusted for sphere radius)

    const helixGroup = new THREE.Group();
    helixGroup.add(helix);
    helixGroup.add(bottomSphere);
    
    scene.add(helixGroup);

    window.addEventListener('resize', () => {
        const width = container.clientWidth; // Get the current width of the container

        camera.aspect = 1; // Update the camera's aspect ratio
        camera.updateProjectionMatrix(); // Update the camera's projection matrix

        renderer.setSize(width * 0.9, width * 0.9); // Update the renderer's size
    });

    const positionAttribute = geometry_helix.attributes.position;
    const originalPositions = positionAttribute.array.slice(); // Copy original positions

    
    const pointsToColor = 100; // Number of points to color at a time
    const totalPoints = geometry_helix.attributes.position.count;
    console.log(totalPoints);

    const interval = 3.85;
    let elapsedTime = 0; // Track elapsed time
    let totalRedPoints = 0; // Track how many red colorings have been applied
    const maxRedPoints = 8; // Maximum number of red colorings allowed
    let pointIndexArray = new Array(maxRedPoints).fill(0);
    let rotationElapsedTime = 0;
    let rotationTimer = 0; // Track elapsed time for rotation
    const rotationDuration = 1.5 * interval; // Time to wait before starting rotation
    const rotationSpeed = 0.0025; // Speed of rotation
    let isRotating = false;
    let flipped = 0;

    function applyRedColoring(currentPointIndex) {
        
        const colors = geometry_helix.attributes.color.array;

        // Change color of the current points in geometry_helix
        for (let i = 0; i < pointsToColor; i++) {
            const index = (currentPointIndex + i) % totalPoints; // Wrap around using modulo
            const colorIndex = index * 3; // Get the index for the current point
            colors[colorIndex] = 210 / 255;     // R (Stanford red)
            colors[colorIndex + 1] = 15 / 255;         // G (0)
            colors[colorIndex + 2] = 15 / 255;  // B (52)
        }
        for (let i = 0; i < pointsToColor; i++) {
            const previousIndex = (currentPointIndex - pointsToColor + i) % totalPoints; // Previous points index
            const previousColorIndex = previousIndex * 3; // Get the index for the previous point
            colors[previousColorIndex] = 1;     // R
            colors[previousColorIndex + 1] = 1; // G
            colors[previousColorIndex + 2] = 1; // B
        }

        // Increment the currentPointIndex to move through the helix faster
        currentPointIndex = (currentPointIndex + 10) % totalPoints;

        geometry_helix.attributes.color.needsUpdate = true; // Notify Three.js that the color attribute has changed
        return currentPointIndex;
    }
    
    function animate(currentTime) {
        requestAnimationFrame(animate);
        
        // Calculate elapsed time
        elapsedTime += 0.016; // Assuming 60 FPS, each frame is approximately 16ms
        rotationElapsedTime += 0.016;
        pointIndexArray[0] = applyRedColoring(pointIndexArray[0]);
        for (let i = 1; i <= maxRedPoints; i++){
            if (elapsedTime >= interval * i){
                totalRedPoints++;
                pointIndexArray[i] = applyRedColoring(pointIndexArray[i])
            }
        }
        
        if (rotationElapsedTime >= rotationDuration && !isRotating) {
            isRotating = true; // Start rotation
        }

        if (isRotating) { // Increment rotation time
            rotationTimer += 0.016
            helixGroup.rotation.x += rotationSpeed; // Rotate around X-axis
            helixGroup.rotation.y += rotationSpeed * 2; // Rotate around Y-axis

            // Reset rotation after a full cycle (adjust as needed)
            if (rotationTimer >= 20.1) {
                if (flipped == 0){
                    helixGroup.rotation.set(Math.PI, 0, 0);
                    flipped = 1;
                }
                else {
                    helixGroup.rotation.set(0, 0, 0);
                    flipped = 0;
                }
                rotationElapsedTime = 0; // Reset rotation time
                rotationTimer = 0;
                isRotating = false; // Stop rotation
            }
        }

        for (let i = 0; i < positionAttribute.count; i++) {
            const index = i * 3; // Each vertex has 3 components (x, y, z)
            const x = originalPositions[index];
            const y = originalPositions[index + 1];
            const z = originalPositions[index + 2];

            // Apply sine wave motion based on z-coordinate
            const wave = Math.sin(z * 0.2 + currentTime * 0.001) * 0.05;
            positionAttribute.array[index] = x + wave * Math.cos(currentTime * 0.001);
            positionAttribute.array[index + 1] = y + wave * Math.sin(currentTime * 0.001);
            const vWave = Math.sin(y * 3.0 + currentTime * 0.005) * 0.2; // Adjust frequency (3.0) and amplitude (0.2)
            positionAttribute.array[index + 2] = z + vWave; // Apply vWave to the z-coordinate
        }
        positionAttribute.needsUpdate = true;
        renderer.render(scene, camera);

    }

    animate();
});
