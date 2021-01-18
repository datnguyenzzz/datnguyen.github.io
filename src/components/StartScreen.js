import * as THREE from 'three';

import { TEXTS_START } from '../configures/texts';
import { TextLoader } from '../ultis/TextLoader';

var loader,renderer;
var groundMesh;
var passingObj = {
    scene : null,
    objects : null
}

var StartScreen = {
    scene : new THREE.Scene(),
    camera : new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100),
};

const InitLoading = () => {
    loader = new THREE.FontLoader();
}

const InitRenderer = () => {
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

const InitScene = () => {
    StartScreen.scene.background = new THREE.Color(0xDDFFFD);

    const HemisphereLight = new THREE.HemisphereLight( 0xFFF6DD, 0x05050C, 1.1 );
    StartScreen.scene.add(HemisphereLight);

    const sunLight = new THREE.DirectionalLight(0xFEE8C9, 1);
    sunLight.position.set(-7,10,-7);
    sunLight.target.position.set(0,0,0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.top = 20;
	sunLight.shadow.camera.bottom = - 20;
	sunLight.shadow.camera.left = - 20;
	sunLight.shadow.camera.right = 20;
	sunLight.shadow.camera.near = 0.1;
	sunLight.shadow.camera.far = 100;
    StartScreen.scene.add(sunLight);

    //Oxyz
    const lineMatX = new THREE.LineBasicMaterial({color: 0xFF0000}); //red
    const lineMatY = new THREE.LineBasicMaterial({color: 0xABFF00}); //green
    const lineMatZ = new THREE.LineBasicMaterial({color: 0x0016FF}); //blue
    const pointO = new THREE.Vector3(0,0,0);

    const pointsX = [];
    pointsX.push(pointO);
    pointsX.push(new THREE.Vector3(10,0,0));
    const lineGeoX = new THREE.BufferGeometry().setFromPoints(pointsX);

    const pointsY = [];
    pointsY.push(pointO);
    pointsY.push(new THREE.Vector3(0,10,0));
    const lineGeoY = new THREE.BufferGeometry().setFromPoints(pointsY);

    const pointsZ = [];
    pointsZ.push(pointO);
    pointsZ.push(new THREE.Vector3(0,0,10));
    const lineGeoZ = new THREE.BufferGeometry().setFromPoints(pointsZ); 

    const Ox = new THREE.Line(lineGeoX, lineMatX);
    const Oy = new THREE.Line(lineGeoY, lineMatY);
    const Oz = new THREE.Line(lineGeoZ, lineMatZ);
    StartScreen.scene.add(Ox);
    StartScreen.scene.add(Oy);
    StartScreen.scene.add(Oz);
    StartScreen.scene.add(StartScreen.mesh);

    //ground 
    const groundGeo = new THREE.PlaneBufferGeometry(20,20);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x6D3E05});
    groundMesh = new THREE.Mesh(groundGeo,groundMat);
    groundMesh.rotation.x = -Math.PI/2;
    groundMesh.position.z += 4;
    groundMesh.receiveShadow = true;
    StartScreen.scene.add(groundMesh);

    passingObj = {
        scene : StartScreen.scene,
        objects : []
    }


    for (let i=0; i<TEXTS_START.length; i++) {
        TextLoader(loader, TEXTS_START[i], './fonts/Vehicle_Breaks_Down_Regular.json', 0x645F58, passingObj);
    }


    StartScreen.camera.position.set(0,2.9,1.7);
    StartScreen.camera.lookAt(StartScreen.scene.position);

    window.addEventListener('resize', onWindowResize, false);
}

const onWindowResize = () => {
    StartScreen.camera.aspect = window.innerWidth / window.innerHeight;
    StartScreen.camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

InitLoading();
InitRenderer();
InitScene();

export {StartScreen};