# PocketRoar capture-board research refresh

> **Scope correction (August 28, 2026):** this document evaluates the standards-based HDMI-to-UVC board candidate. USB-C iPad is the supported comparison case, not the PocketRoar product target. PocketRoar targets iPhone and needs a proven SeeMo-class HDMI/compression/accessory path; see [`pocketroar-iphone-capture-inspiration.md`](./pocketroar-iphone-capture-inspiration.md). The current CX3/UVC graph must not be presented as the finished iPhone bridge.

Checked: 2026-08-25. This note uses current manufacturer, platform-owner, standards-body, and fabricator sources only.

## Decision

**Keep the custom PocketRoar capture board blocked as a product candidate.** A credible research target is narrower: **unprotected HDMI video to a USB-C iPad at 1080p30 over standards-compliant UVC**. The evidence does not support either an iPhone compatibility claim or uncompressed 1080p60 through the proposed Toshiba-to-Infineon bridge.

The next evidence-producing step should be a bench probe, not an eight-layer PCB order:

1. Test a known licensed USB 3 HDMI-to-UVC capture device on every exact Apple device and OS version in scope.
2. Prove discovery, preview, sustained capture, thermals/power, disconnect/reconnect, audio if required, and simultaneous charging if required.
3. Only if the Apple path passes, couple evaluation hardware or modules for the HDMI receiver and CX3, validate one exact 1080p30 format, then freeze the schematic and stackup.

## RoarCAD engineering-candidate package

The checked-in reference graph deliberately freezes only enough exact parts and package identities to exercise RoarCAD's generic eight-layer compile, placement, routing-review, BOM, CPL, validation, and engineering-Gerber path:

| Function | Exact candidate | Package state |
| --- | --- | --- |
| HDMI receiver | `TC358743XBG(EL,NOK` | Toshiba P-TFBGA64, 6 × 6 mm, 0.65 mm pitch; embedded candidate pad map |
| USB/UVC bridge | `CYUSB3065-BZXC` | Infineon PG-LFBGA-121, 10 × 10 mm, 0.8 mm pitch; embedded candidate pad map |
| HDMI connector | `10029449-101RLF` | Amphenol 19-position right-angle connector; mechanical freeze pending |
| USB-C connector | `105450-0101` | Molex 24-contact right-angle receptacle; shell and board thickness pending |
| SuperSpeed mux | `HD3SS3212IRKSR` | TI RKS VQFN-20 |
| CC controller | `TUSB320LAIRWBR` | TI RWB X2QFN-12 |
| Boot flash | `S25FL064LABMFB010` | Infineon SOIC-8 |
| Main rails | `TPS62130ARGTR`, `TPS62160DSGR`, `TPS7A2025PDBVR` | Candidate 1.2 V, 3.3/1.8 V, and 2.5 V regulators |
| Reference clocks | `ECS-2520MV-270-CN-TR`, `ECS-2520MVLC-120-CN-TR` | Candidate 27 MHz and 19.2 MHz clocks |

Every item enters as candidate/unreviewed. The engineering bundle includes `ENGINEERING_ONLY.md`; fabrication export and the independently recompiling quote endpoint reject this project until all gates below close.

## Apple host support

### Fact

