# PocketRoar electrical completion research

**Checked:** 2026-08-25  
**Scope:** one-board HDMI receiver to USB-C SuperSpeed UVC bridge for USB-C iPad  
**Evidence policy:** manufacturer, standards-body, Apple, and upstream implementation sources only

> **Comparison only (August 28, 2026):** this report remains useful for the CX3/UVC engineering study. It does not define or prove the final iPhone transport architecture.

## Executive verdict

PocketRoar is electrically plausible as a **video-only, unprotected-HDMI engineering prototype** built around the Toshiba `TC358743XBG` and Infineon `CYUSB3065-BZXC`. It is not yet a complete or fabrication-ready design.

### Current RoarCAD feasibility slice

The August 28 fixture correction replaces generic connector stand-ins with exact upstream KiCad pad geometry, maps the documented TC358743 BGA balls, maps the bridge-critical CX3 balls, corrects the CX3 system oscillator to the manufacturer-documented 19.2 MHz part, applies net-class trace widths, and uses explicit filled/capped via-in-pad escapes for the 0.65 mm BGA. Its 2,566-element Circuit JSON has zero compiler and independent checker errors.

That result covers only the eleven modeled routes. The graph still omits the complete power, decoupling, reset, boot, I2C, HDMI, CSI lane, USB-C, protection, and unused-pin networks described below. Differential impedance, coupling, and routed-length skew are recorded but not verified. This is a digitally clean feasibility slice, not a complete schematic or fabrication release.

The best defensible first target is:

- HDMI input with no HDCP claim;
- 1920 × 1080 at 30 frames/s, YCbCr 4:2:2;
- four-lane MIPI CSI-2 from the TC358743 to the CX3, emitting YUY2 or UYVY;
- SuperSpeed USB UVC bulk transfer to a USB-C iPad;
- video only, with no simultaneous charging claim;
- EDID advertising only modes proven on hardware.

That target fits the published bridge capabilities: the TC358743 supports HDMI up to 165 MHz and four CSI-2 lanes at 1 Gb/s per lane, while the CYUSB3065 supports four lanes at 1 Gb/s per lane but limits total input throughput to 2.4 Gb/s. The unblanked 1080p30 YUY2 payload is approximately 995 Mb/s before CSI-2, blanking, and USB overhead. This arithmetic is an engineering feasibility check, not proof of stable operation. [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG), [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559), [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)

Three concrete problems in the current candidate architecture must be corrected before schematic freeze:

