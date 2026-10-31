# Forms and the components they use

A map for the frontend developer taking over the UI. It lists every screen that has a form and the components each one renders, so you know which file to open before restyling something.

Links are relative to this file (`Procurrement-fn/docs/`).

## How a business form gets on screen

The ten AfS-Rwanda forms (PR-01 to TC-10, plus the contract) have **no page of their own**. Their fields, sections, signers and printed layout come from the API as a template (defined in the backend at `Procurrement-bn/src/templates/definitions/`). Every one of them opens at `/documents/:id` in [DocumentPage.tsx](../src/pages/DocumentPage.tsx), which shows the template through these tabs:

| Tab | Component | What it shows |
|---|---|---|
| Form | [PaperForm](../src/features/paper/PaperForm.tsx) | Read-only copy of the printed paper form, with a Print button. |
| Edit fields (only while there is something to fill: a draft, or fields the current signer fills) | [FormRenderer](../src/features/forms/FormRenderer.tsx) → [FieldRenderer](../src/features/forms/FieldRenderer.tsx) → one field component per field type | The editable form. Autosave comes from [useDocumentEditor](../src/features/forms/useDocumentEditor.ts) and the status from [SaveIndicator](../src/features/forms/SaveIndicator.tsx). |
| PDF (once rendered) | [PdfPreview](../src/features/documents/PdfPreview.tsx) | The PDF rendered on the server. |
| Audit trail | [AuditTable](../src/features/documents/AuditTable.tsx) | The history of the document. |

Next to the Form and Edit fields tabs, a **Signatures** side column (`doc-layout__aside`) shows:

- [SigningPanel](../src/features/signing/SigningPanel.tsx), when it is the current user's turn to sign or decline.
- [SlotList](../src/features/signing/SlotList.tsx), which lists every signer.
- [AssignDelegate](../src/features/signing/AssignDelegate.tsx), for reassigning a signer.

Return, cancel and edit-request reasons use [ReasonModal](../src/features/cases/ReasonModal.tsx).

What this means for UI work:

- **Restyle a field type once and it changes on every form.** The field type is looked up in [registry.ts](../src/features/forms/registry.ts). For example, a `money` field always renders [MoneyField](../src/features/forms/fields/MoneyField.tsx).
- **Changing which fields a form has, their labels, order or sections is a backend change** (the template definitions), not a frontend one.
- **The paper view copies the scanned originals** in `Procurrement-bn/docs/reference-forms`. Its layout lives in the backend at `src/templates/definitions/layouts.ts` and `paper.ts`. The frontend draws it with [PaperBlocks](../src/features/paper/PaperBlocks.tsx) (all forms except the contract) or [ContractPaper](../src/features/paper/ContractPaper.tsx) (the contract). Both use [SignOff](../src/features/paper/SignOff.tsx) for the Name / Signature / Date grid, and the styles are in [paper.css](../src/styles/paper.css), which is also used for printing.
- **Styles:** design tokens are in [theme.css](../src/styles/theme.css). Edit-form layout (`form-section`, `form-field`, `form-field--wide`, `form-errors`) is in [forms.css](../src/styles/forms.css). Primitives are in [components.css](../src/styles/components.css).

## Field components and the UI primitives they use

