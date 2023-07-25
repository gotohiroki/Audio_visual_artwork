import * as THREE from 'three'
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

window.addEventListener('DOMContentLoaded', () => {
  const app = new App('#webgl');
  app.init();
  app.render();
}, false);

class App {
  constructor(canvas) {
    this.wrapper = document.querySelector(canvas);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.time = { type: 'float', value: 1.0 };
    this.resolution = { type: 'vec2', value: new THREE.Vector2() };

    this.objectGroup = new THREE.Group();

    this.analyser = null;
    this.frequencyArray = null;

    this.rendererParam = {
      clearColor: 0x000000,
      width: this.width,
      height: this.height
    };

    this.cameraDistance = 5000;
    this.cameraParam = {
      fov : 45,
      aspect : this.width / this.height,
      near : 0.1,
      far : 10000,
      x: 0.0,
      y: 0.0,
      z: 0.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    this.materialParam = {
      color: 0x00eedd
    };

    this.clock = new THREE.Clock();
  };

  _setScene() {
    this.scene = new THREE.Scene();
  };

  _setRender() {
    this.renderer = new THREE.WebGLRenderer({antialias : true});
    this.renderer.setSize(this.rendererParam.width, this.rendererParam.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new THREE.Color(this.rendererParam.clearColor));
    this.wrapper.appendChild(this.renderer.domElement);
  };

  _createFog() {
    this.scene.fog = new THREE.Fog(this.rendererParam.clearColor, 1, 10000);
  };

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.cameraParam.fov,
      this.cameraParam.aspect,
      this.cameraParam.near,
      this.cameraParam.far
    );

    this.camera.position.set(
      this.cameraParam.x,
      this.cameraParam.y,
      this.cameraParam.z,
    );

