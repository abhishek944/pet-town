extends Node
## Always-on, local technical diagnostics; no gameplay payloads or per-frame I/O.
const Log = preload("performance_log.gd")
const INTERVAL_USEC := 1000000
var log_sink := Log.new()
var stage := "boot"
var started := Time.get_ticks_usec()
var stage_started := started
var last_frame := started
var last_sample := started
var frame_count := 0
var slow_frames := 0
var stalls := 0
var max_gap_ms := 0.0
var worst_gap_ms := 0.0
var rendered := false
var viewport: RID

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	process_priority = -1000
	if not log_sink.open():
		set_process(false)
		return
	rendered = DisplayServer.get_name() != "headless"
	viewport = get_viewport().get_viewport_rid()
	if rendered: RenderingServer.viewport_set_measure_render_time(viewport, true)
	log_sink.write("session_start", "info", {
		"engine": Engine.get_version_info().string,
		"platform": OS.get_name(), "display_driver": DisplayServer.get_name(),
		"rendering_method": RenderingServer.get_current_rendering_method(),
		"gpu_model": RenderingServer.get_video_adapter_name() if rendered else null,
		"sample_interval_ms": 1000, "file_limit_bytes": Log.MAX_BYTES,
		"gpu_measurement": "viewport_timestamps" if rendered else "unavailable_headless"
	})
	last_frame = Time.get_ticks_usec()
	last_sample = last_frame

func phase(name: String) -> void:
	if name == stage: return
	var now := Time.get_ticks_usec()
	log_sink.write("startup_phase", "error" if "failed" in name else "info", {
		"phase": name, "previous_phase": stage,
		"previous_phase_ms": (now - stage_started) / 1000.0,
		"elapsed_ms": (now - started) / 1000.0
	})
	stage = name
	stage_started = now

func _process(_delta: float) -> void:
	var now := Time.get_ticks_usec()
	var gap_ms := (now - last_frame) / 1000.0
	last_frame = now
	frame_count += 1
	max_gap_ms = maxf(max_gap_ms, gap_ms)
	worst_gap_ms = maxf(worst_gap_ms, gap_ms)
	if gap_ms >= 50.0: slow_frames += 1
	if gap_ms >= 250.0: stalls += 1
	if now - last_sample < INTERVAL_USEC: return
	var fields := sample(now)
	if not log_sink.write("performance_sample", "warn" if stalls > 0 else "debug", fields):
		if rendered: RenderingServer.viewport_set_measure_render_time(viewport, false)
		rendered = false
		set_process(false)
	last_sample = now
	frame_count = 0
	slow_frames = 0
	stalls = 0
	max_gap_ms = 0.0

func sample(now: int) -> Dictionary:
	var window := get_window()
	var gpu_ms := RenderingServer.viewport_get_measured_render_time_gpu(viewport) if rendered else 0.0
	var cpu_ms := RenderingServer.viewport_get_measured_render_time_cpu(viewport) if rendered else 0.0
	var result := {
		"phase": stage, "elapsed_ms": (now - started) / 1000.0,
		"interval_ms": (now - last_sample) / 1000.0, "frames": frame_count,
		"observed_fps": frame_count * 1000000.0 / maxf(1.0, now - last_sample),
		"max_frame_gap_ms": max_gap_ms, "worst_frame_gap_ms": worst_gap_ms,
		"slow_frames_50ms": slow_frames, "stalls_250ms": stalls,
		"process_ms": Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0,
		"physics_ms": Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0,
		"render_cpu_ms": cpu_ms if rendered and cpu_ms > 0.0 else null,
		"render_gpu_ms": gpu_ms if rendered and gpu_ms > 0.0 else null,
		"gpu_time_status": "available" if rendered and gpu_ms > 0.0 else ("not_ready" if rendered else "unavailable_headless"),
		"focused": window.has_focus(), "minimized": window.mode == Window.MODE_MINIMIZED,
		"window_size": [window.size.x, window.size.y],
		"render_scale": window.scaling_3d_scale, "render_3d_disabled": window.disable_3d,
		"max_fps": Engine.max_fps, "vsync_mode": DisplayServer.window_get_vsync_mode() if rendered else null,
		"godot_static_memory_bytes": int(Performance.get_monitor(Performance.MEMORY_STATIC)),
		"draw_calls": int(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)),
		"primitives": int(Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)),
		"render_objects": int(Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)),
		"video_memory_bytes": int(Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED))
	}
	for pair in [
		["pipeline_canvas", RenderingServer.RENDERING_INFO_PIPELINE_COMPILATIONS_CANVAS],
		["pipeline_mesh", RenderingServer.RENDERING_INFO_PIPELINE_COMPILATIONS_MESH],
		["pipeline_surface", RenderingServer.RENDERING_INFO_PIPELINE_COMPILATIONS_SURFACE],
		["pipeline_draw", RenderingServer.RENDERING_INFO_PIPELINE_COMPILATIONS_DRAW],
		["pipeline_specialization", RenderingServer.RENDERING_INFO_PIPELINE_COMPILATIONS_SPECIALIZATION]
	]:
		result[pair[0]] = RenderingServer.get_rendering_info(pair[1])
	return result

func _exit_tree() -> void:
	if rendered and viewport.is_valid(): RenderingServer.viewport_set_measure_render_time(viewport, false)
	log_sink.write("session_end", "info", {
		"phase": stage, "elapsed_ms": (Time.get_ticks_usec() - started) / 1000.0,
		"worst_frame_gap_ms": worst_gap_ms
	})
	log_sink.close()
