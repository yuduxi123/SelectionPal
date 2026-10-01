import AppKit
import AVFoundation

@MainActor
final class SelectionController {
    private let settings: AppSettings
    private let translator: TranslationModel
    private let panel = ActionPanelController()
    private let speaker = AVSpeechSynthesizer()
    private var globalPointerMonitor: Any?
    private var localPointerMonitor: Any?
    private var globalKeyMonitor: Any?
    private var localKeyMonitor: Any?
    private var workspaceObservers: [NSObjectProtocol] = []
    private var lastSelection = ""
    private var lastSelectionTime = Date.distantPast
    private var mouseDownLocation: NSPoint?

    init(settings: AppSettings, translator: TranslationModel) {
        self.settings = settings
        self.translator = translator
        panel.onBritish = { [weak self] text in self?.speak(text, language: "en-GB") }
        panel.onAmerican = { [weak self] text in self?.speak(text, language: "en-US") }
        panel.onChineseToEnglish = { [weak self] text in self?.translate(text, from: "zh-Hans", to: "en") }
        panel.onEnglishToChinese = { [weak self] text in self?.translate(text, from: "en", to: "zh-Hans") }
        panel.onDismiss = { [weak self] in self?.translator.cancel() }
        translator.onResult = { [weak self] result in self?.panel.showResult(result) }
        translator.onError = { [weak self] message in self?.panel.showResult("翻译失败：\(message)") }
    }

    func start() {
        AccessibilityReader.requestPermission()
        globalPointerMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .leftMouseUp, .scrollWheel]) { [weak self] event in
            Task { @MainActor in
                guard let self else { return }
                if event.type == .scrollWheel {
                    self.panel.dismiss()
                    self.mouseDownLocation = nil
                    return
                }

                if event.type == .leftMouseDown {
                    // A native selection popover belongs to exactly one
                    // selection. Any new click invalidates the old one.
                    self.panel.dismiss()
                    self.mouseDownLocation = NSEvent.mouseLocation
                    return
                }

                let end = NSEvent.mouseLocation
                let start = self.mouseDownLocation ?? end
                self.mouseDownLocation = nil
                let dragged = hypot(end.x - start.x, end.y - start.y) >= 3
                let wordClick = event.clickCount >= 2
                guard dragged || wordClick else { return }
                self.captureSelectionSoon(allowCopyFallback: true)
            }
        }
        localPointerMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .scrollWheel]) { [weak self] event in
            guard let self else { return event }
            if event.type == .scrollWheel || !self.panel.containsScreenPoint(NSEvent.mouseLocation) {
                self.panel.dismiss()
            }
            return event
        }

        globalKeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: [.keyDown]) { [weak self] _ in
            Task { @MainActor in self?.panel.dismiss() }
        }
        localKeyMonitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown]) { [weak self] event in
            self?.panel.dismiss()
            return event
        }

        let center = NSWorkspace.shared.notificationCenter
        workspaceObservers.append(center.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.panel.dismiss() }
        })
        workspaceObservers.append(center.addObserver(
            forName: NSWorkspace.activeSpaceDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.panel.dismiss() }
        })
    }

    private func captureSelectionSoon(allowCopyFallback: Bool) {
        guard settings.isEnabled else { return }
        Task {
            try? await Task.sleep(for: .milliseconds(140))
            var text = AccessibilityReader.selectedText()
            if text == nil, allowCopyFallback {
                text = await AccessibilityReader.selectedTextByCopying()
            }
            guard let text else {
                panel.dismiss()
                return
            }

            let now = Date()
            if text == lastSelection, now.timeIntervalSince(lastSelectionTime) < 0.8 { return }
            lastSelection = text
            lastSelectionTime = now
            panel.show(text: text, near: NSEvent.mouseLocation)
        }
    }

    private func speak(_ text: String, language: String) {
        speaker.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.85
        speaker.speak(utterance)
    }

    private func translate(_ text: String, from source: String, to target: String) {
        panel.showLoading()
        translator.translate(text, source: source, target: target)
    }
}
