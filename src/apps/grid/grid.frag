#version 300 es

precision mediump float;

uniform vec3 u_grid;
uniform vec3 u_image;
uniform sampler2D u_target;

out vec4 outColor;

bool CellBorder(float x)
{
  return mod(x, u_grid.z) == 1.f;
}
void main() 
{
  vec2 p = gl_FragCoord.xy - 0.5f;
  ivec2 textSize = textureSize(u_target, 0);
  float textWH = float(textSize.x) / float(textSize.y);
  if (CellBorder(u_grid.x + p.x) || CellBorder(u_grid.y + p.y))
  {
    outColor = vec4(0, 0, 0, 1);
  } 
  else if (textSize != ivec2(1, 1))
  {
    vec2 texPos = vec2(0, 1.f) - (p * vec2(1.f, textWH) - u_image.xy * vec2(1.f, textWH) * vec2(1.f, -1.f)) / float(textSize) / u_image.z * vec2(-1.f, 1.f);
    if (texPos.x >= 0.f && texPos.x <= 1.f && texPos.y >= 0.f && texPos.y <= 1.f)
    {
      outColor = texture(u_target, texPos);     
    }
    else
    {
      outColor = vec4(1);
    }
  }
  else
  {
    outColor = vec4(1);
  }
}