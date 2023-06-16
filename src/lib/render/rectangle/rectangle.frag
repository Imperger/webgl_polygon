#version 300 es

precision mediump float;

in vec3 rectangleColor;

out vec4 outColor;

void main() 
{
  outColor = vec4(rectangleColor.xyz, 1);
}
