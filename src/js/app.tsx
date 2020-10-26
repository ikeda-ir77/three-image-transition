import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from "three";
// import "../css/style.scss";

import frag from "./shaders/shader.frag";
import vert from "./shaders/shader.vert";

function degToRad(d: number) {
  return d * (Math.PI / 180);
}

function radToDeg(r: number) {
  return r * (180 / Math.PI);
}

function randomGen(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function easeInOutCubic(t: number, b: number, c: number, d: number) {
	t /= d/2;
	if (t < 1) return c/2*t*t*t + b;
	t -= 2;
	return c/2*(t*t*t + 2) + b;
}

let loadedImages: Array<any> = [];
let galleryAnimateFlag = false;
let gWidth = 640, gHeight = 400;

const imagesList = [
  "/assets/image_1.jpg",
  "/assets/image_2.jpg",
  "/assets/image_3.jpg",
  "/assets/image_4.jpg"
];

let canvas: HTMLCanvasElement;

let
material: THREE.ShaderMaterial,
camera: THREE.PerspectiveCamera,
scene: THREE.Scene,
renderer: THREE.WebGLRenderer;

class Canvas3d {
  cw: number;
  ch: number;
  vol: number;
  tick: number;

  constructor(width: number, height:number){
    this.cw = width;
    this.ch = height;
    this.vol = 10;
    this.tick = 0;
  }

  imageLoader(src: string){
    return new Promise((resolve, reject) => {
      const loader = new THREE.ImageLoader();
      loader.load(src, (image) => {
        resolve(image);
      });    
    });
  }
  
  async init(){
    loadedImages = await Promise.all(imagesList.map(async(image) => {
      const res = await this.imageLoader(image);
      return res;
    }));

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setClearColor( 0x000000, 0);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( this.cw, this.ch );
    
    const fov = 70;
    const distance = (this.ch / 2) / Math.tan(degToRad(fov / 2));

    camera = new THREE.PerspectiveCamera( fov, this.cw / this.ch, 1, distance * 2 );
    camera.aspect = this.cw / this.ch;
    camera.updateProjectionMatrix();
    camera.position.set( 0, 0, distance );
    camera.lookAt( 0, 0, 0 );

    scene = new THREE.Scene();
    const axes = new THREE.AxesHelper(25);
    scene.add(axes);
    scene = new THREE.Scene();
    renderer.render( scene, camera );

    this.initImages();
  }

  async initImages(){
    const disp = await this.imageLoader("/assets/disp.jpg");
    material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.DoubleSide,
      wireframe: false,
      uniforms: {
        map: {
          type: "t",
          value: new THREE.Texture()
        },
        map2: {
          type: "t",
          value: new THREE.Texture()
        },
        uDisp: {
          type: "t",
          value: new THREE.Texture()
        },
        ticker: {
          type: "f",
          value: 0
        },
        direction: {
          type: "f",
          value: 1
        }        
      }
    });
    
    const geometry = new THREE.PlaneBufferGeometry(gWidth, gHeight);
    geometry.center();
    // geometry.addAttribute("fPosition", new THREE.BufferAttribute(textGeometry.attributes.position.array, 3));
    material.uniforms.map.value.image = loadedImages[0];
    material.uniforms.map2.value.image = loadedImages[1];
    material.uniforms.uDisp.value.image = disp;

    material.uniforms.map.value.needsUpdate = true;
    material.uniforms.map2.value.needsUpdate = true;
    material.uniforms.uDisp.value.needsUpdate = true;

    material.needsUpdate = true;
    const mesh = new THREE.Mesh( geometry, material );
    mesh.name = "gallery";
    scene.add(mesh);
    renderer.render(scene, camera);
  }

  prev(current: number, to: number){
    this.animate(current, to, -1);
  }

  next(current: number, to: number){
    this.animate(current, to, 1);
  }

  animate(current:number, to: number, direction: number){
    console.log(current, to);

    material.uniforms.map.value.image = loadedImages[current];
    material.uniforms.map2.value.image = loadedImages[to];
    material.uniforms.map.value.needsUpdate = true;
    material.uniforms.map2.value.needsUpdate = true;
    
    let worksTicker = 0;
    const interval = window.setInterval(() => {
      worksTicker += 1;
      // material.uniforms.ticker.value = ( 1 - Math.cos(ticker)) / 2;
      material.uniforms.ticker.value = easeInOutCubic(worksTicker, 0, 1, 300);
      material.uniforms.direction.value = direction;
      this.render();
      if(Math.abs(material.uniforms.ticker.value) > 1){
        window.clearInterval(interval);
        galleryAnimateFlag = false;
      }
    });
  }  

  render(){
    renderer.render( scene, camera );
  }

  update(){
    this.tick++;
    const ticker = this.tick * .01;
    // material.uniforms.ticker.value = ( 1 - Math.cos(ticker)) / 2;
    material.uniforms.ticker.value = easeInOutCubic(this.tick, 0, 1, 50);
    this.render();
    if(material.uniforms.ticker.value < 1){
      const timer = window.requestAnimationFrame(() => {
        this.update();
      });
    }
  }

  handleResize(){
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    this.render();
  }
}

const canvas3d = new Canvas3d(window.innerWidth, window.innerHeight);
interface IProps{

}

interface IState{
  width: number;
  height: number;
  galleryIndex: number;
}

export class App extends React.Component<IProps, IState> {
  constructor(props: any){
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      galleryIndex: 0,
    };
    this.handleWorksPrev = this.handleWorksPrev.bind(this);
    this.handleWorksNext = this.handleWorksNext.bind(this);
  }

  componentDidMount(){
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    canvas.width = this.state.width;
    canvas.height = this.state.height;
    canvas3d.init();

    let timerId: any;
    window.addEventListener("resize", () => {
      if (timerId) return;
      timerId = setTimeout(() => {
        timerId = 0;
        canvas3d.handleResize();
      }, 500);
    });    
  }

  handleWorksPrev(ev: any) {
    if (galleryAnimateFlag === true) return false;

    const current = this.state.galleryIndex;
    galleryAnimateFlag = true;
    let to = this.state.galleryIndex - 1;

    if (to < 0) {
      to = imagesList.length - 1;
    }

    this.setState({
      galleryIndex: to
    });

    canvas3d.prev(current, to);
  }

  handleWorksNext(ev: any) {
    const current = this.state.galleryIndex;
    galleryAnimateFlag = true;
    let to = this.state.galleryIndex + 1;

    if (to > imagesList.length - 1) {
      to = 0;
    }

    this.setState({
      galleryIndex: to
    });

    canvas3d.next(current, to);
  }
  
  render(){
    const btnStyle: React.CSSProperties = {
      zIndex: 999,
      position: "relative"
    };
    
    return (
      <div className="wrapper">
        <div className="btn prevbtn" onClick={this.handleWorksPrev} />
        <canvas id="canvas" width="640" height="480" ref={ (elm: HTMLCanvasElement) => { canvas = elm; } } />
        <div className="btn nextbtn" onClick={this.handleWorksNext} />
      </div>
    );
  }

}

ReactDOM.render(<App />, document.getElementById("root"));
export default App;