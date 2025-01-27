import { useEffect, useRef } from 'react';
import styles from './index.module.css';

const vertex = `#version 300 es
in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution; // 0.0 ~ 1.0;
  vec2 pos = uv * 2.0 - 1.0; // -1.0 ~ 1.0;
  float aspect = u_resolution.x / u_resolution.y;
  pos.x *= aspect;
  
  float t = length(0.0 - pos);
  
  outColor = vec4(uv.x, 1.0, 1.0, 1);
}
`;

const createShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) => {
  const shader = gl.createShader(type);
  if (!shader) return;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
};

const createProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
};

const Background = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // WebGLコンテキストを取得する
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl2');
    if (!gl) return;

    // シェーダーを作成する
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
    if (!(vertexShader && fragmentShader)) return;

    // シェーダーをプログラムにリンクする
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    gl.useProgram(program);

    // u_resolution変数の位置を取得する
    const resolutionUniformLocation = gl.getUniformLocation(
      program,
      'u_resolution',
    );
    // GPUにキャンバスの解像度を送る
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // a_position変数の位置を取得する
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      'a_position',
    );

    // 頂点データをバッファに格納する
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [0, 0, 0, 0.5, 0.7, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // VAOを作成する
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // a_position変数を有効にする
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // クリア
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // レンダリング
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, []);

  return <canvas ref={ref} className={styles.background}></canvas>;
};

export default Background;