| Field type (template) | Component | Built from (`src/ui/`) | Notes |
|---|---|---|---|
| `text` | [TextField](../src/features/forms/fields/TextField.tsx) | Field, Input | Also the fallback for an unknown type. |
| `textarea` | [TextareaField](../src/features/forms/fields/TextareaField.tsx) | Field, Textarea | Full width. |
| `date` | [DateField](../src/features/forms/fields/DateField.tsx) | Field, Input, Button | Has a "Today" button. |
| `time` | [TimeField](../src/features/forms/fields/TimeField.tsx) | Field, Input | |
| `number` | [NumberField](../src/features/forms/fields/NumberField.tsx) | Field, Input | |
| `money` | [MoneyField](../src/features/forms/fields/MoneyField.tsx) | Field, Input, Select | Amount plus a currency select. |
| `select` | [SelectField](../src/features/forms/fields/SelectField.tsx) | Field, Select, Input | No form uses it at the moment. |
| `radio` | [RadioField](../src/features/forms/fields/RadioField.tsx) | Field, Input | Full width. Can have an "Other" text box. |
| `checkbox_group` | [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx) | Field, Input | Full width. |
| `yes_no` | [YesNoField](../src/features/forms/fields/YesNoField.tsx) | Field | |
| `table` | [TableField](../src/features/forms/fields/TableField.tsx) | Field, Button, FieldRenderer | Each cell goes back through the registry, so any type can be a column. Full width. |
| `file` | [FileField](../src/features/forms/fields/FileField.tsx) | Field, FileDropzone, Button | Uploads straight away. Full width. |
| `user_ref` | [UserRefField](../src/features/forms/fields/UserRefField.tsx) | [RefSelect](../src/features/forms/fields/RefSelect.tsx) → Field, Select | |
| `supplier_ref` | [SupplierRefField](../src/features/forms/fields/SupplierRefField.tsx) | RefSelect | |
| `budget_line_ref` | [BudgetLineRefField](../src/features/forms/fields/BudgetLineRefField.tsx) | RefSelect, Modal, Input, Select, Button, Alert | Includes the "new budget line" modal. |
| `computed` | [ComputedField](../src/features/forms/fields/ComputedField.tsx) | Field | Read-only; the server computes the value. |
| `case_ref` | [CaseRefField](../src/features/forms/fields/CaseRefField.tsx) | Field | Read-only value copied from earlier case documents. |

"Full width" means the field gets the `form-field--wide` class (from `WIDE_TYPES` in [registry.ts](../src/features/forms/registry.ts)).

## Which field components each form uses

| Component | PR-01 | QC-02 | MPV-03 | QE-03 | PO-09 | CONTRACT | PA-04 | GR-06 | IM-08 | TC-10 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| TextField | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TextareaField | ✓ | ✓ | ✓ | ✓ |  |  | ✓ | ✓ | ✓ | ✓ |
| DateField | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| TimeField |  |  |  |  |  |  |  | ✓ |  |  |
| NumberField | ✓ |  | ✓ |  | ✓ | ✓ |  | ✓ |  | ✓ |
| MoneyField | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| SelectField *(not used by any form)* |  |  |  |  |  |  |  |  |  |  |
| RadioField |  | ✓ | ✓ |  | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| CheckboxGroupField | ✓ | ✓ | ✓ | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| YesNoField |  |  | ✓ | ✓ |  |  | ✓ |  |  |  |
| TableField | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |
| FileField |  | ✓ | ✓ |  |  |  | ✓ | ✓ | ✓ |  |
| UserRefField | ✓ |  | ✓ |  |  |  |  |  | ✓ | ✓ |
| SupplierRefField |  | ✓ |  | ✓ |  | ✓ |  |  |  |  |
| BudgetLineRefField | ✓ |  |  |  |  |  |  | ✓ |  | ✓ |
| ComputedField | ✓ |  | ✓ |  | ✓ |  |  | ✓ |  | ✓ |
| CaseRefField |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |

## Form by form

Each form below lists where it is opened, its field components, its paper view and its signers, followed by every field. *Conditional* means the field only appears when another answer allows it. *Filled at signer `x`* means the field is left empty at submit and filled in by that signer, on the Edit fields tab during signing.

### PR-01: Procurement Requisition

