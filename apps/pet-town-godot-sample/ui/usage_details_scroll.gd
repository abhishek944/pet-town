extends RefCounted

static func wrap(details: VBoxContainer, column: VBoxContainer) -> void:
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	scroll.get_v_scroll_bar().focus_mode = Control.FOCUS_ALL
	scroll.get_v_scroll_bar().accessibility_name = "Scroll usage breakdowns"
	column.add_child(scroll)
	details.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(details)
	var fit := func() -> void:
		scroll.custom_minimum_size.y = minf(280, maxf(44, scroll.get_viewport_rect().size.y - 280))
	scroll.get_viewport().size_changed.connect(fit)
	fit.call()
	scroll.hide()
