import { prisma } from "@/lib/db";
import { DEFAULT_PAGES } from "@/lib/default-pages";
import { savePageAction, deletePageAction } from "./actions";
import { FileText, Save, Info, Shield, HelpCircle, Plus, Trash2, File, ChevronRight, Lock } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";
import { CKEditorTextArea } from "@/components/admin/ckeditor-textarea";
import Link from "next/link";

export const metadata = { title: "Page Manager" };

export default async function PagesManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; action?: string }>;
}) {
  const params = await searchParams;
  const activeSlug = params.slug;
  const isNewAction = params.action === "new";

  // Fetch all pages in database
  const dbPages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  
  // Merge core and custom pages for list
  const coreSlugs = ["privacy", "terms", "disclaimer"];
  const mergedSlugs = Array.from(new Set([...coreSlugs, ...dbPages.map((p) => p.slug)]));
  
  const pagesList = mergedSlugs.map((slug) => {
    const dbPage = dbPages.find((p) => p.slug === slug);
    const isCore = slug === "privacy" || slug === "terms";
    return {
      slug,
      isCore,
      title: dbPage?.title || (slug === "privacy" ? "Privacy Policy" : slug === "terms" ? "Terms of Service" : slug),
      content: dbPage?.content || DEFAULT_PAGES[slug]?.content || "",
    };
  });

  // Determine which page is being edited
  let selectedPage = pagesList.find((p) => p.slug === activeSlug);
  if (!selectedPage && !isNewAction) {
    // Default to Privacy Policy if nothing is selected
    selectedPage = pagesList.find((p) => p.slug === "privacy");
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">Page Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, edit, or delete dynamic legal and custom pages with CKEditor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Pages List Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <Link
            href="/admin/pages?action=new"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs shadow-sm hover:shadow transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Page
          </Link>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Pages</span>
            </div>
            <div className="divide-y divide-slate-100 flex flex-col">
              {pagesList.map((p) => {
                const isActive = !isNewAction && selectedPage?.slug === p.slug;
                const Icon = p.isCore ? Shield : File;

                return (
                  <Link
                    key={p.slug}
                    href={`/admin/pages?slug=${p.slug}`}
                    className={`flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-primary/5 text-primary border-l-2 border-primary"
                        : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-slate-450"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{p.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">/{p.slug}</p>
                    </div>
                    {p.isCore ? (
                      <Lock className="h-3 w-3 text-slate-350 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-350 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Page Editor Area */}
        <div className="lg:col-span-3">
          {isNewAction ? (
            /* Create Page Form */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <Plus className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-slate-700">Create Custom Page</h2>
              </div>

              <AdminForm action={savePageAction} successMessage="Custom page created successfully!">
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Page Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Page Title</label>
                      <input
                        name="title"
                        type="text"
                        placeholder="e.g. About Us"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        required
                      />
                    </div>

                    {/* Page Slug */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Page Slug (URL Path)</label>
                      <input
                        name="slug"
                        type="text"
                        placeholder="e.g. about"
                        pattern="^[a-z0-9-]+$"
                        title="Lowercase letters, numbers, and dashes only"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono"
                        required
                      />
                      <p className="text-[10px] text-slate-400">Lowercase letters, numbers, and dashes only.</p>
                    </div>
                  </div>

                  {/* HTML Content (CKEditor) */}
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">HTML Page Content (CKEditor)</label>
                      <span className="text-xs text-slate-400">WYSIWYG layout enabled</span>
                    </div>
                    <CKEditorTextArea
                      name="content"
                      defaultValue=""
                      placeholder="Write your custom page content here using heading styles, bolding, bullet structures, quotes, etc."
                    />
                  </div>

                  {/* Form Footer Trigger */}
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Create Dynamic Page
                    </button>
                  </div>
                </div>
              </AdminForm>
            </div>
          ) : (
            /* Edit Page Form */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">Edit Page: {selectedPage?.title}</h2>
                </div>
                
                {/* Delete Page Button (Core pages cannot be deleted) */}
                {selectedPage && !selectedPage.isCore && (
                  <form
                    action={async () => {
                      "use server";
                      if (selectedPage) {
                        await deletePageAction(selectedPage.slug);
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
                      title="Permanently remove page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Page
                    </button>
                  </form>
                )}
              </div>

              {selectedPage && (
                <AdminForm action={savePageAction} successMessage="Page content saved successfully!">
                  {/* Keep Slug as hidden input for upsert operations */}
                  <input type="hidden" name="slug" value={selectedPage.slug} />

                  <div className="p-6 space-y-5">
                    {/* Display Slug Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Page Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Page Display Title</label>
                        <input
                          name="title"
                          type="text"
                          defaultValue={selectedPage.title}
                          placeholder={selectedPage.title}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          required
                        />
                      </div>

                      {/* Display URL Path */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">URL Route Path</label>
                        <div className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 font-mono flex items-center select-none">
                          /{selectedPage.slug}
                        </div>
                      </div>
                    </div>

                    {/* Rich HTML Content Editor */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">HTML Page Content (CKEditor)</label>
                        <span className="text-xs text-slate-400">WYSIWYG layout enabled</span>
                      </div>
                      <CKEditorTextArea
                        name="content"
                        defaultValue={selectedPage.content}
                        placeholder="Draft your legal/informational details here..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                      >
                        <Save className="h-4 w-4" />
                        Save Page Content
                      </button>
                    </div>
                  </div>
                </AdminForm>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
