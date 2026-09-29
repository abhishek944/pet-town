import AVFoundation
import Foundation
import Speech

typealias WakeCallback = @convention(c) (Bool, UnsafePointer<CChar>?, UInt64) -> Void

private final class WakeController {
    private let engine = AVAudioEngine()
    private var task: SFSpeechRecognitionTask?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var tapInstalled = false
    private var generation: UInt64 = 0
    private var phrases: [String] = []
    private var wantsListening = false
    private var rustGeneration: UInt64 = 0
    private var callback: WakeCallback?
    private var lastTranscript = ""
    private var configurationObserver: NSObjectProtocol?

    fileprivate init() {
        configurationObserver = NotificationCenter.default.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            guard let self, self.wantsListening, !self.engine.isRunning else { return }
            self.report(false, "Audio input changed; restarting wake recognition.")
            self.scheduleRestart()
        }
    }

    deinit {
        if let configurationObserver { NotificationCenter.default.removeObserver(configurationObserver) }
    }

    private func recognizer() -> SFSpeechRecognizer? {
        let current = SFSpeechRecognizer()
        if current?.supportsOnDeviceRecognition == true { return current }
        return SFSpeechRecognizer(locale: Locale(identifier: "en_US"))
    }

    func supported() -> Bool {
        recognizer()?.supportsOnDeviceRecognition == true
    }

    func start(_ phrase: String, rustGeneration: UInt64, callback: @escaping WakeCallback) {
        stop()
        let token = generation
        self.wantsListening = true
        self.phrases = phrase.split(separator: "\n").map { normalized(String($0)) }
            .filter { !$0.isEmpty }
            .reduce(into: [String]()) { ordered, candidate in
                if !ordered.contains(candidate) { ordered.append(candidate) }
            }
        self.rustGeneration = rustGeneration
        self.callback = callback
        self.lastTranscript = ""
        // TCC can attribute a bare `tauri dev` executable to its launcher,
        // even when an Info.plist is embedded in the Mach-O. Never request
        // protected access without an application bundle of our own.
        guard Bundle.main.bundleURL.pathExtension == "app" else {
            self.report(false, "Voice requires the Pet Town.app build. Open the bundled app to start the mayor.")
            return
        }
        for key in ["NSSpeechRecognitionUsageDescription", "NSMicrophoneUsageDescription"] {
            guard let description = Bundle.main.object(forInfoDictionaryKey: key) as? String,
                  !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                self.report(false, "Voice is unavailable: this app build is missing \(key). Rebuild Pet Town.app.")
                return
            }
        }
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                guard let self, self.generation == token else { return }
                guard status == .authorized else {
                    self.report(false, "Speech recognition permission was not granted.")
                    return
                }
                AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
                    DispatchQueue.main.async {
                        guard let self, self.generation == token else { return }
                        guard granted else {
                            self.report(false, "Microphone permission was not granted.")
                            return
                        }
                        self.beginRecognition(token)
                    }
                }
            }
        }
    }

    func stop() {
        wantsListening = false
        generation &+= 1
        if engine.isRunning { engine.stop() }
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        task?.cancel()
        task = nil
        request = nil
    }

    private func normalized(_ value: String) -> String {
        value.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }

    private func beginRecognition(_ token: UInt64) {
        guard wantsListening, generation == token else { return }
        guard let recognizer = recognizer(), recognizer.supportsOnDeviceRecognition else {
            report(false, "On-device wake recognition is unavailable.")
            return
        }
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.requiresOnDeviceRecognition = true
        request.shouldReportPartialResults = true
        request.contextualStrings = phrases.flatMap {
            [$0, $0.replacingOccurrences(of: "hey ", with: "")]
        }
        request.taskHint = .confirmation
        self.request = request
        let input = engine.inputNode
        input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) {
            buffer, _ in request.append(buffer)
        }
        tapInstalled = true
        task = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self, self.generation == token else { return }
            if let text = result?.bestTranscription.formattedString.lowercased() {
                let heard = " \(normalized(text)) "
                if phrases.contains(where: { heard.contains(" \($0) ") }) {
                    report(true, "Wake phrase heard.")
                    stop()
                    return
                }
                if !text.isEmpty && text != lastTranscript {
                    lastTranscript = text
                    report(false, "Heard ‘\(text)’; waiting for the mayor wake phrase.")
                }
            }
            if error != nil || result?.isFinal == true {
                report(false, "Local wake recognition is restarting.")
                scheduleRestart()
            }
        }
        do {
            engine.prepare()
            try engine.start()
            report(false, "Listening locally for the wake phrase.")
        } catch {
            report(false, "Microphone input could not start; retrying locally.")
            scheduleRestart()
        }
    }

    private func scheduleRestart() {
        guard wantsListening else { return }
        stop()
        wantsListening = true
        let token = generation
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            guard let self, self.generation == token else { return }
            self.beginRecognition(token)
        }
    }

    private func report(_ found: Bool, _ message: String) {
        message.withCString { callback?(found, $0, rustGeneration) }
    }
}

private let controller = WakeController()

@_cdecl("pv_wake_supported")
func pvWakeSupported() -> Bool {
    controller.supported()
}

@_cdecl("pv_wake_start")
func pvWakeStart(_ phrase: UnsafePointer<CChar>?, _ generation: UInt64, _ callback: @escaping WakeCallback) {
    guard let phrase else { return }
    let value = String(cString: phrase)
    DispatchQueue.main.async { controller.start(value, rustGeneration: generation, callback: callback) }
}

@_cdecl("pv_wake_stop")
func pvWakeStop() {
    DispatchQueue.main.async { controller.stop() }
}
