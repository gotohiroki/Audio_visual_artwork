// このフラグメントシェーダーは、箱ごとに異なる色とエフェクトを持ち、時間に応じてアニメーションする3Dシーンを描画するために使用されます。

// Three.jsから渡される画面の解像度を表すユニフォーム変数です。
// uniform キーワードは、この変数が外部から提供される一定の値であることを示します。
uniform vec2 resolution;

// Three.jsから渡される経過時間を表すユニフォーム変数です。
// この値はアニメーションのフレームごとに更新され、シェーダー内で時間に応じたエフェクトを作成するために使用されます。
uniform float time;

// totalBoxCount は、Three.jsから渡される箱の総数を表すユニフォーム変数です。
// これは箱の総数を表す値で、id 変数と組み合わせて箱ごとに異なるエフェクトを作成するために使用されます。
uniform float totalBoxCount;

// id は、各箱に割り当てられた一意の識別子を表すユニフォーム変数です。
// id は箱ごとに異なる値を持ち、totalBoxCount 変数と組み合わせて箱ごとに個別のエフェクトを作成するために使用されます。
uniform float id;

// colorOffset は、色のオフセットを表すユニフォーム変数です。この値は、箱ごとに異なるオフセットを持ち、色に変化を与えるために使用されます。
uniform float colorOffset;

// この行は、頂点シェーダーから渡される vUv 変数を宣言しています。
// varying キーワードは、この変数が頂点シェーダーからフラグメントシェーダーに渡されることを示します。
// ここでは、各ピクセルのテクスチャ座標（UV座標）を vUv としてフラグメントシェーダーに受け渡しします。
varying vec2 vUv;

// これは、ランダムな値を生成するための関数です。ランダムな値をテクスチャ座標 uv に基づいて計算し、0.0から1.0の範囲で返します。
float random(in vec2 uv){
    return fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453);
}

// これは、値をある範囲から別の範囲にマッピングするための関数です。
// value を beforeMin から beforeMax の範囲から、afterMin から afterMax の範囲に変換します。
float map(float value, float beforeMin, float beforeMax, float afterMin, float afterMax) {
    return afterMin + (afterMax - afterMin) * ((value - beforeMin) / (beforeMax - beforeMin));
}

// これは、傾斜した線を生成するための関数です。テクスチャ座標 uv に基づいて、時間と colorOffset の値を用いて傾斜した線を計算します。
float obliqueLine(vec2 uv){
    return length(fract((uv.x + uv.y + time) * 6.0 * colorOffset) * 2.0 - 1.0);
}

// これはフラグメントシェーダーのエントリーポイントを定義しています。各ピクセルがこの関数内で処理されます。
void main() {
    // この行は、テクスチャ座標を正規化された-1から1の範囲に変換しています。
    // vUv の値は通常0から1の範囲であり、それを-1から1の範囲に変換することで、後続の計算が行いやすくなります。
    vec2 uv = 2.0 * vUv - 1.0;

    // id を totalBoxCount で割り、0.5の範囲にクランプした値を floatId に代入しています。これにより、id の値が箱の総数を超える場合でも、0から0.5の範囲に収まるようになります。
    float floatId = mod(id / totalBoxCount, 0.5);

    // 傾斜した線を計算し、その値を line に代入しています。
    float line = 0.3 / obliqueLine(uv);

    // floatId と colorOffset を色の各成分として使用し、line と乗算して色を計算しています。
    vec3 color = vec3(floatId, colorOffset, floatId) * line;

    // 最終的な色を gl_FragColor に代入しています。これにより、各ピクセルの色が設定され、描画が行われます。
    gl_FragColor = vec4(color, 1.0);
}