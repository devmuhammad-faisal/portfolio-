import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelViewer {
    constructor() {
        this.container = document.getElementById('model-viewer');
        if (!this.container) {
            console.error('Model viewer container not found');
            return;
        }
        
        this.init();
        this.setupLighting();
        this.loadModel();
        this.animate();
        this.handleResize();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera setup with wider FOV for better container fitting
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        
        // Match container size exactly
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Controls setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2.0;
        this.controls.minPolarAngle = Math.PI / 2;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Adjusted zoom constraints
        this.controls.enableZoom = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setupLighting() {
        const frontLight = new THREE.DirectionalLight(0xffffff, 1);
        frontLight.position.set(0, 0, 5);
        this.scene.add(frontLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 0, -5);
        this.scene.add(backLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    loadModel() {
        const loader = new GLTFLoader();
        
        loader.load(
            'scene/scene.gltf',
            (gltf) => this.onModelLoad(gltf),
            undefined,
            (error) => console.error('Error loading model:', error)
        );
    }

    onModelLoad(gltf) {
        const model = gltf.scene;
        
        // Calculate model bounds
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Calculate container dimensions in 3D units
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraDistance = this.camera.position.z;
        const containerHeight = 2 * Math.tan(fov / 2) * cameraDistance;
        const containerWidth = containerHeight * (this.container.clientWidth / this.container.clientHeight);

        // Calculate scale to fit both width and height
        // Increased from 0.8 to 0.9 to make the model larger
        const scaleX = (containerWidth * 0.9) / size.x;  // Now uses 90% of container width
        const scaleY = (containerHeight * 0.9) / size.y; // Now uses 90% of container height
        const scale = Math.min(scaleX, scaleY);

        // Apply the calculated scale
        model.scale.setScalar(scale);

        this.scene.add(model);

        // Calculate ideal camera distance based on model size
        const scaledSize = Math.max(size.x * scale, size.y * scale);
        const idealDistance = (scaledSize / 2) / Math.tan(fov / 2);
        this.camera.position.z = idealDistance * 1.1; // Reduced padding from 1.2 to 1.1 for closer view

        this.camera.lookAt(0, 0, 0);
        this.controls.update();

        // Update control limits based on model size
        this.controls.minDistance = idealDistance * 0.5;
        this.controls.maxDistance = idealDistance * 2;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (!this.container) return;
            
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height, false);
        });
    }
}

// Initialize the viewer
new ModelViewer();