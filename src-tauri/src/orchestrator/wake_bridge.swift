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
    private var phrase = ""
    private var rustGeneration: UInt64 = 0
    private var callback: WakeCallback?

    func supported() -> Bool {
        SFSpeechRecognizer(locale: Locale(identifier: "en_US"))?.supportsOnDeviceRecognition == true
    }

    func start(_ phrase: String, rustGeneration: UInt64, callback: @escaping WakeCallback) {
        stop()
        let token = generation
        self.phrase = phrase.lowercased()
        self.rustGeneration = rustGeneration
        self.callback = callback
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                guard let self, self.generation == token else { return }
                guard status == .authorized else {
                    self.report(false, "Speech recognition permission was not granted.")
                    return
                }
                self.beginRecognition(token)
            }
        }
    }

    func stop() {
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

    private func beginRecognition(_ token: UInt64) {
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en_US")),
              recognizer.supportsOnDeviceRecognition else {
            report(false, "On-device wake recognition is unavailable.")
            return
        }
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.requiresOnDeviceRecognition = true
        request.shouldReportPartialResults = true
        self.request = request
        let input = engine.inputNode
        input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) {
            buffer, _ in request.append(buffer)
        }
        tapInstalled = true
        task = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self, self.generation == token else { return }
            if let text = result?.bestTranscription.formattedString.lowercased(), text.contains(phrase) {
                report(true, "Wake phrase heard.")
                stop()
            } else if error != nil || result?.isFinal == true {
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
        stop()
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
