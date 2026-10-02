import { MeshStandardMaterial } from "three";

// The agent material isolator reconnects this uniform to each companion's visibility.
export function petMaterial(color, metal = false) {
  const material = new MeshStandardMaterial({
    color,
    roughness: metal ? 0.38 : 0.82,
    metalness: metal ? 0.45 : 0,
  });
  material.userData.visibility = { value: 1 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPipFade = material.userData.visibility;
    shader.fragmentShader = "uniform float uPipFade;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
      #include <dithering_fragment>
      float fadeNoise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
      if (fadeNoise > uPipFade) discard;
    `,
    );
  };
  material.customProgramCacheKey = () => "pet-town-pet-fade-v1";
  return material;
}
