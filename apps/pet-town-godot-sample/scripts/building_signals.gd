extends Node
## Publish UI feedback only after a queued terrain transaction actually commits.
var sample: Node3D

func setup(value: Node3D) -> void:
	sample=value
	sample.builder.edited.connect(block_edited)
	sample.builder.history_applied.connect(history_applied)
	sample.builder.reset_applied.connect(reset_applied)

func block_edited(cell: Vector3i, before: int, after: int) -> void:
	if not sample.builder.committing_history:
		sample.ambience.block_edited(cell,before,after,sample.builder.store.definitions)

func history_applied(redo: bool) -> void:
	sample.ambience.play_effect("redo" if redo else "undo")

func reset_applied() -> void:
	sample.actor.respawn()
	sample.hud.close_panel()
	sample.hud.show_toast("Your world is fresh again")
