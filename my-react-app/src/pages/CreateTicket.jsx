import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket, uploadTicketImages } from "../services/ticketService";
import { api } from "../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
  category: "OTHER",
  description: "",
  priority: "MEDIUM",
  resourceName: "",
};

const CATEGORIES = [
  { value: "ELECTRICAL", label: "Electrical", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  { value: "PLUMBING", label: "Plumbing", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
  { value: "IT_EQUIPMENT", label: "IT", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  { value: "FURNITURE", label: "Furniture", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { value: "OTHER", label: "Other", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg> },
];

const PRIORITIES = [
  { value: "LOW", label: "LOW", classes: "border-slate-200 text-slate-600 hover:bg-slate-50" },
  { value: "MEDIUM", label: "MEDIUM", classes: "border-blue-200 text-blue-700 hover:bg-blue-50" },
  { value: "HIGH", label: "HIGH", classes: "border-orange-200 text-orange-700 hover:bg-orange-50" },
  { value: "URGENT", label: "URGENT", classes: "border-transparent bg-red-600 text-white hover:bg-red-700 animate-pulse" },
];

const TEMPLATES = [
  "Water leaking from ceiling",
  "Power outage in section",
  "Broken door lock",
  "Projector not turning on"
];

function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [resources, setResources] = useState([]);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    async function loadResources() {
      try {
        const { data } = await api.get('/api/resources');
        setResources(data);
      } catch (err) {
        toast.error("Failed to load resources");
      }
    }
    loadResources();
  }, []);

  const descriptionLength = form.description.trim().length;
  const isValid = descriptionLength >= 20 && form.resourceName.trim();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const setPriority = (priority) => {
    if (priority === "URGENT") {
      if (!window.confirm("This will notify the on-call technician immediately. Are you sure this is urgent?")) {
        return;
      }
    }
    setForm(prev => ({ ...prev, priority }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    addFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const addFiles = (newFiles) => {
    const totalFiles = [...files, ...newFiles];
    if (totalFiles.length > 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }
    
    // Check sizes
    const invalidFile = totalFiles.find(f => f.size > 5 * 1024 * 1024);
    if (invalidFile) {
      toast.error(`${invalidFile.name} exceeds 5MB limit`);
      return;
    }
    
    setFiles(totalFiles);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;
    setSubmitting(true);

    try {
      const createdTicket = await createTicket({
        ...form,
        resourceName: form.resourceName.trim(),
        description: form.description.trim(),
        preferredContact: user?.email || "",
      });

      if (files.length > 0) {
        await uploadTicketImages(createdTicket.ticketId, files);
      }

      toast.success("Submitted!", { icon: '✅' });
      setTimeout(() => {
        navigate(`/tickets/${createdTicket.ticketId}`);
      }, 500);
    } catch (err) {
      toast.error(err.message || "Failed to create ticket");
      setSubmitting(false);
    }
  };

  const totalSizeMB = (files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1);

  return (
    <section className="w-full max-w-none flex flex-col gap-8 pb-12">
      <header className="relative flex items-start justify-between border-b-[3px] border-transparent pb-6 after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-gradient-to-r after:from-blue-600 after:to-indigo-400">
        <div className="flex gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-inner ring-1 ring-blue-100">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Report an Incident</h1>
            <p className="mt-1 text-sm text-slate-500">
              Please provide details. Our team will review and assign it to a technician.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/tickets")}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cancel and go back"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-8"
      >
        {/* RESOURCE */}
        <div className="md:col-span-2">
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
            Resource <span className="text-red-500">*</span>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <select
                name="resourceName"
                value={form.resourceName}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 outline-none transition hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              >
                <option value="" disabled>Select which resource is affected...</option>
                {resources.map((res) => (
                  <option key={res.id} value={res.name}>{res.name} ({res.location})</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </label>
        </div>

        {/* DESCRIPTION */}
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, description: prev.description ? `${prev.description}\n${tmpl}` : tmpl }))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                >
                  + {tmpl.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Example: Water leaking from ceiling near whiteboard. Started 2 hours ago."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 pb-8 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              required
            />
            <div className={`absolute bottom-3 right-4 text-xs font-bold ${descriptionLength < 20 ? 'text-orange-500' : 'text-emerald-500'}`}>
              {descriptionLength} / 20 min chars
            </div>
          </div>
        </div>

        {/* CATEGORY */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">Category</label>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => {
              const isActive = form.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105" 
                      : "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* PRIORITY */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">Priority Level</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRIORITIES.map((pri) => {
              const isActive = form.priority === pri.value;
              return (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    isActive 
                      ? pri.value === 'URGENT' 
                        ? "border-red-600 bg-red-600 text-white shadow-lg animate-pulse" 
                        : "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : `bg-white ${pri.classes}`
                  }`}
                >
                  {pri.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ATTACHMENTS */}
        <div className="md:col-span-2">
          <div className="mb-2 flex items-end justify-between">
            <label className="text-sm font-bold text-slate-700">Attachments</label>
            <span className="text-xs font-semibold text-slate-500">
              {files.length} / 3 images • {totalSizeMB} / 15 MB
            </span>
          </div>
          
          <div 
            onDragOver={(e) => e.preventDefault()} 
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 transition hover:border-blue-400 hover:bg-blue-50/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-semibold">Drag images here or click to browse</span>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-4 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="max-w-[120px] truncate text-xs font-bold text-slate-700">{file.name}</span>
                    <span className="text-xs font-medium text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="md:col-span-2 mt-2 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="rounded-xl border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:scale-105 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Ticket
                <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateTicket;
