"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  PlusCircle, Trash2, Edit, Link2, ExternalLink, Eye, EyeOff,
  CornerDownRight, Sparkles, RefreshCw, ChevronUp, ChevronDown, Check
} from "lucide-react";
import {
  saveMenuItemAction,
  deleteMenuItemAction,
  reorderMenuItemsAction,
  loadDefaultMenusAction
} from "./actions";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  location: string;
  group: string | null;
  order: number;
  newTab: boolean;
  isActive: boolean;
  parentId: string | null;
  children?: MenuItem[];
  updatedAt: Date;
}

interface CustomPage {
  slug: string;
  title: string;
}

interface Tool {
  id: string;
  label: string;
}

export function MenuManagerClient({
  initialItems,
  customPages,
  toolsList,
}: {
  initialItems: MenuItem[];
  customPages: CustomPage[];
  toolsList: Tool[];
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Edit / Form state
  const [id, setId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("HEADER"); // HEADER or FOOTER
  const [group, setGroup] = useState(""); // Only for FOOTER
  const [order, setOrder] = useState(0);
  const [newTab, setNewTab] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  // Link Type Selector
  const [linkType, setLinkType] = useState<"custom" | "page" | "tool">("custom");
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedTool, setSelectedTool] = useState("");

  // Tab State for right panel
  const [activeTab, setActiveTab] = useState<"HEADER" | "FOOTER">("HEADER");

  // Filter items by location
  const headerItems = items.filter(
    (item) => item.location === "HEADER" && item.parentId === null
  ).sort((a, b) => a.order - b.order);

  const footerItems = items.filter(
    (item) => item.location === "FOOTER"
  ).sort((a, b) => a.order - b.order);

  // Parent menu items (only top-level Header items can be parents, excluding self)
  const availableParents = items.filter(
    (item) => item.location === "HEADER" && item.parentId === null && item.id !== id
  );

  const resetForm = () => {
    setId(null);
    setLabel("");
    setUrl("");
    setGroup("");
    setOrder(0);
    setNewTab(false);
    setIsActive(true);
    setParentId(null);
    setLinkType("custom");
    setSelectedPage("");
    setSelectedTool("");
  };

  const handleLinkTypeChange = (type: "custom" | "page" | "tool") => {
    setLinkType(type);
    if (type === "page") {
      setSelectedTool("");
    } else if (type === "tool") {
      setSelectedPage("");
    } else {
      setSelectedPage("");
      setSelectedTool("");
    }
  };

  const selectPageLink = (slug: string) => {
    setSelectedPage(slug);
    const page = customPages.find((p) => p.slug === slug);
    if (page) {
      setLabel(page.title);
      setUrl(`/${slug}`);
    }
  };

  const selectToolLink = (toolId: string) => {
    setSelectedTool(toolId);
    const tool = toolsList.find((t) => t.id === toolId);
    if (tool) {
      setLabel(tool.label);
      setUrl(`/${toolId}`);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setId(item.id);
    setLabel(item.label);
    setUrl(item.url);
    setLocation(item.location);
    setGroup(item.group || "");
    setOrder(item.order);
    setNewTab(item.newTab);
    setIsActive(item.isActive);
    setParentId(item.parentId);

    // Determine link type from URL structure
    if (item.url.startsWith("/")) {
      const slug = item.url.replace("/", "");
      const isCustomPage = customPages.some((p) => p.slug === slug);
      const isTool = toolsList.some((t) => t.id === slug);

      if (isCustomPage) {
        setLinkType("page");
        setSelectedPage(slug);
      } else if (isTool) {
        setLinkType("tool");
        setSelectedTool(slug);
      } else {
        setLinkType("custom");
      }
    } else {
      setLinkType("custom");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim() || !url.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (id) formData.append("id", id);
        formData.append("label", label);
        formData.append("url", url);
        formData.append("location", location);
        if (location === "FOOTER") {
          formData.append("group", group || "General");
        }
        formData.append("order", order.toString());
        formData.append("newTab", newTab.toString());
        formData.append("isActive", isActive.toString());
        if (location === "HEADER" && parentId) {
          formData.append("parentId", parentId);
        }

        await saveMenuItemAction(formData);
        toast.success(id ? "Menu item updated!" : "Menu item created!");
        
        // Refresh local state by simulating update/insert (or relying on next reload, but let's refresh locally)
        window.location.reload();
      } catch (err: any) {
        toast.error(err.message || "Failed to save menu item");
      }
    });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    startTransition(async () => {
      try {
        await deleteMenuItemAction(itemId);
        toast.success("Menu item deleted!");
        window.location.reload();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete item");
      }
    });
  };

  const handleMove = async (item: MenuItem, direction: "up" | "down") => {
    const list = item.location === "HEADER" 
      ? items.filter((i) => i.location === "HEADER" && i.parentId === item.parentId).sort((a, b) => a.order - b.order)
      : footerItems;

    const currentIndex = list.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return; // Out of bounds

    const targetItem = list[targetIndex];
    if (!targetItem) return;

    // Swap order
    const updatedItems = [
      { id: item.id, order: targetItem.order },
      { id: targetItem.id, order: item.order }
    ];

    startTransition(async () => {
      try {
        await reorderMenuItemsAction(updatedItems);
        toast.success("Order updated!");
        window.location.reload();
      } catch (err: any) {
        toast.error(err.message || "Failed to reorder items");
      }
    });
  };

  const handleLoadDefaults = async () => {
    if (!confirm("This will clear all current custom menu settings and load default items. Proceed?")) return;

    startTransition(async () => {
      try {
        await loadDefaultMenusAction();
        toast.success("Default menus loaded!");
        window.location.reload();
      } catch (err: any) {
        toast.error(err.message || "Failed to load defaults");
      }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Advanced Menu Manager</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build premium custom navigation. Customize Header dropdowns, Footer groups, and assign dynamic routes seamlessly.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleLoadDefaults}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 disabled:opacity-50 transition-all shadow-xs cursor-pointer text-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CREATE / EDIT FORM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {id ? "Edit Menu Item" : "Create Menu Item"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {id ? "Save edits to apply configurations instantly" : "Add a custom, page, or tool link"}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Location Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Location</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setLocation("HEADER"); setParentId(null); }}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    location === "HEADER"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Navbar Header
                </button>
                <button
                  type="button"
                  onClick={() => { setLocation("FOOTER"); setParentId(null); }}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    location === "FOOTER"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Footer Links
                </button>
              </div>
            </div>

            {/* Link Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linkage Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "custom", label: "Custom URL" },
                  { id: "page", label: "Custom Page" },
                  { id: "tool", label: "PDF Tool" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleLinkTypeChange(type.id as any)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                      linkType === type.id
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:border-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Link Helper Dropdown if Dynamic Type */}
            {linkType === "page" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Custom Page</label>
                <select
                  value={selectedPage}
                  onChange={(e) => selectPageLink(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Choose custom page --</option>
                  {customPages.map((page) => (
                    <option key={page.slug} value={page.slug}>
                      {page.title} (/{page.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkType === "tool" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select PDF Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => selectToolLink(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Choose PDF tool --</option>
                  {toolsList.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.label} (/{tool.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Label and URL Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link Label</label>
                <input
                  type="text"
                  placeholder="e.g. Terms"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target URL</label>
                <input
                  type="text"
                  placeholder="e.g. /terms"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Footer Column Group Input */}
            {location === "FOOTER" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Footer Column Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Legal, Company, Tools"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-slate-400 text-[10px] italic">
                  Tip: Links with the same Group Name will be grouped in the same column together.
                </p>
              </div>
            )}

            {/* Header Parent-Child Nested dropdown settings */}
            {location === "HEADER" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Menu Item (Dropdown)</label>
                <select
                  value={parentId || ""}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None (Top Level Link)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.label} (Parent)
                    </option>
                  ))}
                </select>
                <p className="text-slate-400 text-[10px] italic">
                  Select a parent to nest this link inside a hover-dropdown.
                </p>
              </div>
            )}

            {/* Order, NewTab, and Active */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600">Display Priority (Order Weight)</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value || "0", 10))}
                  className="w-20 rounded-lg border border-slate-200 bg-white p-1 text-center text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
                <span className="text-xs font-bold text-slate-600">Open in New Tab</span>
                <input
                  type="checkbox"
                  checked={newTab}
                  onChange={(e) => setNewTab(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
                <span className="text-xs font-bold text-slate-600">Enable Navigation Link</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {id ? "Save Modifications" : "Create Navigation Link"}
              </button>
              {id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: PREVIEW & MENU INTERACTIVE ROW TREE */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section Tabs */}
          <div className="flex border-b border-slate-100 gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("HEADER")}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                activeTab === "HEADER"
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Navbar Menu Headers
            </button>
            <button
              onClick={() => setActiveTab("FOOTER")}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                activeTab === "FOOTER"
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Footer Links Columns
            </button>
          </div>

          {/* Tab lists */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3.5 mb-2">
              <span className="text-sm font-bold text-slate-800">
                {activeTab === "HEADER" ? "Header Dynamic Dropdown Hierarchy" : "Footer Dynamic Column Structure"}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded-md">
                Ordered by Priority Rank
              </span>
            </div>

            {/* Dynamic rendering */}
            {activeTab === "HEADER" ? (
              headerItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Link2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400">No header navigation items found.</p>
                  <p className="text-xs text-slate-300">Click &ldquo;Reset to Defaults&rdquo; above to seed initial menus.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {headerItems.map((item, index) => {
                    const children = items.filter((c) => c.parentId === item.id).sort((a, b) => a.order - b.order);
                    return (
                      <div key={item.id} className="space-y-2">
                        {/* Parent item Card */}
                        <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-slate-400 bg-white border h-6 w-6 rounded-md flex items-center justify-center">
                              {item.order}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate flex items-center gap-2">
                                {item.label}
                                {item.newTab && <ExternalLink className="h-3 w-3 text-slate-400" />}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{item.url}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMove(item, "up")}
                              disabled={index === 0}
                              className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(item, "down")}
                              disabled={index === headerItems.length - 1}
                              className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <span className="h-4 w-[1px] bg-slate-200/80 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-slate-400 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-slate-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Sub-item rendering */}
                        {children.map((child, childIdx) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-white pl-8 hover:bg-slate-50/30 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CornerDownRight className="h-4 w-4 text-slate-300 shrink-0" />
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border h-5 w-5 rounded-md flex items-center justify-center">
                                {child.order}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                                  {child.label}
                                  {child.newTab && <ExternalLink className="h-2.5 w-2.5 text-slate-400" />}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">{child.url}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMove(child, "up")}
                                disabled={childIdx === 0}
                                className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMove(child, "down")}
                                disabled={childIdx === children.length - 1}
                                className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <span className="h-3.5 w-[1px] bg-slate-200/80 mx-1" />
                              <button
                                type="button"
                                onClick={() => handleEdit(child)}
                                className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-slate-400 cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(child.id)}
                                className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-slate-400 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              footerItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Link2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400">No footer navigation items found.</p>
                  <p className="text-xs text-slate-300">Click &ldquo;Reset to Defaults&rdquo; above to seed initial menus.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {footerItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 hover:bg-slate-50 transition-all bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 border h-6 w-6 rounded-md flex items-center justify-center">
                          {item.order}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate flex items-center gap-2">
                            {item.label}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {item.group || "General"}
                            </span>
                            {item.newTab && <ExternalLink className="h-3 w-3 text-slate-400" />}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{item.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(item, "up")}
                          disabled={index === 0}
                          className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(item, "down")}
                          disabled={index === footerItems.length - 1}
                          className="p-1.5 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <span className="h-4 w-[1px] bg-slate-200/80 mx-1" />
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-slate-400 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-slate-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
