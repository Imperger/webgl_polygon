#version 300 es

precision mediump float;

in vec3 circleColor;

uniform float u_radius;

out vec4 outColor;

void main() 
{
  if (distance(gl_PointCoord.xy, vec2(0.5)) > 0.5) {
    discard;
  } else {
    outColor = vec4(circleColor.xyz, 1);
  }
}
