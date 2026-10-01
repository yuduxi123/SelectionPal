import Foundation
import Observation
import SwiftUI
import Translation

@MainActor
@Observable
final class TranslationModel {
    struct Request: Equatable {
        let id = UUID()
        let text: String
        let source: String
        let target: String

        static func == (lhs: Request, rhs: Request) -> Bool { lhs.id == rhs.id }
    }

    var request: Request?
    var configuration: TranslationSession.Configuration?
    var onResult: ((String) -> Void)?
    var onError: ((String) -> Void)?

    func translate(_ text: String, source: String, target: String) {
        request = Request(text: text, source: source, target: target)
        let sourceLanguage = Locale.Language(identifier: source)
        let targetLanguage = Locale.Language(identifier: target)
        if configuration == nil || configuration?.source != sourceLanguage || configuration?.target != targetLanguage {
            configuration = .init(source: sourceLanguage, target: targetLanguage)
        } else {
            configuration?.invalidate()
        }
    }

    func perform(using session: TranslationSession) async {
        guard let request else { return }
        do {
            let response = try await session.translate(request.text)
            guard self.request?.id == request.id else { return }
            onResult?(response.targetText)
        } catch {
            guard self.request?.id == request.id else { return }
            onError?(error.localizedDescription)
        }
    }

    func cancel() {
        request = nil
    }
}

struct TranslationHost: View {
    @Bindable var model: TranslationModel

    var body: some View {
        Color.clear
            .frame(width: 1, height: 1)
            .translationTask(model.configuration) { session in
                await model.perform(using: session)
            }
    }
}
