// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "SelectionPal",
    platforms: [.macOS(.v15)],
    targets: [
        .executableTarget(
            name: "SelectionPal",
            path: "Sources",
            resources: [.copy("Resources")]
        )
    ],
    swiftLanguageModes: [.v5]
)
