class_name BuildWallet
extends RefCounted

const FILE_NAME := "build-wallet.json"
const VERSION := 1

var usage := {"input_tokens": 0, "output_tokens": 0, "cache_hit_tokens": 0, "estimated_cost_usd": 0.0}
var spent := 0
var purchases: Array = []
var last_error := ""

func path() -> String:
	return OS.get_environment("HOME").path_join(".pet-town").path_join(FILE_NAME)

func load_wallet() -> bool:
	last_error = ""
	if not FileAccess.file_exists(path()):
		return _save_wallet()
	var file := FileAccess.open(path(), FileAccess.READ)
	if file == null:
		last_error = "Could not read build-wallet.json."
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary or int(parsed.get("version", 0)) != VERSION:
		last_error = "The wallet file needs version 1 JSON."
		return false
	var values = parsed.get("usage", {})
	if not values is Dictionary:
		last_error = "The wallet usage totals are invalid."
		return false
	for key in usage:
		var value = values.get(key, 0)
		if typeof(value) not in [TYPE_INT, TYPE_FLOAT] or float(value) < 0.0 or not is_finite(float(value)):
			last_error = "The wallet usage totals must be nonnegative numbers."
			return false
		usage[key] = value
	var saved_spent = parsed.get("spent", 0)
	if typeof(saved_spent) not in [TYPE_INT, TYPE_FLOAT] or float(saved_spent) < 0.0 or not is_finite(float(saved_spent)) or float(saved_spent) != floorf(float(saved_spent)):
		last_error = "The wallet spent total is invalid."
		return false
	spent = int(saved_spent)
	var saved_purchases = parsed.get("purchases", [])
	if not saved_purchases is Array:
		last_error = "The wallet purchases are invalid."
		return false
	purchases = saved_purchases
	return true

func earned() -> int:
	return int(usage["input_tokens"]) + 2 * int(usage["output_tokens"]) + int(float(usage["cache_hit_tokens"]) * 0.25) + int(float(usage["estimated_cost_usd"]) * 1000.0)

func balance() -> int:
	return maxi(0, earned() - spent)

func buy(item_id: String, price: int) -> bool:
	if price < 0 or balance() < price:
		last_error = "Earn more token credits to buy this object."
		return false
	var old_spent := spent
	spent += price
	purchases.append({"item": item_id, "price": price, "at": Time.get_unix_time_from_system()})
	if _save_wallet():
		return true
	spent = old_spent
	purchases.pop_back()
	return false

func _save_wallet() -> bool:
	var folder := path().get_base_dir()
	if DirAccess.make_dir_recursive_absolute(folder) != OK:
		last_error = "Could not create the Pet Town wallet folder."
		return false
	var temporary := path() + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		last_error = "Could not save the build wallet."
		return false
	file.store_string(JSON.stringify({"version": VERSION, "usage": usage, "spent": spent, "purchases": purchases}, "  ") + "\n")
	file.flush()
	file.close()
	if DirAccess.rename_absolute(temporary, path()) != OK:
		last_error = "Could not finish saving the build wallet."
		return false
	return true
