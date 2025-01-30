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
uniform float u_time;
uniform vec2 u_resolution;
out vec4 fragColor;

float random(vec3 p)
{
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main()
{
  vec2 pos = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

  float noise = random(vec3(pos, 1.0));
  float wave = sin(pos.x + pos.y + u_time) * 0.15;
  wave += noise * 0.025;

  vec3 color = vec3(0.698, 0.7608, 0.8039);
  color += wave;
  fragColor = vec4(color, 1.0);
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

const setCard = (gl: WebGL2RenderingContext) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW,
  );
};

const Background = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl2');
    if (!(canvas && gl)) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // シェーダーを作成する
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
    if (!(vertexShader && fragmentShader)) return;

    // シェーダーをプログラムにリンクする
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    gl.useProgram(program);

    // 板ポリゴンデータをバッファに格納
    setCard(gl);

    // a_positionの用意と頂点データの取得方法の設定
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      'a_position',
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform変数の登録と初期化
    const resolutionUniformLocation = gl.getUniformLocation(
      program,
      'u_resolution',
    );
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(timeUniformLocation, 0.5);

    const startTime = new Date();
    const animate = () => {
      requestAnimationFrame(animate);

      // Uniform変数の更新
      const elapsedTime = (new Date().getTime() - startTime.getTime()) / 1000;
      gl.uniform1f(timeUniformLocation, elapsedTime);
      gl.uniform2f(
        resolutionUniformLocation,
        gl.canvas.width,
        gl.canvas.height,
      );

      // レンダリング
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.flush();
    };
    animate();
  }, []);

  return <canvas ref={ref} className={styles.background}></canvas>;
};

export default Background;
