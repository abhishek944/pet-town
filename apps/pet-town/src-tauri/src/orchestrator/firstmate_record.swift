import AVFoundation
import Foundation

private final class FirstmateRecorder {
    static let shared = FirstmateRecorder()
    private var recorder: AVAudioRecorder?
    private var file: URL?

    func start() -> Bool {
        guard recorder == nil else { return true }
        guard AVCaptureDevice.authorizationStatus(for: .audio) == .authorized else { return false }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("pet-town-firstmate-\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitRateKey: 32000,
        ]
        guard let next = try? AVAudioRecorder(url: url, settings: settings),
              next.prepareToRecord(), next.record() else { return false }
        recorder = next
        file = url
        return true
    }

    func stop() -> String? {
        guard let recorder, let file else { return nil }
        recorder.stop()
        self.recorder = nil
        self.file = nil
        return file.path
    }
}

private func onMain<T>(_ action: () -> T) -> T {
    if Thread.isMainThread { return action() }
    return DispatchQueue.main.sync(execute: action)
}

@_cdecl("pv_firstmate_record_start")
public func pv_firstmate_record_start() -> Bool {
    onMain { FirstmateRecorder.shared.start() }
}

@_cdecl("pv_firstmate_record_stop")
public func pv_firstmate_record_stop() -> UnsafeMutablePointer<CChar>? {
    onMain { FirstmateRecorder.shared.stop().flatMap { strdup($0) } }
}
