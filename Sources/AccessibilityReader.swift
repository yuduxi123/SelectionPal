import AppKit
import ApplicationServices

enum AccessibilityReader {
    static func requestPermission() {
        // The public constant's value is stable. Using the literal avoids Swift 6
        // treating the imported C global as unsafe shared mutable state.
        let options = ["AXTrustedCheckOptionPrompt": true] as CFDictionary
        AXIsProcessTrustedWithOptions(options)
    }

    static var isTrusted: Bool { AXIsProcessTrusted() }

    static func selectedText() -> String? {
        guard isTrusted else { return nil }
        let system = AXUIElementCreateSystemWide()
        var focused: CFTypeRef?
        guard AXUIElementCopyAttributeValue(system, kAXFocusedUIElementAttribute as CFString, &focused) == .success,
              let focused else { return nil }
        let element = focused as! AXUIElement

        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, kAXSelectedTextAttribute as CFString, &value) == .success,
              let text = value as? String else { return nil }

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= 2_000 else { return nil }
        return trimmed
    }

    /// Compatibility path for Electron/WebKit-style apps that don't expose
    /// AXSelectedText. It copies the active selection, then restores every
    /// pasteboard representation so the user's clipboard is unchanged.
    @MainActor
    static func selectedTextByCopying() async -> String? {
        guard isTrusted else { return nil }

        let pasteboard = NSPasteboard.general
        let snapshot = PasteboardSnapshot(pasteboard: pasteboard)
        let previousChangeCount = pasteboard.changeCount

        guard let source = CGEventSource(stateID: .combinedSessionState),
              let keyDown = CGEvent(keyboardEventSource: source, virtualKey: 8, keyDown: true),
              let keyUp = CGEvent(keyboardEventSource: source, virtualKey: 8, keyDown: false) else {
            return nil
        }
        keyDown.flags = .maskCommand
        keyUp.flags = .maskCommand
        keyDown.post(tap: .cghidEventTap)
        keyUp.post(tap: .cghidEventTap)

        try? await Task.sleep(for: .milliseconds(90))
        guard pasteboard.changeCount != previousChangeCount else { return nil }
        let copied = pasteboard.string(forType: .string)?.trimmingCharacters(in: .whitespacesAndNewlines)
        snapshot.restore(to: pasteboard)

        guard let copied, !copied.isEmpty, copied.count <= 2_000 else { return nil }
        return copied
    }
}

private struct PasteboardSnapshot {
    struct Item {
        var values: [(NSPasteboard.PasteboardType, Data)]
    }

    let items: [Item]

    init(pasteboard: NSPasteboard) {
        items = (pasteboard.pasteboardItems ?? []).map { item in
            Item(values: item.types.compactMap { type in
                item.data(forType: type).map { (type, $0) }
            })
        }
    }

    @MainActor
    func restore(to pasteboard: NSPasteboard) {
        pasteboard.clearContents()
        let restoredItems = items.map { saved -> NSPasteboardItem in
            let item = NSPasteboardItem()
            for (type, data) in saved.values { item.setData(data, forType: type) }
            return item
        }
        if !restoredItems.isEmpty { pasteboard.writeObjects(restoredItems) }
    }
}
