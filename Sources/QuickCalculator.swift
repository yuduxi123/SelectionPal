import Foundation
import JavaScriptCore

@MainActor
final class QuickCalculator {
    private let context = JSContext()

    init() {
        let url = Bundle.main.url(forResource: "QuickCalculator", withExtension: "js")
            ?? Bundle.module.url(forResource: "QuickCalculator", withExtension: "js", subdirectory: "Resources")
        if let url, let script = try? String(contentsOf: url, encoding: .utf8) {
            context?.evaluateScript(script)
        }
    }

    func calculate(_ text: String, operation: String) -> String {
        guard let function = context?.objectForKeyedSubscript("quickCalculate"), !function.isUndefined,
              let result = function.call(withArguments: [text, operation])?.toString() else {
            return "计算暂不可用，请重新启动划词助手。"
        }
        return result
    }
}