- Apple explicitly added external-camera support to **USB-C iPads in iPadOS 17**. Its WWDC session includes UVC devices that are not conventional cameras, such as HDMI switchers, and shows discovery through AVFoundation's `AVCaptureDevice.DeviceType.external`. External devices are hot-pluggable, report an unspecified position, expose varying formats, and may not support ordinary session presets. Apple also documents a limited set of UVC controls and format conversion behavior. [Apple WWDC23: Support external cameras in your iPadOS app](https://developer.apple.com/videos/play/wwdc2023/10106/) and [`AVCaptureDevice.DeviceType.external`](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external)
- Apple lists the iPad models that use USB-C. This is the appropriate starting compatibility set; USB-C presence alone does not prove that every model can sustain every capture format. [Apple: Charge and connect with the USB-C connector on your iPad](https://support.apple.com/en-us/108894)
- iPhone 15 and later use USB-C. Apple identifies USB 3.2 Gen 2, up to 10 Gb/s, only for Pro models in the listed iPhone 15/16/17 generations; base and Plus models operate at USB 2 rates. Apple also says iPhone 15 and later can supply up to 4.5 W to another USB-PD device. [Apple: Charge and connect with the USB-C connector on your iPhone](https://support.apple.com/en-us/105099)
- Apple's MFi FAQ excludes accessories that use only standard USB device classes and no MFi-licensed technology or component. A standards-compliant UVC accessory therefore does not inherently require MFi solely because it connects over USB. [Apple MFi Program FAQ](https://mfi.apple.com/faqs)

### Inference

- USB-C iPad plus standards-compliant UVC is a supportable platform hypothesis, subject to proving the exact descriptors, formats, sustained bandwidth, and power behavior on physical hardware.
- An iPhone Pro's advertised USB 3 link speed removes one bandwidth objection, but it does not establish that iOS exposes a UVC source to AVFoundation.

### Unknown / gate

- No current Apple primary source located in this review says that iPhone accepts a UVC camera as an AVFoundation capture device. Apple's external-camera session is explicitly about iPadOS and USB-C iPads; its iPhone USB-C page lists displays, storage, microphones, Ethernet, and other accessories but does not document UVC camera input.
- iPhone support must remain **unknown**, not assumed, until a physical probe proves device discovery and sustained capture. API availability and connector speed are insufficient evidence.
- Apple's AccessoryAccess framework does not itself establish UVC media support. [Apple AccessoryAccess documentation](https://developer.apple.com/documentation/AccessoryAccess)

## HDMI receiver: Toshiba TC358743XBG

### Fact

- Toshiba currently publishes a product page, a May 2026 datasheet, an orderable part number (`TC358743XBG(EL,NOK`), MOQ 1,500, and an official distributor-stock lookup. The page does **not** state an explicit Active/EOL lifecycle classification. [Toshiba TC358743XBG product page](https://toshiba.semicon-storage.com/eu/semiconductor/product/diodes/detail.TC358743XBG.html)
- The Rev. 2.20 datasheet, dated 2026-05-11, specifies an HDMI 1.4 receiver to MIPI CSI-2 transmitter, up to 1080p60, HDMI clock up to 165 MHz, and up to four CSI-2 lanes at 1 Gb/s each. Listed output formats include RGB and YCbCr; the format table describes 24-bit output paths. The device is a 6 mm × 6 mm, 64-ball, 0.65 mm-pitch BGA with 1.2 V, 1.8 V, 2.5 V, and 3.3 V domains. Typical dissipation is listed as 543.2 mW at 1080p60. HDCP is optional. [Toshiba TC358743XBG datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)
- A distributor page showed point-in-time small-quantity inventory during this review, but that is inventory evidence only, not lifecycle or future-supply evidence. [LCSC TC358743XBG listing](https://www.lcsc.com/product-detail/C3008606.html)

### Inference

- The current Toshiba support surface makes the part reasonable for a lab investigation, but not yet a supply-qualified production choice.
- The BGA, four supply domains, HDMI input, and MIPI output make this a materially harder layout than a simple USB peripheral board.

### Unknown / gate

- Explicit manufacturer lifecycle status, authorized small-quantity supply, long-term availability, and access to the complete programming/register guidance remain unverified.
- Exact register settings and CSI timing for a CX3-compatible 1080p30 mode must be obtained and proven. The public datasheet alone is not an implementation recipe.
- Optional HDCP capability does not grant HDCP keys or permission. Protected-content capture is out of scope.

## USB/UVC bridge: Infineon EZ-USB CX3 CYUSB3065

### Fact

- Infineon currently marks `CYUSB3065-BZXC` **Active and preferred**. It is a MIPI CSI-2 to USB 3.2 Gen 1 bridge with a 5 Gb/s USB interface, ARM926EJ-S CPU, 512 KB memory, and a 10 mm × 10 mm, 121-ball, 0.8 mm-pitch BGA. [Infineon CYUSB3065-BZXC product page](https://www.infineon.com/part/CYUSB3065-BZXC)
- The current datasheet identifies the part as in production. It supports four CSI-2 lanes at up to 1 Gb/s per lane, but states that **aggregate CSI-2 input must not exceed 2.4 Gb/s**. Supported inputs include RAW, YUV422/YUV444, and RGB formats. The USB peripheral supports UVC. [Infineon CYUSB306x CX3 datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)
- The datasheet describes boot-time enumeration using Cypress VID `0x04B4` for firmware download, followed by re-enumeration with the downloaded firmware's descriptors. This is boot behavior, not permission to ship a product under Infineon's VID.
- Infineon's CX3/FX3 SDK includes firmware source and examples, UVC bulk/isochronous examples, sensor examples, and tools for Windows, Linux, and macOS. [Infineon EZ-USB FX3 SDK](https://www.infineon.com/cms/en/design-support/tools/sdk/usb-controllers-sdk/ez-usb-fx3-software-development-kit/)
- Infineon's current CX3 application note describes its configuration tool and specifies MIPI routing guidance: differential traces no longer than 100 mm, 100 Ω ±10%, intra-pair mismatch below 0.5 mm, inter-lane mismatch below 1.5 mm, and pair spacing of twice the trace width. [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)
- Infineon publishes a UVC implementation guide and an FX3 hardware-design checklist. The design has several supply domains, two clocks, USB 3 routing, power sequencing, and documented silicon errata/workarounds to review. [Infineon AN75779](https://www.infineon.com/dgdl/Infineon-AN75779_How_to_Implement_an_Image_Sensor_Interface_with_EZ-USB_FX3_in_a_USB_Video_Class_%28UVC%29_Framework-ApplicationNotes-v13_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073ad2b85f0d) and [Infineon AN70707](https://www.infineon.com/assets/row/public/documents/24/42/infineon-an70707-ez-usb-fx3-fx3s-sx3-hardware-design-guidelines-and-schematic-checklist-applicationnotes-en.pdf)
- Infineon's current Denebola CX3 reference product proves uncompressed UVC at 1080p30 or 720p60 with an OV5640 sensor. It does not prove 1080p60, the Toshiba receiver, Apple-host compatibility, or open design-file availability; Infineon describes the board as a partner paper design, and its support forum directs OrCAD-file requests to e-con Systems. [Infineon Denebola evaluation board](https://www.infineon.com/evaluation-board/VD-USB-DENEBOLA-CAMERA) and [Infineon support response on design files](https://community.infineon.com/t5/USB-superspeed-peripherals/CX3-DVK/td-p/1092338)

### Inference

- Uncompressed 1080p60 at 24 bits per pixel is not viable through CX3's documented 2.4 Gb/s aggregate CSI ceiling: active pixels alone require about 2.99 Gb/s (`1920 × 1080 × 60 × 24`), before blanking and protocol overhead.
- 1080p30 is a credible research target because it is below that raw-rate ceiling and Infineon's reference design demonstrates uncompressed 1080p30. This is not proof that the Toshiba receiver and CX3 interoperate at that mode.
- CX3, rather than the nominal 5 Gb/s USB link, is the likely throughput bottleneck. Infineon's high FX3 throughput numbers are internal-data benchmarks and explicitly warn that external-input throughput is lower. [Infineon AN86947](https://www.infineon.com/assets/row/public/documents/24/42/infineon-an86947-optimizing-usb-3.0-throughput-with-ez-usb-fx3-applicationnotes-en.pdf?fileId=8ac78c8c7cdc391c017d073e3a2e6243)

### Unknown / gate

- Exact Toshiba-to-CX3 packing, blanking, clocking, firmware descriptors, and Apple-accepted output pixel format need bench proof.
- Audio integration, simultaneous capture and charging, thermals, current budget, EMI, and disconnect recovery are unproven.
- CX3 is a USB device/sink. Charge pass-through or USB-PD is a separate architecture and must not be implied by the capture bridge.

## USB-C orientation and protection candidates

### Fact

- Infineon states that a USB-C receptacle design must select between duplicated SuperSpeed pairs based on plug orientation; its guidance uses a CC/orientation controller and a SuperSpeed mux. [Infineon: Designing Type-C products based on EZ-USB FX3 and CX3](https://community.infineon.com/t5/Knowledge-Base-Articles/Designing-Type-C-products-based-on-EZ-USB-FX3-and-CX3/ta-p/251806)
- TI marks the **HD3SS3212** active. It is a passive two-channel 2:1/1:2 mux/demux rated for USB 3.1, 10 Gb/s, with 8 GHz bandwidth in a 20-pin VQFN. [TI HD3SS3212](https://www.ti.com/product/HD3SS3212)
- TI marks the **TUSB320LAI** active. It provides USB Type-C CC logic, UFP/DFP/DRP role support, cable-orientation detection, VBUS detection, and I2C/GPIO control. It is not a USB-PD controller. [TI TUSB320LAI](https://www.ti.com/product/TUSB320LAI)
- TI marks the **TPD4E02B04** active. It is a four-channel, bidirectional, 0.25 pF typical ESD array intended for USB 3.x/Type-C and other high-speed interfaces, rated up to 10 Gb/s and ±12 kV IEC contact discharge. [TI TPD4E02B04](https://www.ti.com/product/TPD4E02B04)

### Inference

- HD3SS3212 plus TUSB320LAI is a plausible orientation-control pair for a USB-C receptacle. Two four-channel TPD4E02B04 arrays would likely be needed to protect all eight pre-mux SuperSpeed conductors; USB 2 D+/D−, CC pins, and VBUS need separate protection decisions.

### Unknown / gate

- Final mux, CC, ESD, and power-path selection requires schematic review, insertion-loss/S-parameter review, the actual connector pinout, and a decision on whether simultaneous charging or USB-PD is required.

## JLCPCB fabrication and API boundary

### Fact

- JLCPCB advertises fabrication from 1 to 32 layers and controlled impedance on 4-, 6-, 8-, and higher-layer boards. Its general capability table lists standard impedance tolerance of ±10%. [JLCPCB capabilities](https://jlcpcb.com/capabilities/Capabilities%2C/)
- JLCPCB's impedance calculator supports 4- through 8-layer designs, selectable stackups, differential targets from 50 Ω to 150 Ω, and requires a ground reference. Its guide states assumptions such as Nan Ya NP-155F material and 1 oz external copper; the design must use the exact order stackup rather than generic trace widths. [JLCPCB impedance-calculator guide](https://jlcpcb.com/help/article/user-guide-to-the-jlcpcb-impedance-calculator)
- JLCPCB publishes standard multilayer structures through 32 layers. Its stackup material also distinguishes free and chargeable impedance-control tolerances, so the actual order configuration and engineering confirmation control over a generic capability-page number. [JLCPCB multilayer stackups](https://jlcpcb.com/help/article/multi-layer-pcb-standard-laminated-structures)
- JLCPCB offers an API application flow. Its public portal describes PCB quote/order/status APIs and component inventory/pricing/specification APIs; account application, app creation, credentials, and testing/support are required. [JLCPCB OpenAPI portal](https://api.jlcpcb.com/)

### Inference

- JLCPCB can fabricate an eight-layer controlled-impedance board of this class in principle. Eight layers are reasonable for BGA escape, power/ground planes, 100 Ω MIPI, 90 Ω USB, and HDMI routing, but layer count alone does not make the design manufacturable or electrically correct.

### Unknown / gate

- Exact stackup, via types, BGA escape, trace geometries, assembly rules, impedance coupon/acceptance terms, and DFM approval remain order-specific.
- Live quoting or ordering must remain disabled until a real account's API access and contract are verified. The public portal is not an anonymous, stable ordering contract.

## USB identity and HDMI licensing

### Fact

- USB-IF currently offers a Vendor ID through annual membership or a one-time VID purchase. Use of USB-IF logos additionally requires the logo-license agreement, compliance testing, and listing. [USB-IF: Getting a Vendor ID](https://www.usb.org/getting-vendor-id) and [USB-IF Logo License](https://usb.org/logo-license)
- A production device must use a legitimately controlled or explicitly sublicensed VID/PID. Infineon's bootloader VID is not a production product identity.
- HDMI Licensing Administrator states that a finished end-user product must itself be licensed even when it incorporates licensed HDMI components. The manufacturer must be an HDMI Adopter and the product must meet the adopter agreement's compliance requirements. [HDMI Adopter overview](https://www.hdmi.org/adopter/index) and [HDMI enforcement guidance](https://www.hdmi.org/adopter/enforcement)
- HDMI brand use is governed separately by HDMI's trademark guidance and adopter agreement. [HDMI brand guidance](https://www.hdmi.org/resource/brand)

### Inference

- A custom board with an exposed HDMI input is not merely a PCB-design problem; it creates adopter, compliance, trademark, and possibly HDCP obligations before a finished product can be represented or sold.
- A purchased, licensed HDMI-to-UVC device is the lower-risk way to validate the Apple experience before assuming those obligations.

### Unknown / gate

- Exact adopter fees, per-unit royalties, testing route, prototype exception if any, and manufacturing-party responsibility must be confirmed directly under the current HDMI agreement before commercialization.
- HDCP licensing, key provisioning, and protected-content policy are not established. Scope the prototype to unprotected camera output and do not promise protected-source capture.

## Evidence required to unblock a board revision

1. Exact camera/source model and unprotected HDMI mode, including pixel format, frame rate, audio requirement, and hot-plug behavior.
2. Exact Apple host model and OS, with a physical UVC proof. Treat iPhone and iPad as separate evidence lanes.
3. A measured 1080p30 Toshiba-to-CX3 CSI configuration with firmware descriptors that the selected Apple host accepts.
4. Power budget, connector role, charge/pass-through decision, and USB-C/PD architecture.
5. Legitimate VID/PID plan and a written HDMI/HDCP licensing determination.
6. Final eight-layer stackup, impedance calculations, SI review, DFM review, and a test plan that does not equate first frame with sustained success.
