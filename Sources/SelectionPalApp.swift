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
        alert.informativeText = "划选文字或公式，在鼠标旁点翻译、计算或判断，结果直接显示在浮条下方。\n\n计算支持四则 / 次方、GCD、LCM、取余、模幂、模逆元和进制转换，离线执行。\n\n判断：用本机已登录的 Codex 判断中英文陈述的事实对错，不限课程，无需课件。必要时联网查证并附来源；信息不足或有歧义会提示无法判断。消耗 Codex 额度，选中句子会发送给 Codex，搜索时相关查询会发送给搜索服务。AI 结论仍需核对。\n\n右侧小按钮可复制完整结果。首次使用需允许辅助功能，翻译可能需下载语言包。"
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
