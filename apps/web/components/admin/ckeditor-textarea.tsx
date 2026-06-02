"use client";

import { useEffect, useRef, useState } from "react";

interface CKEditorTextAreaProps {
  name: string;
  defaultValue: string;
  placeholder?: string;
}

export function CKEditorTextArea({ name, defaultValue, placeholder }: CKEditorTextAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [value, setValue] = useState(defaultValue);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if ((window as any).ClassicEditor) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = "ckeditor-cdn-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.ckeditor.com/ckeditor5/41.1.0/classic/ckeditor.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const handleScriptLoad = () => setScriptLoaded(true);
    script.addEventListener("load", handleScriptLoad);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || editorRef.current) return;

    const textarea = containerRef.current.querySelector("textarea");
    if (!textarea) return;

    (window as any).ClassicEditor.create(textarea, {
      placeholder: placeholder || "Write content here...",
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "link",
        "bulletedList",
        "numberedList",
        "blockQuote",
        "undo",
        "redo",
      ],
    })
      .then((editor: any) => {
        editorRef.current = editor;
        
        // Keep React state in sync with CKEditor data
        editor.model.document.on("change:data", () => {
          const data = editor.getData();
          setValue(data);
        });
      })
      .catch((error: any) => {
        console.error("CKEditor initialization failed:", error);
      });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy().then(() => {
          editorRef.current = null;
        });
      }
    };
  }, [scriptLoaded, placeholder]);

  return (
    <div ref={containerRef} className="ckeditor-wrapper">
      <textarea
        defaultValue={defaultValue}
        className="hidden"
        style={{ display: "none" }}
      />
      {/* Hidden input to pass data to server action via form submission */}
      <input type="hidden" name={name} value={value} />

      <style>{`
        .ck-editor__editable_inline {
          min-height: 160px;
          max-height: 400px;
          padding: 0 20px !important;
          font-size: 0.875rem !important;
          color: #1e293b !important;
        }
        .ck.ck-editor__top .ck-sticky-panel__content {
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
        }
        .ck.ck-toolbar {
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
          border-color: #cbd5e1 !important;
          background: #f8fafc !important;
        }
        .ck.ck-content {
          border-color: #cbd5e1 !important;
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        .ck.ck-editor__main>.ck-editor__editable:not(.ck-focused) {
          border-color: #e2e8f0 !important;
        }
        .ck.ck-editor__main>.ck-editor__editable.ck-focused {
          border-color: #3b82f6 !important;
        }
        .ck-editor {
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
}
