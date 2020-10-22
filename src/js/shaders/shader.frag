precision mediump float;

uniform float ticker;

uniform sampler2D map;
uniform sampler2D map2;
uniform sampler2D uDisp;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 disp = texture2D(uDisp, uv);

  vec2 distortedPosition = vec2(uv.x + ticker * disp.r, uv.y);
  vec2 distortedPosition2 = vec2(uv.x - (1.0 - ticker) * disp.r, uv.y);

  vec4 _texture = texture2D(map, distortedPosition);
  vec4 _texture2 = texture2D(map2, distortedPosition2);

  vec4 finalTexture = mix(_texture, _texture2, ticker);

  gl_FragColor = finalTexture;
}

