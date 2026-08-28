# PocketRoar iPhone capture inspiration

Checked: 2026-08-28. Sources are limited to Apple, Sony, and adapter-manufacturer documentation.

## Corrected product premise

PocketRoar's hardware target is **iPhone**, not iPad. A USB-C iPad already has an Apple-documented path for external UVC cameras. The motivating gap is that the equivalent direct Sony-camera-to-iPhone capture path is not documented or supported by the sources below. PocketRoar therefore needs an intermediary that accepts a camera feed and presents it to an iPhone through a proven iPhone-compatible path.

This is a product goal, not a shipped compatibility claim. The current PocketRoar PCB remains an engineering candidate until its exact iPhone transport is proven on physical hardware.

## Verified facts

### Sony USB Streaming

- Sony's current ILCE-7M5 guide is a representative example of camera-side USB Streaming. It exposes selectable resolutions through 4K30 and 1080p60, sends **MJPEG or YUV420** video plus 48 kHz PCM audio, and requires SuperSpeed USB 5 Gb/s for 4K or 1080p; a USB 2 connection falls back to 720p. Capabilities are model-specific and must be checked against the exact camera. [Sony ILCE-7M5 USB Streaming guide](https://helpguide.sony.net/ilc/2540/v1/en/contents/211h_usb_streaming.html)
- Sony's Monitor & Control guide distinguishes ordinary USB remote-control connections from HDMI/UVC high-resolution monitoring. Its documented UVC control-device list includes Xperia devices, PDT-FP1, USB 3 USB-C iPads, and macOS devices—not iPhone. Sony also recommends an HDMI-to-UVC conversion adapter when the control device lacks HDMI input. [Sony HDMI/UVC connection guide](https://helpguide.sony.net/promobile/mc/v1/en/contents/connecting_hdmi_uvc.html)

### Apple iPhone and iPad support

- Apple explicitly documents UVC external-camera capture for **USB-C iPads** in iPadOS 17. Apple says AVFoundation converts uncommon UVC pixel formats—including streaming JPEG, H.264, `yuvs`, and `2vuy`—into formats iPad apps commonly handle. [Apple WWDC23: Support external cameras in your iPadOS app](https://developer.apple.com/videos/play/wwdc2023/10106/)
- Apple's `AVCaptureDevice.DeviceType.external` documentation likewise says that **on iPad**, external devices are UVC devices. The symbol's iOS availability alone does not prove that an iPhone exposes an attached UVC camera. [Apple `AVCaptureDevice.DeviceType.external`](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external)
- Apple's current iPhone USB-C guide documents display output, external storage, microphones, Ethernet, SD cards, and USB 3 data rates on Pro models, but it does not document external UVC camera input. [Apple: Charge and connect with the USB-C connector on your iPhone](https://support.apple.com/en-us/105099)

### The likely comparison products

- No official product named exactly **"C2 adapter"** was found in this category.
- The closest wired product to the described goal is **Accsoon SeeMo 4K**. Accsoon calls it an HDMI capture terminal for iPhone and iPad. Its manual says it accepts a camera's HDMI source, performs H.264 compression, sends video to an iPhone/iPad over its USB video-output connection, and requires the Accsoon SEE app. [Accsoon SeeMo 4K product page](https://accsoon.com/accsoon-seemo-4k/) and [SeeMo 4K manual](https://accsoon.com/wp-content/uploads/2024/10/SeeMo-4K-User-Manual-ENCN.pdf)
- **Accsoon CineEye 2** is a plausible match for the remembered name because Accsoon labels its image `C2`. It is not a wired adapter: it accepts HDMI and transmits 1080p60 over Wi-Fi to iOS/Android devices. [Accsoon CineEye 2 support page](https://accsoon.com/support-center/cineeye-2/)

## Inference

- The inspiration is accurately stated as: **Sony cameras can produce a high-quality streaming feed, but the documented native UVC ingestion path exists on USB-C iPad rather than iPhone; PocketRoar motivated a small bridge that makes a camera feed consumable by an iPhone.**
- A SeeMo-like design appears to solve the iPhone problem by doing more than changing connectors: it accepts HDMI, compresses to H.264, and works with a companion iOS app. Its private USB protocol and SDK boundary are not described in the public manual, so RoarCAD must not claim to have replicated that implementation.
- The current RoarCAD candidate path—HDMI receiver to CX3 UVC bridge—resembles the standards-based path Apple documents for iPad. It does **not yet prove the iPhone goal**. A winning but truthful Devpost story should present PocketRoar as the real constraint that motivated RoarCAD and the generated board as an engineering candidate whose unresolved iPhone transport is intentionally caught by RoarCAD's evidence and fabrication gates.

## Unknowns and required proof

- The exact product the user remembers as "C2" remains unconfirmed. SeeMo is the closer functional match; CineEye 2 is the closer name match.
- The exact Sony camera model, firmware, selected USB Streaming format, target iPhone model, iOS version, cable, app ingestion API, and sustained power/thermal behavior are not yet recorded.
- No reviewed primary source establishes a generic direct-UVC camera input path on iPhone. Absence from public documentation is not proof that every UVC device must fail, so the final claim should be **"not natively documented/supported for this workflow"**, not an absolute claim that all iPhones can never ingest USB video.
- Before claiming compatibility, test the exact Sony camera directly, then test a known SeeMo-class product and the candidate board against the exact iPhone. Capture enumeration, negotiated format, rendered frames, disconnect/reconnect, cellular coexistence, accessory power, latency, and sustained thermal behavior.

## Devpost-safe inspiration copy

> PocketRoar began with a practical iPhone limitation. Sony cameras can expose a high-quality USB Streaming feed, but the documented external-camera path is available on USB-C iPad—not iPhone—and Sony's own UVC compatibility guidance omits iPhone. An iPad can already take that class of feed without a custom board; the product need was specifically to get a Sony or other camera's output into an iPhone for mobile streaming. SeeMo-class adapters demonstrate the shape of the solution by accepting HDMI, compressing the video, and delivering it to a companion iOS app. I needed to explore a smaller, purpose-built bridge for PocketRoar, but designing that board safely exposed a second problem: an AI can suggest plausible circuitry without proving footprints, power, bandwidth, signal integrity, host compatibility, or manufacturing readiness. That is why I built RoarCAD—an immutable, human-approved PCB review and handoff system that can generate the PocketRoar engineering candidate while refusing to call unresolved hardware fabrication-ready.
