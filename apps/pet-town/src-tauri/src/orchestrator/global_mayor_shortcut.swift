import AppKit

typealias MayorShortcutCallback = @convention(c) (Bool) -> Void

private var mayorShortcutTimer: Timer?
private var mayorShortcutHeld = false

@_cdecl("pv_global_mayor_shortcut_start")
func pvGlobalMayorShortcutStart(_ callback: @escaping MayorShortcutCallback) {
    DispatchQueue.main.async {
        guard mayorShortcutTimer == nil else { return }
        let timer = Timer(timeInterval: 0.04, repeats: true) { _ in
            let flags = NSEvent.modifierFlags
            let held = flags.contains(.control) && flags.contains(.option)
            guard held != mayorShortcutHeld else { return }
            mayorShortcutHeld = held
            callback(held)
        }
        mayorShortcutTimer = timer
        RunLoop.main.add(timer, forMode: .common)
    }
}
