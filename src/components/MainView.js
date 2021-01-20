import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { MODELS } from '../configures/models';
import { UNITS } from '../configures/units';
import { TEXTS_INTRO,TEXTS_AWARD } from '../configures/texts';
import { LoadingScreen } from './LoadingScreen';
import { StartScreen } from './StartScreen';

import { SteeringEntity } from '../components/SteeringEntity';
import { Entity } from '../components/Entity';
import { Character } from '../components/Character';

import { GLTFClone,SceneClone } from '../ultis/CloneMethods';
import { TextLoader } from '../ultis/TextLoader';

const MainView = (src) => {
    useEffect(() => {
        var worldScene,camera,renderer,clock;
        var groundMesh;
        var mixers = [];
        var Obstacles = [], SteeringEntities = [], mainCharacter, fishes = [];
        var boundingGround,boundingSky,boundingSea;
        var RESOURCES_LOADED = false, START_RENDERING = false;
        var loadingManager,loader;
        var passingObj = {
            scene : null,
            objects : null
        };
        var mouse = new THREE.Vector2();
        var raycaster;

        const InitLoadingScene = () => {
            loadingManager = new THREE.LoadingManager();

            raycaster = new THREE.Raycaster();

            loadingManager.onLoad = () => {
                setTimeout(() => {  
                    RESOURCES_LOADED = true; 
                }, 2000);
            }
        }

        const InitScene = () => {
            //worldScene
            worldScene = new THREE.Scene();
            worldScene.background = new THREE.Color(0xDDFFFD);

            //camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
            //camera.position.set(0, 1, 3);
            camera.position.set(0, 10, 13);
            //camera.lookAt(10,1,3);
            camera.lookAt(worldScene.position);

            //light 
            const HemisphereLight = new THREE.HemisphereLight( 0xFFF6DD, 0x05050C, 1.1 );
            worldScene.add(HemisphereLight);

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
            worldScene.add(sunLight);

            //clock 
            clock = new THREE.Clock()

            //loader text
            loader = new THREE.FontLoader( loadingManager );
            /*
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
            worldScene.add(Ox);
            worldScene.add(Oy);
            worldScene.add(Oz);
            */
            //ground 
            const groundGeo = new THREE.PlaneBufferGeometry(20,12);
            const groundMat = new THREE.MeshPhongMaterial({ color: 0x6D3E05});
            groundMesh = new THREE.Mesh(groundGeo,groundMat);
            groundMesh.rotation.x = -Math.PI/2;
            groundMesh.position.z += 4;
            groundMesh.receiveShadow = true;
            worldScene.add(groundMesh);

            boundingGround = new THREE.Box3(new THREE.Vector3(-8.5,0,-1), new THREE.Vector3(8.5,0,8.5));
            boundingSky = new THREE.Box3(new THREE.Vector3(-10,0,-5), new THREE.Vector3(3,0,3));
            boundingSea = new THREE.Box3(new THREE.Vector3(-9,0,-15), new THREE.Vector3(9,0,-3));

            passingObj = {
                scene : worldScene,
                objects : Obstacles
            }

            //text
            for (let i=0; i<TEXTS_INTRO.length; i++) {
                TextLoader(loader, TEXTS_INTRO[i],'./fonts/Sketch_3D_Regular.json', 0xF0E1D1, passingObj);
            }

            for (let i=0; i<TEXTS_AWARD.length; i++) {
                TextLoader(loader, TEXTS_AWARD[i],'./fonts/Bakso.json', 0xBF0303, passingObj);
            }

            //window events
            window.addEventListener('resize', onWindowResize, false);
            window.addEventListener('mousemove',onDocumentMouseMove, false);

        }
        
        const InitRenderer = () => {
            //renderer
            renderer = new THREE.WebGLRenderer({ antialias: true});
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.gammaOutput = true;
            document.getElementById(src).appendChild(renderer.domElement);
        }

        const LoadModels = () => {
            var num=0;
            for (let i=0; i< MODELS.length; i++) {
                const model = MODELS[i];
                loadGLTFModel(model , () => {
                    num++;

                    if (num===MODELS.length) {
                        InitiateUnits();
                    }
                });
            }
        }

        const GetModelByName = (unitName) => {
            for (let i=0; i<MODELS.length; i++) {
                if (unitName.includes(MODELS[i].name)) {
                    return MODELS[i];
                }
            }

            return null;
        }

        const InitiateUnits = () => {
            for (let i=0; i<UNITS.length; i++) {

                const unit = UNITS[i];
                const model = GetModelByName(unit.name);

                if (model) {
                    var unitScene = SceneClone( model.gltf.scene );
                    const modelAnimations = model.gltf.animations;

                    var unitEntity;
                    var type;
                    if (unit.entity_type === 'Steering' || unit.entity_type === 'Main_character') {
                        if (unit.entity_type === 'Steering') {
                            unitEntity = new SteeringEntity(unitScene,unit.name,unit.maxSpeed,
                                                            unit.wanderDistance,unit.wanderAngle,
                                                            unit.wanderRadius,unit.wanderRange,0);
                            type = 0;
                        } else {
                            unitEntity = new Character(unitScene,unit.maxSpeed,unit.boundingRadius);
                            type = 1;
                        }
                    } 
                    else if (unit.entity_type === 'Obstacle') {
                        unitEntity = new Entity(unitScene,0,unit.boundingRadius);
                        type = 2;
                    } 
                    else {
                        unitEntity = unitScene;
                        type = 3;
                    }

                    if (unit.position) {
                        unitEntity.position.set(unit.position.x, unit.position.y, unit.position.z);
                    }

                    if (unit.scale) {
                        unitEntity.scale.set(unit.scale, unit.scale, unit.scale);
                    }

                    if (unit.rotation) {
                        if (unit.name === 'boxman') console.log(unit.rotation);
                        unitEntity.rotation.set(unit.rotation.x, unit.rotation.y, unit.rotation.z)
                    }

                    if (unit.animation) {
                        for (let i=0;i<unit.animation.length;i++) {
                            let animate = unit.animation[i];
                            const mixer = StartAnimation(unitEntity, modelAnimations, animate);
                            mixers.push(mixer);
                        }
                    }

                    if (type === 0) {
                        SteeringEntities.push(unitEntity);
                    } 
                    else if (type === 1) {
                        mainCharacter = unitEntity;
                    }
                    else if (type === 2) {
                        Obstacles.push(unitEntity);
                    }
                    
                    worldScene.add(unitEntity);

                } else {
                    console.error("not found model");
                }
            }
        }

        const loadGLTFModel = (model, onLoad) => {
            const loader = new GLTFLoader( loadingManager );
            const url_model = model.url;
            //console.log('load model from ' + url_model);

            loader.load(url_model, (gltf) => {

                gltf.scene.traverse((obj) => {
                    if (obj.isMesh) {
                        //if (model.name === 'water') console.log(obj.name);
                        obj.castShadow = model.castShadow;
                        obj.receiveShadow = model.receiveShadow;
                    }
                })

                model.gltf = GLTFClone(gltf);

                //if (model.name === 'fish_0') console.log(model.animations);

                onLoad();
            })
        }

        const StartAnimation = (mesh, animations, animationName) => {
            const mixer = new THREE.AnimationMixer(mesh);
            const clip = THREE.AnimationClip.findByName(animations, animationName);

            //console.log(clip);
            
            if (clip) {
                const action = mixer.clipAction(clip);
                action.play();
            }

            return mixer;
        }

        const gameLogic = () => {
            if (mainCharacter) {
                //mainCharacter.lookWhereGoing();
                mainCharacter.update();
            }

            for (let i=0;i<SteeringEntities.length;i++) {
                var unit = SteeringEntities[i];
                if (unit.name.includes('fish_')) fishes.push(unit);
            }

            for (let i=0;i<SteeringEntities.length;i++) {
                var steeringObj = SteeringEntities[i];
                if (steeringObj.name === 'cat') {
                    steeringObj.wander(boundingGround);
                    steeringObj.avoid(Obstacles);
                    steeringObj.avoid(mainCharacter);
                    steeringObj.evade(mainCharacter);
                    steeringObj.lookWhereGoing();
                    steeringObj.bounce(boundingGround);
                }

                if (steeringObj.name.includes('fish_')) {
                    steeringObj.wander(boundingSea);
                    steeringObj.avoid(fishes);
                    steeringObj.lookWhereGoing();
                    steeringObj.bounce(boundingSea);
                }
                
                if (steeringObj.name === 'cloud') {
                    steeringObj.wander(boundingSky);
                    steeringObj.bounce(boundingSky);
                }
                steeringObj.update();
            }
        }

        var dt = 1000/60;
        var timetarget = 0;
        var stTime = Date.now();

        const AnimateLoadingScene = () => {
            requestAnimationFrame(animate);
            renderer.render(LoadingScreen.scene, LoadingScreen.camera);
        }

        const AnimateStartScreen = () => {
            requestAnimationFrame(animate);
            //if (Date.now() - stTime > 2000) START_RENDERING = true;

            raycaster.setFromCamera(mouse, camera);
            
            if (StartScreen.scene.children[6] !== null) {
                const intersects = raycaster.intersectObjects( StartScreen.scene.children );
                console.log(intersects);
            }

            renderer.render(StartScreen.scene, StartScreen.camera);
        }

        const animate = () => {

            if (START_RENDERING === false) {
                AnimateStartScreen();
                return;
            } else {
                StartScreen.scene.remove.apply(StartScreen.scene, StartScreen.scene.children);
            }

            if (RESOURCES_LOADED === false) {
                AnimateLoadingScene();
                return;
            } else {
                LoadingScreen.scene.remove.apply(LoadingScreen.scene, LoadingScreen.scene.children);
            }
            if (Date.now() >= timetarget) {

                const mixerUpdateDelta = clock.getDelta();

                for (let i=0; i<mixers.length; i++) {
                    mixers[i].update(mixerUpdateDelta);
                }

                gameLogic();
                
                renderer.render(worldScene, camera);

                timetarget += dt;
                if (Date.now() >= timetarget) {
                    timetarget = Date.now();
                }
            }
            requestAnimationFrame(animate);
        }

        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        const onPushKeyboard = (event) => {
            var keyName = event.key;
            //console.log(keyName);
            if (keyName === 'w') {
                mainCharacter.moveUp();
            } else if (keyName === 's') {
                mainCharacter.moveDown();
            } else if (keyName === 'a') {
                mainCharacter.moveLeft();
            } else if (keyName === 'd') {
                mainCharacter.moveRight();
            }
            
        }

        const onReleaseKeyboard = (event) => {
            var keyName = event.key;
            //console.log(keyName);
            if (keyName === 'w') {
                mainCharacter.unMoveUp();
            } else if (keyName === 's') {
                mainCharacter.unMoveDown();
            } else if (keyName === 'a') {
                mainCharacter.unMoveLeft();
            } else if (keyName === 'd') {
                mainCharacter.unMoveRight();
            }
        }

        const onPressKeyboard = (event) => {
            var keyName = event.key;
            if (keyName === ' ') {
                mainCharacter.jumpUp();
            }
        }

        const onDocumentMouseMove = (event) => {
            event.preventDefault();

            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1; 
            
           // console.log(mouse.x + " " + mouse.y);
        }

        //main prog

        InitScene(); 
        InitRenderer();
        InitLoadingScene();
        LoadModels();
        animate();
        document.addEventListener('keydown',onPushKeyboard,false);
        document.addEventListener('keyup',onReleaseKeyboard,false);
        document.addEventListener('keypress',onPressKeyboard,false);
        //console.log(worldScene.children);
        return () => {
            document.getElementById(src).removeChild(renderer.domElement);
        }
    }, [src])
}

export default MainView;