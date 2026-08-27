# Gerber Standard Support Reference (RS-274X & Excellon)

## Supported RS-274X Commands

| Command | Feature / Description | Status |
| :--- | :--- | :--- |
| `%MOIN*% / %MOMM*%` | Unit Definition (Inches / Millimeters) | Supported |
| `%FSLAX..Y..*%` | Format Specifier (Coordinate precision) | Supported |
| `%ADD...%` | Aperture Definition (Circle, Rect, Obround, Polygon, Macro) | Supported |
| `%LPD*% / %LPC*%` | Layer Polarity (Dark / Clear) | Supported |
| `G54D10..D99*` | Aperture Selection | Supported |
| `G01*` | Linear Interpolation | Supported |
| `G02* / G03*` | Circular Arc Interpolation (CW / CCW) | Supported |
| `G36* / G37*` | Region Fill (Solid polygons / pours) | Supported |
| `D01*` | Interpolate / Draw Line | Supported |
| `D02*` | Move Cursor | Supported |
| `D03*` | Flash Aperture | Supported |
| `M02*` | End of File | Supported |
| `%TF.FileFunction%` | Gerber Attribute Layer Detection | Supported |
| `.gbrjob` | Gerber Job JSON Format Stackup Metadata | Supported |

## Supported Excellon Drill Commands

| Command | Feature / Description | Status |
| :--- | :--- | :--- |
| `METRIC / INCH` | Drill Header Units | Supported |
| `T01C0.8` | Drill Tool Definition & Diameter | Supported |
| `T01` | Tool Selection | Supported |
| `X..Y..` | Drill Hole Coordinate Hit | Supported |
| `G85` | Slot Command | Supported |
| Plated / NPTH | Plated vs Non-Plated Hole Detection | Supported |
