import AppKit

@MainActor
final class ActionPanelController: NSWindowController {
    var onBritish: ((String) -> Void)?
    var onAmerican: ((String) -> Void)?
    var onChineseToEnglish: ((String) -> Void)?
    var onEnglishToChinese: ((String) -> Void)?
    var onDismiss: (() -> Void)?

    private let panelWidth: CGFloat = 366
    private let barHeight: CGFloat = 52
    private let resultLabel = NSTextField(wrappingLabelWithString: "")
    private let resultArea = NSView()
    private var selectedText = ""

    convenience init() {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 366, height: 52),
            styleMask: [.nonactivatingPanel, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        self.init(window: panel)
        panel.level = .popUpMenu
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
        panel.hidesOnDeactivate = false
        panel.isMovable = false
        panel.animationBehavior = .utilityWindow
        setupContent()
    }

    private func setupContent() {
        guard let panel = window as? NSPanel else { return }

        let chrome = NSVisualEffectView()
        chrome.material = .popover
        chrome.blendingMode = .behindWindow
        chrome.state = .active
        chrome.wantsLayer = true
        chrome.layer?.cornerRadius = 14
        chrome.layer?.cornerCurve = .continuous
        chrome.layer?.masksToBounds = true
        chrome.layer?.borderWidth = 0.5
        chrome.layer?.borderColor = NSColor.separatorColor.withAlphaComponent(0.5).cgColor

        let actions = NSStackView()
        actions.orientation = .horizontal
        actions.alignment = .centerY
        actions.distribution = .fill
        actions.spacing = 5
        actions.edgeInsets = NSEdgeInsets(top: 8, left: 9, bottom: 8, right: 9)

        actions.addArrangedSubview(actionButton(title: "UK", symbol: "speaker.wave.2.fill", tooltip: "英式发音", width: 64, action: #selector(british)))
        actions.addArrangedSubview(actionButton(title: "US", symbol: "speaker.wave.2.fill", tooltip: "美式发音", width: 64, action: #selector(american)))
        actions.addArrangedSubview(separator())
        actions.addArrangedSubview(actionButton(title: "中 → 英", symbol: "character.bubble.fill", tooltip: "翻译为英文", width: 94, action: #selector(chineseToEnglish)))
        actions.addArrangedSubview(actionButton(title: "英 → 中", symbol: "character.bubble", tooltip: "翻译为中文", width: 94, action: #selector(englishToChinese)))

        resultArea.translatesAutoresizingMaskIntoConstraints = false
        resultArea.isHidden = true

        let resultDivider = NSBox()
        resultDivider.boxType = .separator
        resultDivider.translatesAutoresizingMaskIntoConstraints = false
        resultArea.addSubview(resultDivider)

        resultLabel.translatesAutoresizingMaskIntoConstraints = false
        resultLabel.isSelectable = true
        resultLabel.maximumNumberOfLines = 6
        resultLabel.lineBreakMode = .byWordWrapping
        resultLabel.font = .systemFont(ofSize: 13)
        resultLabel.textColor = .labelColor
        resultArea.addSubview(resultLabel)

        NSLayoutConstraint.activate([
            resultDivider.topAnchor.constraint(equalTo: resultArea.topAnchor),
            resultDivider.leadingAnchor.constraint(equalTo: resultArea.leadingAnchor, constant: 10),
            resultDivider.trailingAnchor.constraint(equalTo: resultArea.trailingAnchor, constant: -10),
            resultLabel.topAnchor.constraint(equalTo: resultDivider.bottomAnchor, constant: 10),
            resultLabel.leadingAnchor.constraint(equalTo: resultArea.leadingAnchor, constant: 14),
            resultLabel.trailingAnchor.constraint(equalTo: resultArea.trailingAnchor, constant: -14),
            resultLabel.bottomAnchor.constraint(equalTo: resultArea.bottomAnchor, constant: -12)
        ])

        let root = NSStackView(views: [actions, resultArea])
        root.orientation = .vertical
        root.spacing = 0
        root.translatesAutoresizingMaskIntoConstraints = false
        chrome.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: chrome.leadingAnchor),
            root.trailingAnchor.constraint(equalTo: chrome.trailingAnchor),
            root.topAnchor.constraint(equalTo: chrome.topAnchor),
            root.bottomAnchor.constraint(equalTo: chrome.bottomAnchor),
            actions.heightAnchor.constraint(equalToConstant: barHeight)
        ])
        panel.contentView = chrome
    }

    private func actionButton(title: String, symbol: String, tooltip: String, width: CGFloat, action: Selector) -> NSButton {
        let button = HoverActionButton(title: title, target: self, action: action)
        button.image = NSImage(systemSymbolName: symbol, accessibilityDescription: tooltip)
        button.imagePosition = .imageLeading
        button.imageHugsTitle = true
        button.contentTintColor = .labelColor
        button.font = .systemFont(ofSize: 12.5, weight: .medium)
        button.toolTip = tooltip
        button.setAccessibilityLabel(tooltip)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.widthAnchor.constraint(equalToConstant: width).isActive = true
        button.heightAnchor.constraint(equalToConstant: 36).isActive = true
        return button
    }

    private func separator() -> NSBox {
        let box = NSBox()
        box.boxType = .separator
        box.translatesAutoresizingMaskIntoConstraints = false
        box.widthAnchor.constraint(equalToConstant: 1).isActive = true
        box.heightAnchor.constraint(equalToConstant: 24).isActive = true
        return box
    }

    func show(text: String, near mouse: NSPoint) {
        selectedText = text
        resultArea.isHidden = true
        resize(height: barHeight, animated: false)
        position(near: mouse)
        window?.orderFrontRegardless()
    }

    func showLoading() {
        resultLabel.stringValue = "正在翻译…"
        resultLabel.textColor = .secondaryLabelColor
        resultArea.isHidden = false
        resize(height: 96, animated: true)
    }

    func showResult(_ result: String) {
        resultLabel.stringValue = result
        resultLabel.textColor = .labelColor
        resultArea.isHidden = false
        let bounds = NSRect(x: 0, y: 0, width: panelWidth - 28, height: 180)
        let textHeight = resultLabel.cell?.cellSize(forBounds: bounds).height ?? 20
        resize(height: min(220, max(100, barHeight + textHeight + 30)), animated: true)
    }

    func dismiss() {
        guard window?.isVisible == true else { return }
        window?.orderOut(nil)
        onDismiss?()
    }

    func containsScreenPoint(_ point: NSPoint) -> Bool {
        window?.frame.contains(point) ?? false
    }

    private func resize(height: CGFloat, animated: Bool) {
        guard let window else { return }
        let top = window.frame.maxY
        window.setFrame(NSRect(x: window.frame.minX, y: top - height, width: panelWidth, height: height), display: true, animate: animated)
    }

    private func position(near point: NSPoint) {
        guard let window else { return }
        let screen = NSScreen.screens.first(where: { $0.frame.contains(point) }) ?? NSScreen.main
        let visible = screen?.visibleFrame ?? .zero
        var origin = NSPoint(x: point.x + 10, y: point.y - window.frame.height - 10)
        origin.x = min(max(visible.minX + 8, origin.x), visible.maxX - window.frame.width - 8)
        if origin.y < visible.minY + 8 { origin.y = point.y + 16 }
        window.setFrameOrigin(origin)
    }

    @objc private func british() { onBritish?(selectedText) }
    @objc private func american() { onAmerican?(selectedText) }
    @objc private func chineseToEnglish() { onChineseToEnglish?(selectedText) }
    @objc private func englishToChinese() { onEnglishToChinese?(selectedText) }
}

@MainActor
private final class HoverActionButton: NSButton {
    private var trackingAreaRef: NSTrackingArea?

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        configure()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        configure()
    }

    private func configure() {
        isBordered = false
        bezelStyle = .regularSquare
        focusRingType = .none
        wantsLayer = true
        layer?.cornerRadius = 8
        layer?.cornerCurve = .continuous
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let trackingAreaRef { removeTrackingArea(trackingAreaRef) }
        let area = NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect], owner: self)
        addTrackingArea(area)
        trackingAreaRef = area
    }

    override func mouseEntered(with event: NSEvent) {
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.12
            animator().layer?.backgroundColor = NSColor.selectedContentBackgroundColor.withAlphaComponent(0.13).cgColor
        }
    }

    override func mouseExited(with event: NSEvent) {
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.12
            animator().layer?.backgroundColor = NSColor.clear.cgColor
        }
    }

    override func mouseDown(with event: NSEvent) {
        layer?.backgroundColor = NSColor.selectedContentBackgroundColor.withAlphaComponent(0.22).cgColor
        super.mouseDown(with: event)
        layer?.backgroundColor = NSColor.clear.cgColor
    }
}
