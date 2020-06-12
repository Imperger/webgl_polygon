#version 300 es

precision mediump float;

uniform vec3 u_grid;
uniform vec4 u_image;
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
  if (CellBorder(u_grid.x - p.x) || CellBorder(u_grid.y - p.y))
  {
    outColor = vec4(0, 0, 0, 1);
  } 
  else if (textSize != ivec2(1, 1))
  {
    float aspect = float(textSize.x) / float(textSize.y);

    float s = sin(u_image.z);
    float c = cos(u_image.z);

    mat2 rot = mat2(c, -s, s, c);
    mat2 scale = mat2(aspect, 0, 0, 1);
    mat2 scaleInv = mat2(1.0 / aspect, 0, 0, 1);

    vec2 texPos = p / vec2(textSize.x, textSize.y) / u_image.w - 0.5 - u_image.xy / u_image.w / vec2(textSize.x, textSize.y);
    texPos = scaleInv * rot * scale * texPos ;
    texPos += 0.5;

    texPos.y = 1.0 - texPos.y;
    
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