1. **Audio cannot be wired directly from the TC358743 I2S output into CX3.** The CX3 I2S block is a master transmitter, not an audio input. PocketRoar must either be explicitly video-only or add a separate audio-ingest and USB Audio Class path. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559), [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)
2. **The candidate connectors specify incompatible PCB thicknesses.** Amphenol `10029449-101RLF` is documented for a 1.6 mm PCB, while Molex `105450-0101` is documented as a 0.8 mm-PCB top-mount receptacle. One of the two connector selections or its mechanical strategy must change. [Amphenol 10029449-101RLF](https://www.amphenol-cs.com/product/10029449101rlf.html), [Molex 105450 series](https://www.molex.com/en-us/products/series-chart/105450)
3. **`TPD1S514-3` is the wrong overvoltage variant for a 5 V-only sink.** Its approximately 13.75 V overvoltage threshold does not provide the intended 5 V rail protection. If this family is retained, the approximately 5.95 V `TPD1S514-1` variant is the plausible candidate, subject to a complete Type-C power-path review. [TI TPD1S514 datasheet](https://www.ti.com/lit/ds/symlink/tpd1s514.pdf)

## Verified facts

### 1. TC358743XBG function, package, and interfaces

The TC358743 is an HDMI 1.4 receiver and protocol converter. It accepts RGB or YCbCr HDMI video, contains a 1 KB EDID SRAM, supports a base 128-byte EDID plus the first 128-byte CEA extension, and can transmit video, audio packets, and InfoFrames over four-lane CSI-2. It also exposes a separate I2S/TDM audio output. Its public maximums are 165 MHz HDMI input clock and 1 Gb/s per CSI-2 lane. These are device limits, not a guarantee that every format within those maxima works with CX3 firmware or an iPad. [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)

The exact 8 × 8 XBG ball map from the public datasheet is:

| Row | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| A | REXT | VSS | VPGM | BIASDA | DAOUT | PFIL | CSID3N | CSID3P |
| B | AVDD33 | AVDD12 | INT | IR | AVDD25 | PCKIN | CSID2N | CSID2P |
| C | HDMICP | HDMICN | VDDC2 | VSS | VSS | VDD_MIPI | CSICN | CSICP |
| D | HDMID0P | HDMID0N | AVDD12 | VSS | VSS | VSS | CSID1N | CSID1P |
| E | HDMID1P | HDMID1N | VSS | VSS | TEST | VSS | CSID0N | CSID0P |
| F | HDMID2P | HDMID2N | AVDD33 | VDDIO1 | VDDC2 | VDD_MIPI | A_SCK | A_SD |
| G | CEC | VDDC1 | DDC_SDA | I2C_SDA | RESETN | EDID_SDA | A_WFS | A_OSCK |
| H | HPDO | HPDI | DDC_SCL | I2C_SCL | REFCLK | EDID_SCL | VDDIO2 | VSS |

The CAD symbol must be checked ball-for-ball against the current Toshiba package table before layout. Names in this table must not be inferred from a generic bridge symbol.

#### TC358743 rails and mandatory static connections

| Domain | Voltage | Balls / count | Verified requirement |
|---|---:|---|---|
| VDDC1 / VDDC2 | 1.2 V | G2, C3, F5 | digital core supply |
| VDD_MIPI | 1.2 V | C6, F6 | CSI-2 PHY supply |
| AVDD12 | 1.2 V | B2, D3 | HDMI analog 1.2 V supply |
| AVDD25 | 2.5 V | B5 | HDMI analog 2.5 V supply |
| AVDD33 | 3.3 V | B1, F3 | HDMI analog 3.3 V supply |
| VDDIO1 | 3.3 V | F4 | HDMI DDC/CEC/HPD-side I/O; relevant pins are 5 V tolerant where stated by Toshiba |
| VDDIO2 | 1.8 V or 3.3 V | H7 | controller I2C and related digital I/O domain |
| REXT | — | A1 | connect to AVDD33 through 2.0 kΩ ±1% |
| VPGM | — | A3 | tie to ground |
| TEST | — | E5 | hold low |

The datasheet gives a typical total power of 543.2 mW for 1080p60 operation. That number is useful for a first thermal and regulator budget, but it does not specify startup inrush, worst-case current by rail, or transient behavior. [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)

The part accepts a 27 MHz, 26 MHz, or 42 MHz reference-clock family as described by Toshiba. `RESETN` is active low. If the separate audio PLL path is unused, Toshiba directs `BIASDA`, `PCKIN`, and `PFIL` to analog ground through 0.1 µF capacitors and leaves `DAOUT` open. This is the correct starting condition for a video-only prototype. [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)

#### Public-document gap

The public Toshiba datasheet does **not** publish the complete register map, I2C slave address, power-up sequence, rail-by-rail decoupling network, or a reference schematic. Toshiba's public product/document pages did not expose a functional specification or an evaluation-board design during this review. These omissions prevent an evidence-complete schematic and deterministic startup implementation.

The upstream Linux driver is useful implementation evidence: it includes CSI timing, HDMI PHY setup, audio setup, EDID SRAM programming, and an HPD sequence that lowers HPD, disables DDC/EDID access, writes EDID, and raises HPD after a delay. However, the driver itself cites a non-public Toshiba functional specification and spreadsheet. It is GPL-2.0-only, is not a Toshiba warranty of the design, and should be treated as a prototype oracle rather than copied into a differently licensed firmware product. [Linux TC358743 driver](https://github.com/torvalds/linux/blob/master/drivers/media/i2c/tc358743.c), [Linux TC358743 platform header](https://github.com/torvalds/linux/blob/master/include/media/i2c/tc358743.h)

### 2. CYUSB3065-BZXC function and exact bridge-critical balls

The CYUSB3065 combines a MIPI CSI-2 receiver, 24-bit GPIF II path, ARM926EJ-S CPU, 512 KB SRAM, USB 3.0/2.0 peripheral, DMA engine, and UVC-capable firmware platform. It accepts up to four 1 Gb/s CSI lanes, but its aggregate MIPI input limit is 2.4 Gb/s. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559), [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)

The following exact BGA balls are the minimum required to build and audit this bridge. The complete vendor table remains authoritative for every GPIO, ground, and no-connect ball.

| Function | Positive / signal | Negative / companion | Notes |
|---|---|---|---|
| CSI clock | J7 `CLK_P` | K7 `CLK_N` | connect to TC `CSICP/CSICN` |
| CSI lane 0 | J5 `D0_P` | K5 `D0_N` | connect to TC `CSID0P/N` |
| CSI lane 1 | J6 `D1_P` | K6 `D1_N` | connect to TC `CSID1P/N` |
| CSI lane 2 | J8 `D2_P` | J9 `D2_N` | connect to TC `CSID2P/N` |
| CSI lane 3 | L8 `D3_P` | K8 `D3_N` | connect to TC `CSID3P/N` |
| USB SuperSpeed RX | A4 `RX_P` | A3 `RX_M` | routes through orientation mux from connector TX pair |
| USB SuperSpeed TX | A5 `TX_P` | A6 `TX_M` | AC coupling required in the approved location |
| USB 2.0 | A9 `DP` | A10 `DM` | D+/D− from both receptacle orientations are joined per Type-C receptacle rules |
| MIPI reference | F2 `REFCLK` | — | 6–40 MHz permitted range; exact configuration-dependent value required |
| system input clock | D7 `CLKIN` | — | 19.2 MHz required |
| optional watchdog clock | D6 `CLKIN_32` | — | optional 32 kHz source |
| I2C | D10 `SDA` | D9 `SCL` | CX3 is master; external pull-ups to VDDIO1 |
| SPI boot | D4 `SCK`, C1 `SSN` | C2 `MISO`, D5 `MOSI` | boot flash interface |
| boot mode | G4, H4, L4 | — | `PMODE[2:0]`; strap exact boot mode |
| resets | C5 `RESET#` | H6 `MIPI_RESET` | `MIPI_RESET` is held low for normal use per datasheet |

Power balls and legal supply ranges are:

| Domain | Exact ball(s) | Voltage |
|---|---|---:|
| VDD | B10, J11, C3, E9, F11, H1, L7 | 1.2 V |
| AVDD | A7 | 1.2 V |
| U3TXVDDQ | B5 | 1.2 V |
| U3RXVDDQ | A2 | 1.2 V |
| VDD_MIPI | L5 | 1.2 V |
| VUSB | E10 | 4.0–6.0 V; nominal USB VBUS |
| CVDDQ | B6 | 1.7–3.6 V |
| VDDIO1 | H11, L9 | 1.7–3.6 V |
| VDDIO2 | E3 | 1.7–3.6 V |
| VDDIO3 | B1 | 1.7–3.6 V |
| AVSS | B7 | ground |

The datasheet's static current figures include up to 192 mA for core/analog domains and up to 60 mA for the USB block; they are not a complete board peak-current model. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

The following datasheet-designated DNU balls must not be connected or repurposed: `F10`, `F9`, `F7`, `G10`, `G9`, `F8`, `H10`, `H9`, `J10`, `H7`, `K11`, `L10`, `K10`, `K9`, `G7`, `G8`, `K2`, `J4`, `K1`, `J2`, `J3`, `J1`, `H2`, `H3`, and `F1`. The production symbol review must also verify every ground ball and every unused GPIO against the current package table. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

### 3. CX3 clocks, reset, power, decoupling, and boot

CX3 requires both a 19.2 MHz `CLKIN` and a 6–40 MHz MIPI `REFCLK`. If one oscillator feeds both inputs, Infineon requires a two-output buffer rather than a simple branch; the buffer supply, `CVDDQ`, and `VDDIO1` must be at the same voltage. Clock phase-noise and jitter limits in the datasheet are design requirements, not optional oscillator marketing values. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

The published power sequence starts with VBUS/VUSB and the 1.2 V domains, followed by VDDIO1, then the remaining I/O domains and clocks before reset release. Reset must remain asserted for at least 1 ms. VDDIO1 must remain powered in normal operation. The exact timing diagram and its notes must be copied into the board bring-up checklist rather than reduced to firmware assumptions. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

Infineon's hardware guideline gives the following starting decoupling architecture. Capacitors must be placed at the owning balls with a short return to the same ground reference; values must be cross-mapped to the CYUSB3065 package rather than copied from an FX3 package drawing:

- VDD group: 22 µF bulk plus local 0.1 µF / 0.01 µF capacitors at the individual supply pins as shown in the guideline;
- AVDD: 2.2 µF bulk plus 0.1 µF local;
- U3RXVDDQ and U3TXVDDQ: 22 µF plus 0.1 µF each;
- CVDDQ and I/O domains: 0.1 µF and 0.01 µF local networks;
- VBUS/VUSB: 0.1 µF local, plus the Type-C sink's permitted bulk capacitance;
- ferrite-bead isolation for the analog/PHY domains exactly where the guideline recommends it.

The 1.2 V domains can draw a short transient approaching 800 mA during PHY enable/reset. Regulator transient response and the 22 µF bulk network therefore need power-integrity simulation and oscilloscope proof; average-current sizing is insufficient. [Infineon AN70707](https://www.infineon.com/dgdl/Infineon-AN70707_EZ-USB_FX3_FX3S_SX3_hardware_design_guidelines_and_schematic_checklist-ApplicationNotes-v18_00-EN.pdf?fileId=8ac78c8c7cdc391c017d0739793e5dfd)

CX3 boots from USB, I2C EEPROM, or SPI flash according to `PMODE[2:0]`. Infineon documents an SPI-with-USB-fallback strap of `0F1`, where `F` is floating. Supported SPI families include Infineon S25FS064S/S25FS128S/S25FL064L and Winbond W25Q32FW. For SPI boot, the hardware guideline specifies a 2 kΩ pulldown on MISO and no pull-ups on MISO/MOSI, and lists the flash command set expected by the boot ROM. The exact flash package, I/O voltage, capacity, and programmer flow must be frozen together. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559), [Infineon AN70707](https://www.infineon.com/dgdl/Infineon-AN70707_EZ-USB_FX3_FX3S_SX3_hardware_design_guidelines_and_schematic_checklist-ApplicationNotes-v18_00-EN.pdf?fileId=8ac78c8c7cdc391c017d0739793e5dfd)

CX3 is the I2C master and its SDA/SCL require external pull-ups to VDDIO1. Its reserved internal I2C address pattern includes `0x0E/0x0F`; the TC358743's actual address must be obtained from authoritative Toshiba documentation and checked for collision before firmware and resistor straps are finalized. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

### 4. Public reference-design status

Infineon points designers to the Denebola CYUSB3065 development kit created by design partner e-con Systems. Infineon support has stated that the board's OrCAD source cannot be distributed by Infineon because e-con owns it, and directs requests for schematics/layout to that partner. Therefore, there is no freely reusable Infineon-owned exact CX3 reference schematic/layout in the reviewed public materials. Obtaining the Denebola design package or an Infineon/e-con schematic review is a completion gate. [Infineon Denebola board](https://www.infineon.com/evaluation-board/VD-USB-DENEBOLA-CAMERA), [Infineon support: CYUSB3065 reference design](https://community.infineon.com/t5/USB-superspeed-peripherals/cyusb3065-Hardware-reference-design/td-p/451835), [Infineon support: CX3 DVK source ownership](https://community.infineon.com/t5/USB-superspeed-peripherals/CX3-DVK/td-p/1092338)

No public Toshiba TC358743 reference schematic or full functional specification was located in Toshiba's public product/document catalog during this review. A Toshiba support/NDA request is required.

### 5. HDMI input, protection, EDID, and HPD

The Amphenol `10029449-101RLF` is a 19-position, right-angle, surface-mount HDMI Type-A receptacle specified for a 1.6 mm PCB. Its official drawing, not a generic Type-A footprint, must control the pad pattern, shell stakes, board edge, and enclosure datum. [Amphenol 10029449-101RLF](https://www.amphenol-cs.com/product/10029449101rlf.html)

TI's `TPD12S520` integrates protection for one HDMI receiver port: 12 low-capacitance ESD channels plus DDC/CEC/HPD level shifting and protection. Its datasheet contains a receiver-side application schematic. If retained, the final schematic must map its 5 V, low-voltage logic, DDC, CEC, HPD-in, and HPD-out pins exactly to the connector and TC358743 domains. The device's IBIS model is published on TI's product page. [TI TPD12S520 datasheet](https://www.ti.com/lit/ds/symlink/tpd12s520.pdf), [TI TPD12S520 product page](https://www.ti.com/product/TPD12S520)

The TC358743 contains the EDID SRAM but the host firmware must program it before asserting HPD. The upstream Linux driver demonstrates a conservative sequence: drive HPD low, disable DDC/EDID access, write the EDID SRAM, re-enable the path, delay, and raise HPD. The production sequence must be reconciled with Toshiba's functional specification. EDID should initially advertise only unprotected 1080p30 YCbCr 4:2:2 and any fallback modes actually proven at the bench. [Toshiba TC358743 datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG), [Linux TC358743 driver](https://github.com/torvalds/linux/blob/master/drivers/media/i2c/tc358743.c)

The TC358743 mentions HDCP capability, but capability does not confer keys, adopter status, content authorization, or product compliance. The MVP must reject or fail clearly on protected sources and make no HDCP claim. HDMI Licensing states that a finished product must be licensed and pass the applicable compliance testing even when it uses licensed components. [HDMI enforcement and licensing](https://www.hdmi.org/adopter/enforcement), [HDMI authorized test centers](https://www.hdmi.org/adopter/atcs)

### 6. USB-C orientation, power negotiation, mux, and protection

The CX3 is a USB device/UFP. With a USB-C receptacle, the duplicated SuperSpeed pairs require orientation routing through a high-speed mux, while the two USB 2.0 D+/D− receptacle contacts are joined according to the Type-C receptacle design rules. Infineon's Type-C guidance says a PD controller is not required only when the product consumes 5 V within the current advertised through CC; that does not permit the board to assume 1.5 A or 3 A. [Infineon Type-C guidance for FX3/CX3](https://community.infineon.com/t5/Knowledge-Base-Articles/Designing-Type-C-products-based-on-EZ-USB-FX3-and-CX3/ta-p/251806)

The candidate `TUSB320LAI` can act as the UFP Type-C CC controller. In its documented UFP/I2C configuration:

- power it from 2.75–5.0 V with 100 nF local bypass;
- hold `PORT` low for UFP mode;
- hold `ADDR` low for I2C address `0x47`;
- sense VBUS through the documented 900 kΩ path;
- use 4.7 kΩ pull-ups for SCL/SDA to the selected 1.8 V or 3.3 V I/O rail;
- pull `INT_N` up with 200 kΩ;
- hold `EN_N` low if the controller is always enabled;
- keep VBUS bulk within the documented 1–10 µF UFP example range unless a complete inrush design justifies otherwise.

[TI TUSB320LAI datasheet](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf)

The candidate `HD3SS3212` is a passive 3.3 V 2:1/1:2 SuperSpeed mux. Its `SEL`, output-enable, supply decoupling, ground pad, and channel orientation must follow the TI checklist. USB transmit AC-coupling capacitors belong at the location required by the combined CX3/mux architecture; Infineon's guidance places them between the connector and mux for this topology, while TI's EVM uses 220 nF within the USB SuperSpeed permitted range. Caps must not be duplicated on both sides of a channel without proving the mux bias requirements. [TI HD3SS3212 product page](https://www.ti.com/product/HD3SS3212), [TI HD3SS3212 EVM guide](https://www.ti.com/lit/ug/slau785/slau785.pdf), [TI high-speed mux schematic checklist](https://www.ti.com/lit/an/slla481/slla481.pdf), [Infineon Type-C guidance for FX3/CX3](https://community.infineon.com/t5/Knowledge-Base-Articles/Designing-Type-C-products-based-on-EZ-USB-FX3-and-CX3/ta-p/251806)

`TPD2S300` is appropriate as a CC1/CC2 short-to-VBUS and ESD protection candidate. A low-capacitance device such as `ESD122` or `TPD4E02B04` is appropriate in principle for the SuperSpeed/USB2 channels, but the final channel count, orientation, connector-side placement, return via geometry, and insertion-loss budget must be enumerated rather than inferred from a generic “ESD” block. TI directs the protection device to be placed as close as practical to the connector with straight-through routing and minimal stubs. [TI TPD2S300 datasheet](https://www.ti.com/lit/ds/symlink/tpd2s300.pdf), [TI ESD122](https://www.ti.com/product/ESD122), [TI TPD4E02B04](https://www.ti.com/product/TPD4E02B04)

The selected Molex `105450-0101` is a 24-contact, top-mount USB-C receptacle documented for a 0.8 mm PCB, conflicting with the selected HDMI receptacle's 1.6 mm requirement. The exact `-0101` sales drawing must be obtained and used; a drawing for a nearby `105450` suffix is not sufficient. [Molex 105450 series](https://www.molex.com/en-us/products/series-chart/105450)

### 7. MIPI and USB routing requirements

Infineon's current CX3 MIPI guidance specifies:

- MIPI differential impedance: 100 Ω ±10%; 
- TC-to-CX3 route length: no more than 100 mm;
- within-pair mismatch: less than 0.5 mm;
- lane-to-lane mismatch: less than 1.5 mm;
- differential-pair spacing from unrelated copper: approximately twice the trace width or the stackup solver's stricter result.

The exact stackup and field-solver geometry are required to turn those constraints into trace widths and spacing. [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)

Infineon specifies 90 Ω differential USB routing with a ±7% target in its hardware guideline, continuous reference planes, minimized vias and stubs, and ground stitching at transitions. The guideline recommends at least four layers; this BGA/high-speed design is appropriately treated as an eight-layer engineering candidate, but “eight layers” alone does not establish impedance or signal integrity. [Infineon AN70707](https://www.infineon.com/dgdl/Infineon-AN70707_EZ-USB_FX3_FX3S_SX3_hardware_design_guidelines_and_schematic_checklist-ApplicationNotes-v18_00-EN.pdf?fileId=8ac78c8c7cdc391c017d0739793e5dfd)

### 8. Firmware and UVC behavior

The firmware must perform at least these jobs:

1. boot from supported SPI flash with USB recovery available;
2. sequence/reset supplies and configure the TC358743 over I2C;
3. write a conservative EDID before raising HPD;
4. detect HDMI lock, parse the input timing, and reject unsupported/protected modes visibly;
5. configure the TC output data type, lane count, and CSI timing;
6. configure CX3's MIPI receiver using exact `THS-Prepare`, `THS-Zero`, clock, active, blanking, and frame-rate values;
7. expose UVC descriptors whose width, height, frame interval, and YUY2/UYVY format exactly match the stream;
8. implement UVC PROBE/COMMIT, DMA buffer management, payload headers, suspend/resume, disconnect, and recovery from stuck DMA/MIPI errors;
9. report lock, timing, MIPI error counters, USB speed, dropped frames, and reset reason through a safe diagnostic path;
10. ship under a product-owned USB VID/PID before distribution.

Infineon's AN90369 example demonstrates uncompressed YUY2 at 1920 × 1080/30 and 1280 × 720/60, UVC bulk endpoints, PROBE/COMMIT, DMA recovery, and MIPI error counters. It is the correct baseline architecture, but its sensor settings cannot be reused as TC358743 settings. The CX3 configuration tool requires the real TC output timing and PHY values. [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)

Infineon permits the Cypress VID (`0x04B4`) for the bootloader/renumeration stage described in its examples, not as PocketRoar's production identity. Production firmware needs an authorized VID/PID and descriptors matching the physical behavior. [Infineon CYUSB306x datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)

Apple identifies USB Video Class devices as external capture devices on iPad, and Apple's WWDC material demonstrates USB-C iPad support for external UVC cameras and HDMI-switcher-like sources. This establishes platform support, not compatibility with this board. Real enumeration, stream stability, reconnect, suspend, thermals, and application behavior must be tested on each claimed iPad/OS combination. [Apple external capture device documentation](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external), [Apple WWDC23: external cameras on iPad](https://developer.apple.com/videos/play/wwdc2023/10106/)

## Engineering assumptions — not yet verified

The following choices are reasonable starting points, not facts established by the source set:

| Assumption | Why it is plausible | What must verify it |
|---|---|---|
| 1080p30 YCbCr 4:2:2 is the initial maximum | active payload is ~995 Mb/s and AN90369 demonstrates 1080p30 YUY2 | exact HDMI blanking, TC register setup, CSI packet overhead, CX3 configuration, USB traces, and sustained iPad capture |
| Four CSI-2 lanes are used | lowers lane rate and fits both devices | exact TC lane mapping, polarity, data type, lane rate, and CX3-generated configuration |
| TC VDDIO2 and CX3 VDDIO1 use the same logic rail | simplifies direct I2C control | Toshiba I/O thresholds, pull-up budget, rail sequencing, and clock-buffer voltage review |
| One 27 MHz oscillator can feed TC REFCLK and a qualified buffer path for CX3 clocks | TC accepts 27 MHz and CX3 REFCLK accepts it | CX3 still needs independent 19.2 MHz CLKIN unless an approved clock tree generates both; phase-noise and voltage validation |
| The board is bus powered | simplest iPad connection | measured source current advertisement, total worst-case load, inrush, VBUS droop, and iPad behavior |
| Eight layers are sufficient | provides BGA escape and dedicated references | manufacturer stackup, via technology, impedance solver, SI/PI analysis, and DFM review |
| S25FL064L-family flash is suitable | listed by Infineon as supported | exact MPN/package, 1.8/3.3 V choice, commands, straps, programmer, and lifecycle |
| Video-only is acceptable for the MVP | avoids the impossible direct I2S path | product requirement approval and UI disclosure |

The design must not claim 1080p60. At 16 bits/pixel, the active 1080p60 payload is about 1.99 Gb/s before blanking and protocol overhead, close to CX3's 2.4 Gb/s aggregate ceiling. RGB888 1080p60 active payload is about 2.99 Gb/s and exceeds that ceiling before overhead. [Infineon AN90369](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)

## Missing authoritative data

These documents or answers are required before the design can be called electrically complete:

### Toshiba request package

- TC358743 functional specification and complete register map;
- authoritative I2C address and any address/strap options;
- power-up/down sequence, reset timing, and rail-current maxima by domain;
- recommended decoupling and reference schematic;
- CSI-2 output timing/data-type examples for 1080p30 YCbCr 4:2:2;
- official IBIS/SPICE models, package model, and layout guidance;
- errata and current lifecycle/availability statement;
- HDCP-disabled initialization guidance.

### Infineon/e-con request package

- Denebola schematic, BOM, layout constraints, and legal reuse terms;
- CX3 schematic/layout review for the selected BGA, clocks, flash, power tree, and USB path;
- confirmed MIPI configuration values for the TC358743 stream;
- current CX3 SDK/toolchain support and production-programming flow;
- authorized USB VID/PID plan.

### Mechanical and provider package

- exact `105450-0101` sales drawing or replacement 1.6 mm-compatible USB-C receptacle drawing;
- exact `10029449-101RLF` drawing and enclosure datum;
- final enclosure, board edge, mounting holes, keepouts, connector insertion loads, and cable clearances;
- JLCPCB or chosen fabricator eight-layer controlled-impedance stackup, minimum BGA escape geometry, via-in-pad policy, impedance coupons, and assembly rules;
- exact approved footprints and assembly orientations for every BGA and connector.

## Electrical completion checklist

The design can advance from “engineering” to schematic freeze only when every item below has an evidence link and reviewer sign-off.

| Area | Completion requirement | Current state |
|---|---|---|
| Product mode | freeze video-only 1080p30 YUY2/UYVY, unprotected HDMI, iPad USB-C target | proposed, not approved |
| TC358743 | vendor symbol, register spec, address, power sequence, decoupling, reset, init table | **blocked on Toshiba data** |
| CX3 | vendor symbol, DNU audit, rails, decoupling, clocks, straps, flash, reset | partially verified; reference review missing |
| CSI-2 | exact TC data type/timing, four-lane mapping, impedance/length rules, polarity | physical constraints known; configuration missing |
| HDMI | connector drawing, TPD12S520 mapping, DDC/CEC/HPD, EDID, no-HDCP behavior | architecture only |
| USB-C data | replacement/approved connector, mux truth table, AC caps, ESD channel map, 90 Ω route | connector selection blocked |
| USB-C power | CC current detection, VBUS protection, inrush, load budget, rail sequencing | architecture only; wrong OVP suffix identified |
| Audio | explicitly omit or add separate ingest/UAC architecture | **decision required** |
| Firmware | TC init, EDID/HPD, CX3 config, UVC descriptors, diagnostics, recovery, VID/PID | not implemented/proven |
| SI/PI | field-solved stackup, IBIS/S-parameter channels, rail transient simulations | models partly available; stackup missing |
| Compliance | USB-IF, HDMI adopter/compliance plan, EMC/ESD plan | not started |
| Physical proof | prototypes pass power, signal, USB, HDMI, thermal, and iPad matrices | not started |

## Available simulation models

The following models are publicly identified by their manufacturers:

| Device / path | Public model evidence | Useful for | Not sufficient for |
|---|---|---|---|
| CYUSB3065 | Infineon publishes a CX3 IBIS model and support links it for CYUSB3065 | package/I/O edge behavior for supported digital pins | internal USB PHY protocol, MIPI receiver function, DMA, UVC firmware, power sequencing |
| HD3SS3212 | TI publishes an S-parameter package (`SLAR119`); TI support states no IBIS/HSpice model | insertion loss, return loss, crosstalk, eye/channel analysis | powered functional behavior or USB protocol |
| TPD4E02B04 | TI publishes IBIS and S-parameter models | connector-side ESD channel loading | destructive ESD survival and board-level immunity |
| TPD12S520 | TI publishes an IBIS model | HDMI/DDC/HPD I/O loading | complete HDMI receiver behavior or compliance |
| TPS62130 | TI publishes unencrypted PSpice average/transient and TINA models | converter loop/transient and startup analysis | PCB parasitics and actual load-step proof without extracted interconnect |
| TPS62160 | TI publishes PSpice/TINA transient models | regulator transient analysis | actual assembled rail integrity by itself |
| S25FL064L | Infineon offers a gated IBIS model | SPI edge/termination analysis | boot-ROM compatibility and flash programming |
| TC358743 | no public Toshiba IBIS/SPICE model was located in the reviewed catalog | — | request model/package data from Toshiba; absence from this search is not proof none exists |

Sources: [Infineon CYUSB3065 IBIS support](https://community.infineon.com/t5/EZ-PD-USB-Type-C/IBIS-model-for-CYUSB3065-BZXI/td-p/273689), [TI HD3SS3212 model page](https://www.ti.com/product/HD3SS3212), [TI support on HD3SS3212 model availability](https://e2e.ti.com/support/interface-group/interface/f/interface-forum/633571/hd3ss3212-hd3ss3212-ibis-mode-and-hspice-model), [TI TPD4E02B04](https://www.ti.com/product/TPD4E02B04), [TI TPD12S520](https://www.ti.com/product/TPD12S520), [TI TPS62130](https://www.ti.com/product/TPS62130), [TI TPS62160](https://www.ti.com/product/TPS62160), [Infineon S25FL064L IBIS](https://www.infineon.com/gated/infineon-ibis-s25fl064l-simulationmodels-en_9846e28a-98e2-465b-a128-9a74973d57fe)

## What can be digitally tested

Digital analysis is valuable, but it needs exact schematic connectivity, stackup, packages, connectors, cables, and source/load models. A rendered PCB or clean logical netlist is not a signal-integrity result.

| Analysis | Inputs | Defensible pass condition before prototype |
|---|---|---|
| ERC and power-domain audit | exact symbols, ball map, rail ownership, DNU list, static straps | no unpowered domain, illegal crossing, DNU connection, open required pin, or output contention |
| Power budget | worst-case current by rail, conversion efficiency, VBUS advertisement | positive margin at USB default/current-advertised states; no assumption of 1.5 A/3 A |
| Regulator SPICE | TI regulator models, extracted load network, CX3 transient load, sequencing enables | rails remain inside device limits through startup, reset, PHY enable, and load steps |
| USB 3 channel simulation | CX3 IBIS/package data where applicable, mux S-parameters, ESD S-parameters, connector/cable/stackup models | insertion/return loss and eye margins meet the chosen USB 3 compliance mask and budget |
| MIPI channel simulation | TC package/model from Toshiba, CX3 IBIS, stackup, routes/vias | 100 Ω channel, timing/skew and eye margin at the selected lane rate |
| HDMI channel simulation | source/cable/connector/protection/TC package data and exact routes | HDMI 1.4 channel budget and eye/margin at the highest advertised pixel clock |
| SPI/I2C integrity | IBIS where available, trace model, pulls, capacitance, clock rate | logic thresholds and timing met across voltage/temperature/capacitance corners |
| Thermal estimate | regulator loss, bridge dissipation, copper/board/enclosure model | junction estimates remain below derated limits with margin |
| Firmware unit/integration simulation | mocked I2C registers, EDID fixtures, UVC descriptors, DMA state machine | deterministic initialization, errors, recovery, descriptor lengths, mode rejection |
| USB descriptor validation | generated binary descriptors and UVC compliance tools | structurally valid descriptors matching actual payload format/timing |

## What cannot be certified digitally

No available model or browser PCB tool can prove:

- that the undocumented TC358743 register sequence produces the intended CSI stream;
- sustained MIPI reception and USB DMA transfer without dropped/corrupted frames;
- successful enumeration and capture on the claimed iPad models and iPadOS versions;
- the iPad's actual advertised current, board inrush behavior, or cable-dependent VBUS droop;
- USB-IF, HDMI, UVC, EMC, radiated/conducted emissions, or ESD compliance;
- destructive ESD/surge robustness, latch-up, or brownout recovery;
- BGA assembly yield, via-in-pad quality, solder-joint integrity, or connector durability;
- thermal behavior inside the final enclosure;
- interoperability with real HDMI sources, cables, resolutions, color spaces, and hot-plug timing;
- compatibility with HDCP-protected sources;
- audio capture, because the current architecture has no valid audio-input path;
- long-duration reliability or production manufacturability.

USB-IF explicitly separates specification compliance from functional/interoperability testing and uses authorized test laboratories. HDMI similarly requires adopter/compliance processes for finished products. [USB-IF USB Type-C compliance](https://www.usb.org/usbc), [HDMI enforcement and licensing](https://www.hdmi.org/adopter/enforcement), [HDMI authorized test centers](https://www.hdmi.org/adopter/atcs)

## Physical validation gates

Fabrication-readiness and ordering must remain blocked until the design passes these gates in order:

1. **Independent schematic review:** Toshiba/Infineon/e-con data incorporated; two-person ball-map, supply, DNU, reset, and strap audit; exact BOM/footprint review.
2. **Pre-layout review:** fabricator-approved stackup; impedance calculations; BGA escape and via-in-pad DFM; connector-thickness conflict resolved; enclosure datum frozen.
3. **Post-layout SI/PI review:** USB, HDMI, and MIPI channel analysis; power-plane/decoupling extraction; startup/load transient simulation; return-path and crosstalk audit.
4. **Unpowered board inspection:** X-ray BGA/via-in-pad assembly, shorts/opens, impedance coupons, connector alignment, and programmed-flash verification.
5. **Current-limited bring-up:** resistance-to-ground, rail-by-rail enable, sequencing, inrush, reset, clocks, thermals, and SWD/JTAG/USB recovery where applicable.
6. **TC/CX3 link proof:** I2C access, TC identity/lock, EDID readback, HPD timing, CSI lane activity, CX3 MIPI error counters, frame geometry, and color-bar/reference-pattern checks.
7. **USB/UVC proof:** USB 2 fallback, USB 3 enumeration, descriptor inspection, PROBE/COMMIT, repeated connect/disconnect, suspend/resume, brownout, and firmware-recovery tests.
8. **Video matrix:** minimum 720p60 and 1080p30 across representative HDMI sources/cables, YCbCr/RGB inputs as advertised, hot-plug orderings, invalid/protected mode rejection, and multi-hour dropped-frame measurement.
9. **iPad matrix:** every claimed iPad and iPadOS release, representative cables/adapters, Apple capture APIs and target app, foreground/background transitions, thermal soak, and current draw. No iPhone claim follows from an iPad result.
10. **Pre-compliance:** USB electrical/compliance test, HDMI test plan, radiated/conducted emissions, immunity/ESD, thermal, and enclosure/cable tests at qualified labs.
11. **Pilot build:** DFM/DFT closeout, assembly yield, programming fixture, serial/traceability, functional test limits, and at least one controlled pilot lot before any production claim.

Until all relevant gates pass, RoarCAD should label outputs **ENGINEERING ONLY**, allow review Gerbers/BOM/CPL, and reject fabrication-ready status, JLCPCB quoting, or one-click manufacturing claims for PocketRoar.

## Primary-source index

### Core devices and implementation

- [Toshiba TC358743XBG datasheet](https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG)
- [Infineon CYUSB306x CX3 datasheet](https://www.infineon.com/dgdl/Infineon-CYUSB306X_EZ-USB_TM_CX3_MIPI_CSI-2_to_SuperSpeed_USB_bridge_controller-DataSheet-v17_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ecbbb354559)
- [Infineon AN70707 hardware design guideline](https://www.infineon.com/dgdl/Infineon-AN70707_EZ-USB_FX3_FX3S_SX3_hardware_design_guidelines_and_schematic_checklist-ApplicationNotes-v18_00-EN.pdf?fileId=8ac78c8c7cdc391c017d0739793e5dfd)
- [Infineon AN90369 MIPI CSI-2 to CX3 guide](https://www.infineon.com/dgdl/Infineon-AN90369_How_to_Interface_a_MIPI_CSI-2_Image_Sensor_With_EZ-USB_CX3-ApplicationNotes-v07_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e56bf6257)
- [Infineon Denebola CX3 evaluation board](https://www.infineon.com/evaluation-board/VD-USB-DENEBOLA-CAMERA)
- [Upstream Linux TC358743 driver](https://github.com/torvalds/linux/blob/master/drivers/media/i2c/tc358743.c)
- [Upstream Linux TC358743 platform header](https://github.com/torvalds/linux/blob/master/include/media/i2c/tc358743.h)

### USB-C and HDMI interface parts

- [TI TUSB320LAI datasheet](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf)
- [TI HD3SS3212 product and S-parameter model](https://www.ti.com/product/HD3SS3212)
- [TI TPD2S300 datasheet](https://www.ti.com/lit/ds/symlink/tpd2s300.pdf)
- [TI TPD1S514 datasheet](https://www.ti.com/lit/ds/symlink/tpd1s514.pdf)
- [TI ESD122](https://www.ti.com/product/ESD122)
- [TI TPD4E02B04](https://www.ti.com/product/TPD4E02B04)
- [TI TPD12S520 datasheet](https://www.ti.com/lit/ds/symlink/tpd12s520.pdf)
- [Amphenol 10029449-101RLF HDMI connector](https://www.amphenol-cs.com/product/10029449101rlf.html)
- [Molex 105450 USB-C connector series](https://www.molex.com/en-us/products/series-chart/105450)

### Platform and compliance

- [Apple external capture device documentation](https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external)
- [Apple WWDC23: external cameras on iPad](https://developer.apple.com/videos/play/wwdc2023/10106/)
- [USB-IF USB Type-C and compliance](https://www.usb.org/usbc)
- [HDMI licensing and enforcement](https://www.hdmi.org/adopter/enforcement)
- [HDMI authorized test centers](https://www.hdmi.org/adopter/atcs)
