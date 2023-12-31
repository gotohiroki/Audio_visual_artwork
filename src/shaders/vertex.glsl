// この頂点シェーダーは、各頂点のUV座標とワールド座標を計算し、クリッピング座標に変換しています。これにより、Three.jsを使用して描画される3Dオブジェクトが正しく表示されるようになります。

// この行は、頂点シェーダー内で計算した情報をフラグメントシェーダーに渡すための変数 vUv を宣言しています。
// varying キーワードは、この変数が頂点シェーダーとフラグメントシェーダーの両方で利用可能であることを意味します。
// ここでは、テクスチャ座標（UV座標）を vUv としてフラグメントシェーダーに渡すために使用します。
varying vec2 vUv;

void main() {
    // 頂点のUV座標を vUv に代入しています。
    // uv は Three.js によって提供される組み込み変数で、各頂点のUV座標を保持しています。
    // vUv にこの値を代入することで、各頂点のUV座標がフラグメントシェーダーに渡されるようになります。
    vUv = uv;

    // vec4(position, 1.0);: mvPosition は頂点のワールド座標を視点座標に変換するための変数です。
    // position は Three.js によって提供される組み込み変数で、各頂点のローカル座標を保持しています。
    // modelViewMatrix は Three.js が内部的に持つ変換行列で、頂点のローカル座標を視点座標に変換するために使用します。
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // この行は、変換された視点座標をクリッピング座標に変換しています。
    // projectionMatrix は Three.js が内部的に持つ透視投影行列で、視点座標をクリッピング座標に変換するために使用します。
    // gl_Position は組み込み変数で、この変数に代入された値が描画される頂点のクリッピング座標として使用されます。
    // クリッピング座標は、視点から見える範囲を切り取るために使用される座標系です。
    gl_Position = projectionMatrix * mvPosition;
}