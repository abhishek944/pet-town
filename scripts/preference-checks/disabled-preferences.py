import json
import pathlib
import sys

ids = sorted(p.parent.name for p in pathlib.Path("src/pets").glob("*/flow.json"))
pet = {
    "includedInRandomCast": True,
    "appearance": {"scalePercent": 100, "opacityPercent": 100},
    "labels": {"visibility": "always", "textScalePercent": 100},
    "motion": {"level": "standard", "pauseOnHover": True},
}
orchestrator = {
    "enabled": False,
    "displayName": "Mochi",
    "model": "gpt-5.6-luna",
    "thinking": "medium",
    "wakeEnabled": True,
    "petId": None,
}
data = {
    "schemaVersion": 3,
    "app": {
        "openWithHerdr": False,
        "settingsAppearance": "system",
        "lastSelectedPetId": ids[0],
        "hideCompletedPets": False,
        "completedHideDelayMinutes": 5,
        "orchestrator": orchestrator,
    },
    "pets": {i: pet for i in ids},
}
pathlib.Path(sys.argv[1]).write_text(json.dumps(data))
