extends Node3D

const USER_TREE_SCENE := preload("res://scenes/user_tree.tscn")
const BUILD_WALLET_SCRIPT := preload("res://scripts/build_wallet.gd")
const TREE_LAYOUT_PATH := "user://town_layout.json"
const TREE_LAYOUT_VERSION := 2
const MAX_USER_TREES := 500
const MIN_TREE_SCALE := 0.5
const MAX_TREE_SCALE := 2.0
const TREE_ROTATION_STEP := 15.0

@onready var camera: Camera3D = $"../OrbitCamera"
@onready var host: Node = get_parent()

var ui_root: Control
var tree_panel: PanelContainer
var tree_status: Label
var tree_selection_label: Label
var tree_scale_label: Label
var tree_scale_slider: HSlider
var tree_move_button: Button
var tree_rotate_left_button: Button
var tree_rotate_right_button: Button
var tree_delete_button: Button
var tree_done_button: Button

var selected_user_tree: UserTree
var placement_tree: UserTree
var placement_active := false
var tree_editor_open := false
var placement_started_from_editor := false
var moving_existing_tree := false
var move_start_transform := Transform3D.IDENTITY
var placement_has_surface := false
var next_tree_id := 1
var authored_trees: Dictionary = {}
var authored_originals: Dictionary = {}
var deleted_authored_tree_ids: Dictionary = {}
var build_mode := false
var build_wallet = BUILD_WALLET_SCRIPT.new()
var catalog_items: Array[Dictionary] = []
var catalog_panel: PanelContainer
var catalog_list: VBoxContainer
var catalog_balance: Label
var catalog_button: Button
var next_build_id := 1
