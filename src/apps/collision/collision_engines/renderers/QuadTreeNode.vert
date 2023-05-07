#version 300 es
precision mediump float;

in vec2 a_vertex;

uniform vec3 u_cam;
uniform vec2 u_resolution;

out vec3 color;

void main() 
{
  gl_Position = vec4(((a_vertex + u_cam.xy * vec2(1, -1)) / (u_resolution / 2.0f) - vec2(1, 1)) * u_cam.z, 0, 1);
}
