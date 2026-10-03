extends RefCounted
## Match the source en-US integer, compact and standard-credit formatting.
static func valid(value: Variant) -> bool:
	if not (value is int or value is float): return false
	var number := float(value)
	return is_finite(number) and number >= 0 and number <= 9007199254740991 and floor(number) == number

static func count(value: Variant) -> String:
	if not valid(value): return "—"
	return grouped(str(int(value)))

static func grouped(digits: String) -> String:
	var result := ""
	for index in range(digits.length()):
		if index > 0 and (digits.length() - index) % 3 == 0: result += ","
		result += digits[index]
	return result

static func decimal(value: float, precision: int) -> String:
	var result: String = ("%." + str(precision) + "f") % value
	while result.ends_with("0"): result = result.substr(0, result.length() - 1)
	return result.trim_suffix(".")

static func compact(value: Variant) -> String:
	if not valid(value): return "—"
	var number := float(value)
	if number < 1000: return str(int(number))
	var units := ["K", "M", "B", "T"]
	var index := 0
	number /= 1000
	while index < units.size() - 1 and snappedf(number, 0.01) >= 1000:
		number /= 1000
		index += 1
	return decimal(number, 2) + units[index]

static func credits(value: Variant) -> String:
	if not (value is int or value is float) or not is_finite(float(value)) or float(value) < 0: return "unavailable"
	var number := float(value)
	if number > 0 and number < 0.001: return "<0.001"
	var parts := decimal(number, 3).split(".")
	return grouped(parts[0]) + ("." + parts[1] if parts.size() > 1 else "")
