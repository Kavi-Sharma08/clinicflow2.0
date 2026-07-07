import { FileArrowDownIcon, FileTextIcon, SealCheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { DoctorDocumentDTO } from "../../../../types/doctor.types";
import { documentTypeLabel, formatDate } from "./doctorProfileFormatters";
import { SectionCard } from "./InfoField";

function DocumentCard({ document }: { document: DoctorDocumentDTO }) {
  const isVerified = Boolean(document.verifiedAt);

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileTextIcon size={20} weight="duotone" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-950">{documentTypeLabel(document.documentType)}</h3>
            <p className="mt-1 text-xs text-slate-500">Uploaded {formatDate(document.uploadedAt)}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {isVerified ? <SealCheckIcon size={14} weight="fill" /> : <WarningCircleIcon size={14} weight="fill" />}
          {isVerified ? "Verified" : "Pending"}
        </span>
      </div>

      {document.remarks && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{document.remarks}</p>}

      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <FileArrowDownIcon size={15} /> Open document
      </a>
    </article>
  );
}

export function DoctorDocumentsPanel({ documents }: { documents: DoctorDocumentDTO[] }) {
  return (
    <SectionCard title="Verification Documents" description="Documents submitted by the doctor for admin review.">
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No documents have been submitted.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {documents.map((document) => <DocumentCard key={document.id} document={document} />)}
        </div>
      )}
    </SectionCard>
  );
}