- **Where:** Case, stage *Requisition*. Created with the case from **Cases → New case** ([NewCase.tsx](../src/pages/NewCase.tsx)).
- **Field components:** [BudgetLineRefField](../src/features/forms/fields/BudgetLineRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [ComputedField](../src/features/forms/fields/ComputedField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [UserRefField](../src/features/forms/fields/UserRefField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Prepared / Requested by (`requesting_staff`) → Received & Checked by Accountant (`accountant`) → PI Initial Authorization (`pi`)

| Section | Field | Component |
|---|---|---|
| Request | Request No. | TextField |
|  | Date of Request | DateField |
|  | Requested By | UserRefField |
|  | Project / Activity | TextField |
|  | Required By Date | DateField |
|  | Budget Line / Cost Centre | BudgetLineRefField |
| Item / Service Specifications | Items requested | TableField<br>columns: Detailed description / technical specification (TextareaField), Qty (NumberField), Unit Cost (MoneyField), Est. Unit Cost (MoneyField), Est. Total (ComputedField) |
| Justification and Conditions | Business Justification | TextareaField |
|  | Suggested Supplier (optional) | TextField |
|  | Special Conditions | CheckboxGroupField |

### QC-02: Supplier Quotation Collection Register

- **Where:** Case, stage *Quotation*. Added from the case page ([CaseDetail.tsx](../src/pages/CaseDetail.tsx)).
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [FileField](../src/features/forms/fields/FileField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [SupplierRefField](../src/features/forms/fields/SupplierRefField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Prepared / Collected by (`accountant`) → Checked by Accountant (`accountant`) → Requesting Staff acknowledgement (`requesting_staff`)
- **Signing:** asks for a conflict of interest confirmation in [SigningPanel](../src/features/signing/SigningPanel.tsx)

| Section | Field | Component |
|---|---|---|
| Request | Request No. | CaseRefField |
|  | Quotation Collection Date | DateField |
|  | Item / Service | TextField |
| Quotations Received | Quotations received | TableField<br>columns: Supplier (SupplierRefField), Tel (TextField), Email (TextField), Quote Ref. (TextField), Quote Date (DateField), Total Price (MoneyField), Delivery (TextField), Validity (TextField), Attachment (FileField) |
| Collection Method and Declaration | Collection Method | CheckboxGroupField |
|  | I confirm that any known relationship or conflict with a quoted supplier has been disclosed | RadioField |
|  | Notes | TextareaField |

### MPV-03: Market Price Verification

- **Where:** Case, stage *Market check*. Added from the case page.
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [ComputedField](../src/features/forms/fields/ComputedField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [FileField](../src/features/forms/fields/FileField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [UserRefField](../src/features/forms/fields/UserRefField.tsx), [YesNoField](../src/features/forms/fields/YesNoField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Market Verification Officer (`market_verifier`) → Accountant – Review / Cross-check (`accountant`) → Requesting Staff – Acknowledgement (`requesting_staff`)
- **Signing:** asks for a conflict of interest confirmation in [SigningPanel](../src/features/signing/SigningPanel.tsx)

| Section | Field | Component |
|---|---|---|
| Verification Details | Procurement Request No. | CaseRefField |
|  | MPV Date | DateField |
|  | Project / Activity | CaseRefField |
|  | Item / Service | CaseRefField |
|  | Requesting Staff | CaseRefField |
|  | Staff Assigned to MPV | UserRefField |
|  | Market / Location Visited | TextField |
| A. Item / Service Specification to be Verified | Items to verify | TableField<br>columns: Detailed specification / description (TextField), Qty (NumberField), Unit (TextField), Quoted Price Benchmark (MoneyField) |
| B. Physical Market Price Verification | Outlets visited | TableField<br>columns: Supplier / Outlet Visited (TextField), Location / Contact (TextField), Item Available? (YesNoField), Unit Price (MoneyField), Taxes Included? (YesNoField), Delivery / Lead Time (TextField), Evidence / Ref. (FileField), Remarks (TextField) |
| C. Comparison with Quotations Received | Comparison | TableField<br>columns: Quoted Supplier (TextField), Quotation Amount (MoneyField), Verified Market Range (TextField), Variance (ComputedField), Price Reasonable? (YesNoField), Comment (TextField) |
| D. Market Verification Findings | Observed Market Price Range: Lowest | MoneyField |
|  | Observed Market Price Range: Highest | MoneyField |
|  | Market Availability | RadioField |
|  | Quotation Assessment | RadioField |
|  | Finding / Explanation | TextareaField |
|  | Recommendation | RadioField |
|  | Attachments / Evidence | CheckboxGroupField |
|  | Attached files | TableField<br>columns: File (FileField) |
|  | Verifier Declaration: I confirm that the information recorded above reflects the market prices and conditions observed or directly obtained during this verification. I have disclosed any known conflict of interest and have not requested or accepted any benefit from suppliers contacted. | YesNoField |

### QE-03: Quotation Evaluation, Supplier Recommendation and PO Authorization

- **Where:** Case, stage *Evaluation*. Added from the case page.
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [SupplierRefField](../src/features/forms/fields/SupplierRefField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [YesNoField](../src/features/forms/fields/YesNoField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Requesting Staff / Reviewer 1 (`requesting_staff`) → Director of Communications / Reviewer 2 (`director_comms`) → PI / Reviewer 3 (`pi`)
- **Signing:** asks for a conflict of interest confirmation in [SigningPanel](../src/features/signing/SigningPanel.tsx)

| Section | Field | Component |
|---|---|---|
| Request | Request No. | CaseRefField |
|  | Evaluation Date | DateField |
|  | Item / Service | CaseRefField |
|  | Evaluation Committee | CaseRefField |
| Compliance & Commercial Comparison | Quotations compared | TableField<br>columns: Supplier (SupplierRefField), Service/Product Name (TextField), Meets Specs? (YesNoField), Price (MoneyField), Delivery (TextField), Quality/ Experience & Overall Finding (TextareaField) |
| Recommendation | Recommended Supplier | SupplierRefField |
|  | Recommended Amount | MoneyField |
|  | Reason for Selection | CheckboxGroupField |
|  | Evaluation Notes & Authorization to Commit / Order | TextareaField |

### PO-09: Purchase Order

- **Where:** Case, stage *Purchase order*. Added from the case page.
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [ComputedField](../src/features/forms/fields/ComputedField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Prepared / Issued by Accountant or Procurement Focal Person (`accountant`) → Authorized by PI (`pi`)

| Section | Field | Component |
|---|---|---|
| A. Purchase Order & Procurement References | PO Number | TextField |
|  | Issue Date | DateField |
|  | Requisition No. | CaseRefField |
|  | Project / Activity | CaseRefField |
|  | Budget Line / Cost Centre | CaseRefField |
|  | Requested By | CaseRefField |
|  | Currency | RadioField |
|  | Payment Terms | CheckboxGroupField |
| B. Supplier Details | Supplier / Company Name | CaseRefField |
|  | TIN / Registration No. | CaseRefField |
|  | Contact Person / Position | CaseRefField |
|  | Telephone / Email | CaseRefField |
|  | Supplier Quotation Ref. / Date | CaseRefField |
| C. Goods / Services Ordered | Goods / services ordered | TableField<br>columns: Item / Service Description (TextField), Specification / Scope (TextField), Qty (NumberField), Unit (TextField), Unit Price (MoneyField) |
|  | Subtotal | ComputedField |
|  | Tax / VAT | MoneyField |
|  | TOTAL PURCHASE ORDER VALUE | ComputedField |

### CONTRACT: Financial Contract for the Provision of Event Management Service Tools, Communication Materials, and Other Supplies

- **Where:** Case, stage *Purchase order*, only when the case needs a contract. The supplier signs on the public page `/sign/:token` ([ExternalSign.tsx](../src/pages/ExternalSign.tsx)).
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [SupplierRefField](../src/features/forms/fields/SupplierRefField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx)
- **Paper view:** [ContractPaper](../src/features/paper/ContractPaper.tsx) (contract layout, clauses with placeholders) + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** For AfS-Rwanda (`pi`) → For the Supplier (`supplier`, external)

| Section | Field | Component |
|---|---|---|
| Parties | Supplier | SupplierRefField |
|  | Supplier's address | CaseRefField |
|  | Supplier's e-mail | CaseRefField |
|  | Supplier's telephone | CaseRefField |
|  | TIN number or ID no. | CaseRefField |
| Scope of Services | Scope | TableField<br>columns: Service / material (TextField), Description (TextField), Quantity / deliverable (TextField) |
| Terms | Contract Value | MoneyField |
|  | Advance payment % | NumberField |
|  | Advance payment within (days) | NumberField |

### PA-04: Purchase / Service Payment Final Compliance Approval

- **Where:** Case, stage *Payment*, after delivery is recorded with [DeliveryForm.tsx](../src/features/cases/DeliveryForm.tsx).
- **Field components:** [CaseRefField](../src/features/forms/fields/CaseRefField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [FileField](../src/features/forms/fields/FileField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [YesNoField](../src/features/forms/fields/YesNoField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Received / Verified by Requesting Staff (`requesting_staff`) → Accountant – payment prepared (`accountant`) → Chief Finance Manager (`cfm`)

| Section | Field | Component |
|---|---|---|
| Purchase / Service | Request No. | CaseRefField |
|  | Selected Supplier | CaseRefField |
|  | Approved Purchase / Service | CaseRefField |
|  | Approved Amount | CaseRefField |
|  | Purchase Order / Contract Ref. | CaseRefField |
|  | Expected Delivery / Completion | DateField |
| Pre-Purchase Control | Approved requisition attached | YesNoField |
|  | Reference / Comment | TextField |
|  | At least two quotations attached | YesNoField |
|  | Reference / Comment | TextField |
|  | Signed quotation evaluation attached | YesNoField |
|  | Reference / Comment | TextField |
|  | Budget availability confirmed | YesNoField |
|  | Reference / Comment | TextField |
|  | Supplier/payment details verified | YesNoField |
|  | Reference / Comment | TextField |
| Goods / Service Receipt & Payment Verification | Delivery / Completion Date | DateField |
|  | Invoice No. | TextField |
|  | Invoice Date | DateField |
|  | Receipt / Delivery Note Ref. | TextField |
|  | Receipt / delivery note file | FileField |
|  | Acceptance | RadioField |
|  | Exception noted | TextareaField *(conditional)* |
|  | Amount Payable | MoneyField |
|  | Payment Method / Ref. | TextField |

### GR-06: General Requisition and Activity Support Request

- **Where:** Standalone. Sidebar **Requests (GR-06)**: `/requests` and `/requests/new` ([StandaloneList.tsx](../src/pages/StandaloneList.tsx), [StandaloneNew.tsx](../src/pages/StandaloneNew.tsx)).
- **Field components:** [BudgetLineRefField](../src/features/forms/fields/BudgetLineRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [ComputedField](../src/features/forms/fields/ComputedField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [FileField](../src/features/forms/fields/FileField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [TimeField](../src/features/forms/fields/TimeField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Requested / Prepared by (`requesting_staff`) → Accountant — Budget & Control Check (`accountant`) → Manager of Department — Activity Reviewer (`director_dept`) → PI — Final Authorization (`pi`) → Processed By (`accountant`)

| Section | Field | Component |
|---|---|---|
| A. Request Information | Project / Activity | TextField |
|  | Budget Line / Cost Centre | BudgetLineRefField |
|  | Purpose / Justification | TextareaField |
| B. Type of Request — Tick the applicable category | Type of request | CheckboxGroupField |
|  | Noted Details | TextareaField |
|  | Estimated Total amount | MoneyField |
| C. Office Supplies / Fees Details — Complete where applicable | Items / fees | TableField<br>columns: Item / Fee Description (TextField), Specification / Purpose (TextField), Qty (NumberField), Unit Cost (MoneyField), Estimated Total (ComputedField) |
| D. Travel / Transport Budget Request — Complete where applicable | Travel Category | RadioField |
|  | Traveler(s) NAME | TextareaField |
|  | List of Traveling Team Attached | FileField |
|  | Destination | TextField |
|  | Departure Date | DateField |
|  | Departure Time | TimeField |
|  | Transport Requested | CheckboxGroupField |
| F. Finance / Administration Action | Funds Service Issued | CheckboxGroupField *(filled at signer `processed_by`)* |

### IM-08: Internal Memorandum: Issue, Recommendation and Management Decision

- **Where:** Standalone. Sidebar **Memos (IM-08)**: `/memos` and `/memos/new`.
- **Field components:** [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [FileField](../src/features/forms/fields/FileField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TableField](../src/features/forms/fields/TableField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [UserRefField](../src/features/forms/fields/UserRefField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the boxed header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Originating Staff Signature (`requesting_staff`) → Superior Staff (`superior`)

| Section | Field | Component |
|---|---|---|
| A. Memo Originator | Memo Reference Name | TextField |
|  | Department/ Office | TextField |
|  | Date Submitted | DateField |
|  | Version | TextField |
| B. Issue Requiring Attention | Describe the issue, background, urgency, operational implication, and any relevant facts or supporting references | TextareaField |
|  | Originating staff recommendation: proposed solution / recommendation and reason for the proposed course of action | TextareaField |
| C. Superior / Management Review, Advice & Decision | Advice / Management Recommendation/ Decision | TextareaField *(filled at signer `superior`)* |
|  | Decision Status | RadioField *(filled at signer `superior`)* |
|  | Priority / Required Completion | RadioField *(filled at signer `superior`)* |
|  | Target date | DateField *(filled at signer `superior`)* |
|  | Action type | CheckboxGroupField *(filled at signer `superior`)* |
|  | Single-source justification | FileField *(conditional, filled at signer `superior`)* |
| D. Staff to be Notified / Responsible for Next Action | Staff to be notified | TableField *(filled at signer `superior`)*<br>columns: Name / Position (UserRefField), Action / Responsibility Assigned (TextField), Notification / Due Date (DateField) |

### TC-10: Travel Clearance

- **Where:** Standalone. Sidebar **Travel clearance (TC-10)**: `/travel` and `/travel/new`.
- **Field components:** [BudgetLineRefField](../src/features/forms/fields/BudgetLineRefField.tsx), [CheckboxGroupField](../src/features/forms/fields/CheckboxGroupField.tsx), [ComputedField](../src/features/forms/fields/ComputedField.tsx), [DateField](../src/features/forms/fields/DateField.tsx), [MoneyField](../src/features/forms/fields/MoneyField.tsx), [NumberField](../src/features/forms/fields/NumberField.tsx), [RadioField](../src/features/forms/fields/RadioField.tsx), [TextField](../src/features/forms/fields/TextField.tsx), [TextareaField](../src/features/forms/fields/TextareaField.tsx), [UserRefField](../src/features/forms/fields/UserRefField.tsx)
- **Paper view:** [PaperBlocks](../src/features/paper/PaperBlocks.tsx) with the centred *title* header + [SignOff](../src/features/paper/SignOff.tsx)
- **Signers, in order:** Traveller (requested by) (`requesting_staff`) → Supervisor who proposed the mission (`director_dept`) → Costs entered by (Administrator) (`admin`) → Funding checked by (Accountant) (`accountant`) → Approved By (`pi`)

| Section | Field | Component |
|---|---|---|
| Traveller | Traveller | RadioField |
|  | Issued to Mr/Mrs/Ms | UserRefField *(conditional)* |
|  | Issued to Mr/Mrs/Ms (full name) | TextField *(conditional)* |
|  | ID type | RadioField |
|  | ID | TextField |
|  | Account number | TextField |
|  | Function | TextField |
| Mission | 5. Program | TextField |
|  | 6. Funding (budget line) | BudgetLineRefField |
|  | 7. Expected results | TextareaField |
|  | 8. Purpose of the mission | TextareaField |
|  | 9. Supervisor who proposed the mission | UserRefField |
|  | 10. Destination | TextField |
|  | 11. Date of departure | DateField |
|  | 11. Place of departure | TextField |
|  | 12. Returning date | DateField |
|  | 13. Duration (days) | NumberField |
|  | 14. Means of transport | CheckboxGroupField |
|  | Issued at | TextField |
| Mission Costs | 15. Mission allowance per day | MoneyField *(filled at signer `admin_costs`)* |
|  | 16. Accommodation & incidental per day | MoneyField *(filled at signer `admin_costs`)* |
|  | Transport cost (whole mission) | MoneyField *(filled at signer `admin_costs`)* |
|  | Transport details | TextField *(filled at signer `admin_costs`)* |
|  | 17. Total amount | ComputedField *(filled at signer `admin_costs`)* |
| Visa of Hosting Institution | Authorized Name, Signature & Stamp | TextareaField |
|  | Arrival date | TextField |
|  | Departure date | TextField |

## Other forms in the app (hand-written pages)

These are ordinary React pages, not templates, so you can change their fields and layout directly in the file.

| Screen | Route | File | Components |
|---|---|---|---|
| Sign in (and the 2FA code) | `/login` | [Login.tsx](../src/pages/Login.tsx) | PublicLayout, Card, Field, Input, PasswordInput, Button, Alert |
| Set password from an invite or reset email | `/accept-invite` | [AcceptInvite.tsx](../src/pages/AcceptInvite.tsx) | PublicLayout, Card, Field, PasswordInput, Button, Alert |
| Supplier signing (external) | `/sign/:token` | [ExternalSign.tsx](../src/pages/ExternalSign.tsx) | PublicLayout, PaperForm, SigningPanel, Alert, Button, Icon |
| Verify a signed document (QR code) | `/verify/:documentId` | [Verify.tsx](../src/pages/Verify.tsx) | PublicLayout, Badge |
| New procurement case | `/cases/new` | [NewCase.tsx](../src/pages/NewCase.tsx) | PageHeader, Card, Field, Input, Select, Button, Alert |
| Case filters | `/cases` | [CasesList.tsx](../src/pages/CasesList.tsx) | PageHeader, Field, Input, Select, DataTable, StatusBadge |
| Case page, add the next document | `/cases/:id` | [CaseDetail.tsx](../src/pages/CaseDetail.tsx) | PageHeader, [Stepper](../src/features/cases/Stepper.tsx), Card, StatusBadge, AuditTable, ReasonModal |
| Record delivery (before PA-04) | on the case page | [DeliveryForm.tsx](../src/features/cases/DeliveryForm.tsx) | Field, Input, Button, Alert |
| Return / decline / cancel reason | modal | [ReasonModal.tsx](../src/features/cases/ReasonModal.tsx) | Modal, Field, Textarea, Button, Alert |
| Start a GR-06 / IM-08 / TC-10 | `/requests/new`, `/memos/new`, `/travel/new` | [StandaloneNew.tsx](../src/pages/StandaloneNew.tsx) | PageHeader, Card, Button, Alert (creates the draft, then opens DocumentPage) |
| Sign a slot | Signatures column of DocumentPage, and ExternalSign | [SigningPanel.tsx](../src/features/signing/SigningPanel.tsx) | Card, Modal, Field, Input, Textarea, Button, Alert, [SignatureInput](../src/features/signing/SignatureInput.tsx) |
| Signature input (saved / draw / type / upload) | inside SigningPanel and Profile | [SignatureInput.tsx](../src/features/signing/SignatureInput.tsx) | Tabs, Field, Input, FileDropzone, [SignaturePad](../src/features/signing/SignaturePad.tsx), SavedSignatureImage |
| Reassign signer | Signatures column of DocumentPage | [AssignDelegate.tsx](../src/features/signing/AssignDelegate.tsx) | Select, Button |
| Profile: password, 2FA, saved signature | `/profile` | [Profile.tsx](../src/pages/Profile.tsx) | PageHeader, Card, Field, Input, PasswordInput, Button, Alert, [MySignature](../src/features/signing/MySignature.tsx) |
| Audit filters | `/audit` | [Audit.tsx](../src/pages/Audit.tsx) | PageHeader, Field, Input, Button, AuditTable |
| Admin: invite / edit user | `/admin/users` | [UsersAdmin.tsx](../src/pages/admin/UsersAdmin.tsx) | DataTable, Modal, Field, Input, Select, Badge, Button, Alert |
| Admin: departments, budget lines, suppliers | `/admin/departments`, `/admin/budget-lines`, `/admin/suppliers` | [LookupAdmin.tsx](../src/pages/admin/LookupAdmin.tsx) | DataTable, Modal, Field, Input, Select, Button, Alert |
| Admin: templates (read-only list) | `/admin/templates` | [TemplatesAdmin.tsx](../src/pages/admin/TemplatesAdmin.tsx) | DataTable |

All primitives live in [src/ui/](../src/ui/) and are exported from [src/ui/index.ts](../src/ui/index.ts). The app frame is [AppShell](../src/layout/AppShell.tsx) (sidebar entries in [nav.ts](../src/layout/nav.ts)). Public pages use [PublicLayout](../src/layout/PublicLayout.tsx).

## Keeping this document up to date

The per-form tables above were generated from the backend template definitions. If a template changes, run the backend tests (`npm test` in `Procurrement-bn`), then check the form's section here against `src/templates/definitions/procurement.ts` or `standalone.ts`.
