
import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import { TrackballControls } from './jsm/controls/TrackballControls.js';
import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';

//

let container, stats;
let camera, controls, scene, renderer;
let pickingTexture, pickingScene;
let highlightBox;

const pickingData = [];

const pointer = new THREE.Vector2();
const offset = new THREE.Vector3( 1, 1, 1 );

init();
animate();

//

function init() {

  const container = document.getElementById( 'container' );


  //

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set( 0, 0, 200 );
  //

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xb0b0b0 );

  //

  pickingScene = new THREE.Scene();
  pickingTexture = new THREE.WebGLRenderTarget( 1, 1 );

  //

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
  directionalLight.position.set( 0.75, 0.75, 1.0 ).normalize();
  scene.add( directionalLight );

  const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
  scene.add( ambientLight );

  //

  const group = new THREE.Group();
  scene.add( group );

  //

  const helper = new THREE.GridHelper( 160, 10 );
  helper.rotation.x = Math.PI / 2;
  group.add( helper );

  //

  const pickingMaterial = new THREE.MeshBasicMaterial( { vertexColors: true } );
  const defaultMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true, vertexColors: true, shininess: 0	} );

  const geometriesDrawn = [];
  const geometriesPicking = [];

				function applyVertexColors( geometry, color ) {

					const position = geometry.attributes.position;
					const colors = [];

					for ( let i = 0; i < position.count; i ++ ) {

						colors.push( color.r, color.g, color.b );

					}

					geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

				}

  //const geometry = new THREE.BoxGeometry();
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const color = new THREE.Color();
  for ( let i = 1; i < 5; i ++ ) {

    let geometry = new THREE.BoxGeometry();

    const position = new THREE.Vector3();
    //position.x = Math.random() * 10000 - 5000;
    //position.y = Math.random() * 6000 - 3000;
    //position.z = Math.random() * 8000 - 4000;
    position.x = 0 + i * 15;
    position.y = 20;
    position.z = 0;

    const rotation = new THREE.Euler();
    //rotation.x = Math.random() * 2 * Math.PI;
    //rotation.y = Math.random() * 2 * Math.PI;
    //rotation.z = Math.random() * 2 * Math.PI;
    rotation.x = 0;
    rotation.y = 0;
    rotation.z = 0;

    const scale = new THREE.Vector3();
    //scale.x = Math.random() * 200 + 100;
    //scale.y = Math.random() * 200 + 100;
    //scale.z = Math.random() * 200 + 100;
    scale.x = 10;
    scale.y = 10;
    scale.z = 10;

    quaternion.setFromEuler( rotation );
    matrix.compose( position, quaternion, scale );

    geometry.applyMatrix4( matrix );

					applyVertexColors( geometry, color.setHex( Math.random() * 0xffffff ) );

    geometriesDrawn.push( geometry );

    geometry = geometry.clone();

					applyVertexColors( geometry, color.setHex( i ) );

    geometriesPicking.push( geometry );

    pickingData[ i ] = {
      position: position,
      rotation: rotation,
      scale: scale
    };
  }

  // const material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
  //const cube = new THREE.Mesh( geometry, material );
  //scene.add( cube );

  //

  const objects = new THREE.Mesh( BufferGeometryUtils.mergeBufferGeometries( geometriesDrawn ), defaultMaterial );
  scene.add( objects );

  pickingScene.add( new THREE.Mesh( BufferGeometryUtils.mergeBufferGeometries( geometriesPicking ), pickingMaterial ) );

  //

  highlightBox = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshLambertMaterial( { color: 0xffff00 }
    ) );
  scene.add( highlightBox );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  //

  controls = new TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.minDistance = 100;
  controls.maxDistance = 1000;

  //

  stats = new Stats();
  container.appendChild( stats.dom );

  //

  //window.addEventListener( 'resize', onWindowResize );

  renderer.domElement.addEventListener( 'pointermove', onPointerMove );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onPointerMove( e ) {

  pointer.x = e.clientX;
  pointer.y = e.clientY;

}

function animate() {

  requestAnimationFrame( animate );

  render();
  stats.update();

}

function pick() {

  //render the picking scene off-screen

  // set the view offset to represent just a single pixel under the mouse

  camera.setViewOffset( renderer.domElement.width, renderer.domElement.height, pointer.x * window.devicePixelRatio | 0, pointer.y * window.devicePixelRatio | 0, 1, 1 );

  // render the scene

  renderer.setRenderTarget( pickingTexture );
  renderer.render( pickingScene, camera );

  // clear the view offset so rendering returns to normal

  camera.clearViewOffset();

  //create buffer for reading single pixel

  const pixelBuffer = new Uint8Array( 4 );

  //read the pixel

  renderer.readRenderTargetPixels( pickingTexture, 0, 0, 1, 1, pixelBuffer );

  //interpret the pixel as an ID

  const id = ( pixelBuffer[ 0 ] << 16 ) | ( pixelBuffer[ 1 ] << 8 ) | ( pixelBuffer[ 2 ] );
  const data = pickingData[ id ];

  if ( data ) {

    //move our highlightBox so that it surrounds the picked object

    if ( data.position && data.rotation && data.scale ) {

      highlightBox.position.copy( data.position );
      highlightBox.rotation.copy( data.rotation );
      highlightBox.scale.copy( data.scale ).add( offset );
      highlightBox.visible = true;

    }

  } else {

    highlightBox.visible = false;

  }

}

function render() {

  controls.update();

  pick();

  renderer.setRenderTarget( null );
  renderer.render( scene, camera );

}
