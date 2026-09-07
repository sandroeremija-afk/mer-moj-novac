# MER invoice drafts

The business workspace can prepare and save domestic EUR invoice drafts with a
single 25% VAT category, checksum-validated Croatian OIB and IBAN, item-level KPD
codes, UBL 2.1 draft XML, a browser print/PDF preview, and an offline QR summary.
Drafts belong to `accounts.business.enterprise.invoices`; they do not create
income transactions or imply payment. Personal profiles cannot create/export them.

This is a draft-preparation workflow, not a certified Croatian e-Invoicing or
fiscalization service. XML intentionally uses `urn:mer:invoice:draft:1` rather than
claiming Croatian CIUS compliance. PDF output and QR codes explicitly say draft.
The QR code contains the draft number, dates, EUR amount and seller IBAN. It is not
a HUB3 bank payment code (HUB3 requires PDF417), and it is generated locally.
The OIB and IBAN checks validate syntax/check digits, not ownership/registration.
KPD input validates six-digit structure; the user must select the correct actual
classification from KLASUS. The seller confirms VAT registration and applicability.

## Before legal issuance

An authorized delivery/fiscalization implementation must incorporate the current
Croatian CIUS/extensions, applicable operator and transaction information, invoice
numbering rules, signatures where required, and buyer routing. Validate each
document against the current UBL XSD and official Croatian Schematron release,
including positive/negative official fixtures; then complete the access-point and
fiscalization integration and applicable conformance process. Reduced VAT rates,
exemptions, reverse charge, advances, corrections and cross-border invoices are
not supported by this domestic 25% template.

The official documents are updated periodically. The sources below were checked
on 7 September 2026:

- [Porezna uprava — eRačun and current documentation](https://porezna.gov.hr/fiskalizacija/bezgotovinski-racuni/eracun)
- [Croatian CIUS and extensions, updated 12 March 2026](https://porezna.gov.hr/fiskalizacija/api/dokumenti/196)
- [Hrvatska udruga banaka — HUB3 PDF417 format](https://www.hub.hr/sites/default/files/inline-files/2DBK_EUR_Uputa_1.pdf)

## QR dependency provenance

`assets/qrcode.js` is the unmodified JavaScript build from
[Kazuhiko Arase's qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator/blob/master/js/dist/qrcode.js),
package version 2.0.4. Its Git blob SHA-1 is
`df13f829bf41f36b82f0ed85751ed3b4c39cfeb8`, checked by the rendering evaluation.
The MIT license is included in `assets/qrcode-LICENSE.txt`. There are no runtime
network calls for QR generation. ASCII-escaped JSON is used in QR byte mode.

## Focused evaluation

`node tests/eval-cycle-1-invoice-core.test.js` validates OIB/IBAN checks, exact
integer-cent VAT arithmetic, leap dates and malformed input, business isolation,
draft upserts, duplicate numbers, XML escaping and absence of ledger side effects.
`node tests/eval-cycle-2-invoice-rendering.test.js` verifies the pinned QR source
and generation of a proper local SVG module matrix.
