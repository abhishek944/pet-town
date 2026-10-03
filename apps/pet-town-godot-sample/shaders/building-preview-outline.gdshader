shader_type spatial;
render_mode unshaded, cull_back, depth_draw_never;
uniform vec4 outline_color: source_color = vec4(1.0);
uniform float opacity = 1.0;
uniform float line_width = 0.036;
uniform float glow_amount = 0.3;
uniform float animation_time = 0.0;
uniform vec3 target_face = vec3(0.0,1.0,0.0);
varying vec3 local_normal;

void vertex() { local_normal = NORMAL; }
void fragment() {
	vec2 q = min(UV,1.0-UV);
	float d = min(q.x,q.y);
	float w = fwidth(d)*1.25;
	float line = 1.0-smoothstep(line_width-w,line_width+w,d);
	float pulse = 0.78+0.22*sin(animation_time*5.0);
	float glow = exp(-d*16.0)*glow_amount*pulse;
	float face = step(0.9,dot(normalize(local_normal),target_face))*(0.07+0.05*pulse);
	ALBEDO = outline_color.rgb;
	ALPHA = clamp(max(line*0.95,glow)+face,0.0,1.0)*opacity;
}
