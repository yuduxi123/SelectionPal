import AppKit
import SwiftUI

@main
struct SelectionPalApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        Settings {
            SettingsView()
                .environment(appDelegate.settings)
        }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let settings = AppSettings()
    private var controller: SelectionController?
    private var statusItem: NSStatusItem?
    private var translationWindow: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)

        let translator = TranslationModel()
        let host = NSHostingController(rootView: TranslationHost(model: translator))
        let hiddenWindow = NSWindow(contentViewController: host)
        hiddenWindow.setFrame(NSRect(x: -10_000, y: -10_000, width: 1, height: 1), display: false)
        hiddenWindow.orderBack(nil)
        translationWindow = hiddenWindow

        controller = SelectionController(settings: settings, translator: translator)
        controller?.start()
        configureStatusItem()
    }

    private func configureStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = NSImage(systemSymbolName: "character.book.closed", accessibilityDescription: "划词助手")

        let menu = NSMenu()
        let enabled = NSMenuItem(title: "启用划词助手", action: #selector(toggleEnabled(_:)), keyEquivalent: "")
        enabled.target = self
        enabled.state = settings.isEnabled ? .on : .off
        menu.addItem(enabled)
        menu.addItem(NSMenuItem(title: "请求辅助功能权限…", action: #selector(requestPermission), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "使用说明", action: #selector(showHelp), keyEquivalent: ""))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "退出划词助手", action: #selector(quit), keyEquivalent: "q"))
        for menuItem in menu.items { menuItem.target = self }
        item.menu = menu
        statusItem = item
    }

    @objc private func toggleEnabled(_ sender: NSMenuItem) {
        settings.isEnabled.toggle()
        sender.state = settings.isEnabled ? .on : .off
    }

    @objc private func requestPermission() {
        AccessibilityReader.requestPermission()
    }

    @objc private func showHelp() {
        let alert = NSAlert()
        alert.messageText = "划词助手"
        alert.informativeText = "在任意应用中选中文字，鼠标松开后会显示操作条。\n\n🇬🇧 英式发音　🇺🇸 美式发音\n中→英　把中文翻译成英文\n英→中　把英文翻译成中文\n\n首次使用请在系统设置中允许“辅助功能”。翻译使用 macOS Translation，首次可能需要下载语言包。"
        alert.addButton(withTitle: "知道了")
        alert.runModal()
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }
}

@MainActor
@Observable
final class AppSettings {
    var isEnabled = true
}

struct SettingsView: View {
    @Environment(AppSettings.self) private var settings

    var body: some View {
        Form {
            Toggle("启用划词助手", isOn: Binding(
                get: { settings.isEnabled },
                set: { settings.isEnabled = $0 }
            ))
            Text("选中文字后，操作条会出现在鼠标附近。")
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(width: 380)
    }
}