    this.camera.lookAt(this.cameraParam.lookAt);
  };

  _setLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.directionalLight.position.set(0, 1, 1);
    this.directionalLight.castShadow = true;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.5);

    return this.directionalLight, this.ambientLight, this.hemisphereLight;
  }

  // この関数は、Webブラウザがマイクへのアクセスを許可するためのAPIをサポートしているかどうかを確認します。
  // navigator.getUserMedia、navigator.webkitGetUserMedia、navigator.mozGetUserMedia、navigator.msGetUserMediaのいずれかが存在すれば、マイクへのアクセスがサポートされていると判断します。
  _hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  };

  // マイクへのアクセスが許可された場合に実行されるコールバック関数です。
  // 引数 stream はマイクからの音声ストリームを表します。この関数内では、Web Audio API を使用して音声の解析を行います。
  _onMicrophoneAllowed = (stream) => {
    if (!(stream instanceof MediaStream)) {
      console.error('無効な MediaStream オブジェクトです:', stream);
      return;
    };
    // AudioContext を作成し、音声ストリームをソースとして使用します。
    const audioContent = new AudioContext();

    // AnalyserNode を作成し、音声ストリームと接続します。AnalyserNode は音声データを解析し、周波数データなどを取得するために使用されます。fftSize プロパティを設定して解析の精度を調整します。
    const audioStream = audioContent.createMediaStreamSource(stream);
    this.analyser = audioContent.createAnalyser();
    audioStream.connect(this.analyser);
    this.analyser.fftSize = 1024;

    // frequencyArray という名前の Uint8Array を作成し、AnalyserNode.frequencyBinCount のサイズで初期化します。これは、音声の周波数データを格納するための配列です。
    this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);

    // _createMeshes(400) 関数を呼び出して、可視化のためのメッシュを作成し、シーンに追加します。
    this.scene.add(this._createMeshes(400));

    // render() 関数を呼び出して、可視化のアニメーションを開始します。
    this.render();
  };

  // この関数は、マイクへのアクセスが拒否された場合に呼び出されます。引数messageは表示するメッセージの内容です。
  // 関数内では、指定されたメッセージを表示するための<div>要素を動的に作成し、そのスタイルを設定して画面の中央に表示します
  _showAlertMessage(message) {
    const newDiv = document.createElement("div");
    newDiv.setAttribute("style", "    color: white;\n" +
        "    position: absolute;\n" +
        "    top: 50%;\n" +
        "    width: 100%;\n" +
        "    text-align: center;");
    const textContent = document.createTextNode(message);
    newDiv.appendChild(textContent);
    document.body.appendChild(newDiv);
  };

  // マイクへのアクセスが拒否された場合に実行されるコールバック関数です。
  //  _showAlertMessage() 関数を呼び出して、"マイクへのアクセスを許可してください。" というメッセージを表示します。
  _onMicrophoneDisallowed() {
    this._showAlertMessage("マイクへのアクセスを許可してください。");
  };

  // 可視化のためのメッシュを作成して返す関数です。引数 count は作成するメッシュの数を指定します。
  // THREE.BoxGeometry を使用して立方体のジオメトリを作成し、count の数だけシェーダーマテリアルを適用したメッシュを作成します。
  // それぞれのメッシュに対してランダムな位置と回転を設定し、objectGroup に追加します。最後に objectGroup を返します。
  _createMeshes(count) {
    const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
    for(let i = 0; i < count; i++) {
      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: this.time,
          resolution: this.resolution,
          id: {type: "float", value: i + 1},
          totalBoxCount: {type: "float", value: count},
          colorOffset: {type: "float", value: 0.0},
        },
        vertexShader,
        fragmentShader
      });
      const mesh = new THREE.Mesh(boxGeometry, shaderMaterial);

      const x = Math.random() * this.cameraDistance - this.cameraDistance / 2;
      const y = Math.random() * this.cameraDistance - this.cameraDistance / 2;
      const z = Math.random() * this.cameraDistance - this.cameraDistance / 2;

      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;

      mesh.rotation.x = Math.random() * 2 * Math.PI;
      mesh.rotation.y = Math.random() * 2 * Math.PI;

      this.objectGroup.add(mesh);
    }
    return this.objectGroup;
  };

  // アプリケーションの初期化を行うメソッドです。
  init() {
     // _setScene()、_setRender()、_createFog()、_setCamera()、_setLight() メソッドを呼び出して、シーン、レンダラー、フォグ、カメラ、ライトを設定します。
    this._setScene();
    this._setRender();
    this._createFog();
    this._setCamera();
    this.scene.add(this._setLight());

    // _hasGetUserMedia() メソッドを使用してマイクアクセスを確認し、許可された場合は navigator.getUserMedia() を使用して音声ストリームへのアクセスを試みます。その結果に応じて _onMicrophoneAllowed() か _onMicrophoneDisallowed() を呼び出します。
    if(this._hasGetUserMedia()) {
      navigator.getUserMedia({audio: true}, this._onMicrophoneAllowed.bind(this), this._onMicrophoneDisallowed.bind(this));
    } else {
      this._showAlertMessage("このアートはお使いのブラウザでは表示されません");
    }
    // また、ウィンドウのリサイズ時に onResize() メソッドを呼び出すイベントリスナーを登録します。
    window.addEventListener("resize", this.onResize.bind(this));
  };

  // メインの可視化アニメーションを行うメソッドです。レンダリングループ内で実行され、アニメーションフレームごとに呼び出されます。
  // 音声解析を行い、オブジェクトのスケールと回転を変更して可視化を行います。カメラの位置を時間に応じて変更し、アニメーションを行います。
  // レンダリングを行い、再帰的に次のフレームのレンダリングを要求します。
  render() {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.analyser.getByteFrequencyData(this.frequencyArray);

    const len = this.objectGroup.children.length;
    for(let i = 0; i < len; i++) {
      const object = this.objectGroup.children[i];
      if (object.type !== "Mesh") {
        continue;
      }
      const v = Math.max(Math.min(this.frequencyArray[10] / 255 * 3.0, 3.0), 0.5);
      object.scale.x = v;
      object.scale.y = v;
      object.scale.z = v;

      object.rotation.x += delta * v * 2.0;
      object.rotation.y += delta * v * 2.0;

      object.material.uniforms.id.value = i + 1;
      object.material.uniforms.colorOffset.value = v * 0.1;
    };

    this.camera.position.x = this.cameraDistance * Math.sin(time * 10 * (Math.PI / 180));
    this.camera.position.z = this.cameraDistance * Math.cos(time * 10 * (Math.PI / 180));
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.time.value = time;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  };

  onResize() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

}
