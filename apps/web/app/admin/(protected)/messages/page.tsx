import { prisma } from "@/lib/db";
import { Mail, Calendar, MapPin, Globe, Trash2 } from "lucide-react";
import { deleteMessageAction } from "./actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">User Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage received contact inquiries, user feedback, and metadata
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
          Total: {messages.length} messages
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No messages found</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            When users submit messages from the contact page, they will appear here with their IP and location.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Card Top / Metadata */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 leading-tight">{msg.name}</h3>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {msg.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs font-medium">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {new Date(msg.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Connection Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">IP: <span className="font-mono font-medium text-slate-700">{msg.ip || "Unknown"}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={msg.location || "Unknown"}>
                      Loc: <span className="font-medium text-slate-700">{msg.location || "Unknown"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body / Message */}
              <div className="p-6 flex-1 bg-white border-b border-slate-100">
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 leading-relaxed italic whitespace-pre-wrap font-sans">
                  {msg.message}
                </div>
              </div>

              {/* Card Footer / Actions */}
              <div className="px-6 py-3 bg-slate-50/30 flex justify-end">
                <form
                  action={async () => {
                    "use server";
                    await deleteMessageAction(msg.id);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 hover:border-red-600 px-3.5 py-2 rounded-xl border border-red-200 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Message
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
