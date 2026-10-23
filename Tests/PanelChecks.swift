import AppKit

@main
struct PanelChecks {
    @MainActor static func main() {
        _ = NSApplication.shared
        let panel = ActionPanelController()
        panel.show(text: "RSA uses the same key for encryption and decryption.", near: NSPoint(x: 500, y: 500))
        guard let window = panel.window, let content = window.contentView,
              let root = content.subviews.first as? NSStackView,
              let actions = root.arrangedSubviews.first as? NSStackView else { fatalError("Missing floating toolbar") }
        content.layoutSubtreeIfNeeded()
        let buttons = actions.arrangedSubviews.compactMap { $0 as? NSButton }
        precondition(buttons.map(\.title) == ["UK","US","中 → 英","英 → 中","计算","判断"])
        precondition(window.frame.width == 442 && window.frame.height == 52)
        for button in buttons {
            let rect = button.convert(button.bounds, to: content)
            precondition(rect.width > 0 && rect.minX >= 0 && rect.maxX <= 442, "Toolbar button overflow")
        }
        panel.showLoading("Codex 正在判断，必要时联网核实…")
        panel.showResult("错误 · AI 判断\n2 是质数，但它是偶数。\n更正：除了 2 以外，所有质数都是奇数。")
        precondition(window.frame.width == 442 && window.frame.height <= 220)
        var dismissed = false
        panel.onDismiss = { dismissed = true }
        panel.dismiss()
        precondition(dismissed && !window.isVisible)
        print("Native toolbar layout, result sizing and dismiss checks passed")
    }
}
