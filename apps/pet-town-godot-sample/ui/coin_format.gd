extends RefCounted

const Format = preload("res://ui/usage_format.gd")
const RATE := 1000000

static func known(balance: Dictionary) -> bool:
	return balance.get("available", false) and Format.valid(balance.get("wholeCoins")) and Format.valid(balance.get("remainderTokens")) and balance.get("remainderTokens", RATE) < RATE and balance.get("tokensPerCoin") == RATE

static func percentage(balance: Dictionary) -> String:
	if not known(balance): return "—"
	var remainder := int(balance.remainderTokens)
	if remainder > 0 and remainder < 10000: return "<1%"
	return "%d%%" % (remainder / 10000)

static func contribution(balance: Dictionary) -> String:
	return "%s coins · %s" % [Format.count(balance.wholeCoins), percentage(balance)] if known(balance) else "Waiting for usage"

static func coverage(snapshot: Dictionary, include_models := false) -> String:
	var measured := Format.count(snapshot.get("measuredSessions"))
	var tracked := Format.count(snapshot.get("trackedSessions"))
	var reading: Dictionary = snapshot.get("totals", {})
	var state := ""
	if not snapshot.get("available", false) or reading.get("status", "") in ["unavailable", "unsupported"]: state = " · Waiting"
	elif reading.get("status") == "partial": state = " · Partial"
	var models: Array = reading.get("models", [])
	var model_copy := " · %d %s" % [models.size(), "model" if models.size() == 1 else "models"] if include_models and not models.is_empty() else ""
	if snapshot.get("coinSyncUnavailable", false): state += " · Earnings unavailable"
	return "Codex · %s/%s tracked sessions%s%s" % [measured, tracked, model_copy, state]

static func available(snapshot: Dictionary) -> bool:
	return snapshot.get("available", false) and snapshot.get("totals", {}).get("status", "") in ["measured", "partial"]

static func metadata(balance: Dictionary) -> String:
	if not known(balance): return "Waiting for recorded usage."
	return "%s earned · %s spent · %s toward coin %s" % [Format.count(balance.get("earnedCoins")), Format.count(balance.get("spentCoins")), percentage(balance), Format.count(int(balance.wholeCoins) + 1)]
