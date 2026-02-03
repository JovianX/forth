import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  onBlur,
  onSave,
  placeholder = 'Write text...',
  className = '',
  autoFocus = false,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  // Generate a safe CSS class name (only alphanumeric and hyphens)
  const editorIdRef = useRef(`wysiwyg-${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9-]/g, '')}`);

  useEffect(() => {
    if (autoFocus && quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSave?.();
      }
    };

    const updateToolbarPosition = () => {
      const toolbar = document.querySelector(`.${editorIdRef.current} .ql-toolbar`) as HTMLElement;
      if (!toolbar) return;

      const selection = quill.getSelection();
      const hasTextSelection = selection && selection.length > 0;
      
      if (hasTextSelection) {
        try {
          // Get the bounds of the selection (relative to the editor element)
          const bounds = quill.getBounds(selection.index, selection.length);
          if (!bounds) {
            toolbar.classList.remove('show');
            return;
          }
          
          const editorElement = quill.root;
          
          // Get the container element
          const container = editorElement.closest(`.${editorIdRef.current}`) as HTMLElement;
          if (!container) return;
          
          // Get positions using getBoundingClientRect for accurate coordinates
          const editorRect = editorElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate the editor's offset within the container
          // bounds.top is relative to editor, so we need editor's position relative to container
          const editorOffsetTop = editorRect.top - containerRect.top;
          const editorOffsetLeft = editorRect.left - containerRect.left;
          
          // Position toolbar above the selection
          const toolbarHeight = 40; // Approximate toolbar height
          const offset = 8; // Space between selection and toolbar
          
          // Calculate top position: editor offset + selection top - toolbar height - offset
          const topPosition = editorOffsetTop + bounds.top - toolbarHeight - offset;
          
          // Ensure toolbar doesn't go above the container
          const minTop = 0;
          const finalTop = Math.max(minTop, topPosition);
          
          // Remove any fixed width to let toolbar size to its content
          toolbar.style.width = 'auto';
          
          // Temporarily position off-screen and make visible to measure natural width
          toolbar.style.top = '-9999px';
          toolbar.style.left = '0';
          toolbar.style.visibility = 'visible';
          toolbar.style.opacity = '1';
          toolbar.style.display = 'block';
          toolbar.classList.add('show');
          
          // Force reflow and measure the actual toolbar width
          void toolbar.offsetWidth; // Force reflow
          const toolbarWidth = toolbar.getBoundingClientRect().width || toolbar.offsetWidth || 200;
          
          // Calculate horizontal position (center above selection)
          const selectionCenter = bounds.left + (bounds.width / 2);
          
          // Center the toolbar above the selection, but keep it within bounds
          let finalLeft = editorOffsetLeft + selectionCenter - (toolbarWidth / 2);
          finalLeft = Math.max(8, Math.min(finalLeft, containerRect.width - toolbarWidth - 8));
          
          // Set final position (keep show class for visibility)
          toolbar.style.top = `${finalTop}px`;
          toolbar.style.left = `${finalLeft}px`;
          toolbar.style.width = 'auto';
        } catch (error) {
          // If bounds calculation fails, fall back to default behavior
          toolbar.classList.remove('show');
        }
      } else {
        toolbar.classList.remove('show');
      }
    };

    const handleSelectionChange = () => {
      updateToolbarPosition();
    };

    const handleTextChange = () => {
      // Small delay to ensure DOM is updated
      setTimeout(updateToolbarPosition, 0);
    };

    const editorElement = quill.root;
    editorElement.addEventListener('keydown', handleKeyDown);
    quill.on('selection-change', handleSelectionChange);
    quill.on('text-change', handleTextChange);
    
    // Also update on scroll to keep toolbar positioned correctly
    const handleScroll = () => {
      updateToolbarPosition();
    };
    editorElement.addEventListener('scroll', handleScroll);

    // Check initial selection state
    handleSelectionChange();

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
      editorElement.removeEventListener('scroll', handleScroll);
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
    };
  }, [onSave]);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  return (
    <>
      <div className={`${className} ${editorIdRef.current}`} onClick={(e) => e.stopPropagation()}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          onBlur={onBlur}
          className="wysiwyg-editor"
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </div>
      <style>{`
        .${editorIdRef.current} {
          position: relative;
        }
        .${editorIdRef.current} .ql-container {
          border: none;
          font-size: inherit;
          font-family: inherit;
        }
        .${editorIdRef.current} .ql-editor {
          padding: 0.25rem 0.25rem;
          min-height: 1.5rem;
          color: #374151 !important;
          line-height: inherit;
          font-size: inherit;
          font-weight: inherit;
        }
        .${editorIdRef.current} .ql-editor * {
          color: inherit;
          font-size: inherit;
        }
        .${editorIdRef.current} .ql-editor a {
          color: #3b82f6 !important;
        }
        /* Ensure all text elements match display mode exactly */
        .${editorIdRef.current} .ql-editor p,
        .${editorIdRef.current} .ql-editor div,
        .${editorIdRef.current} .ql-editor span {
          color: inherit;
        }
        .${editorIdRef.current} .ql-editor p {
          margin: 0.5em 0;
          line-height: inherit;
        }
        .${editorIdRef.current} .ql-editor p:first-child {
          margin-top: 0;
        }
        .${editorIdRef.current} .ql-editor p:last-child {
          margin-bottom: 0;
        }
        .${editorIdRef.current} .ql-editor h1,
        .${editorIdRef.current} .ql-editor h2,
        .${editorIdRef.current} .ql-editor h3 {
          margin: 0.75em 0 0.5em 0;
          font-weight: 600;
          line-height: inherit;
        }
        .${editorIdRef.current} .ql-editor h1:first-child,
        .${editorIdRef.current} .ql-editor h2:first-child,
        .${editorIdRef.current} .ql-editor h3:first-child {
          margin-top: 0;
        }
        .${editorIdRef.current} .ql-editor h1 {
          font-size: 1.5em;
        }
        .${editorIdRef.current} .ql-editor h2 {
          font-size: 1.25em;
        }
        .${editorIdRef.current} .ql-editor h3 {
          font-size: 1.1em;
        }
        /* Match display mode list styling exactly */
        /* Reduced indentation for better visual balance */
        .${editorIdRef.current} .ql-editor ul,
        .${editorIdRef.current} .ql-editor ol {
          margin: 0.5em 0;
          padding-left: 0;
          list-style-type: none;
        }
        .${editorIdRef.current} .ql-editor li {
          margin: 0.25em 0;
          padding-left: 1.5em;
          list-style: none;
          position: relative;
        }
        /* Bullet lists - match display mode exactly */
        .${editorIdRef.current} .ql-editor ul li::before {
          content: "\\2022" !important;
          display: inline-block !important;
          margin-left: -1.5em !important;
          margin-right: 0.3em !important;
          text-align: right !important;
          white-space: nowrap !important;
          width: 1.2em !important;
          color: #374151 !important;
          font-size: 1.4em !important;
          font-weight: bold !important;
          line-height: 1 !important;
          vertical-align: baseline !important;
          transform: translateY(0.1em) !important;
        }
        /* Override Quill's default bullet styling to match display mode */
        .${editorIdRef.current} .ql-editor li[data-list=bullet] > .ql-ui::before {
          content: "\\2022" !important;
          font-size: 1.4em !important;
          font-weight: bold !important;
          line-height: 1 !important;
          vertical-align: baseline !important;
          transform: translateY(0.1em) !important;
          color: #374151 !important;
          display: inline-block !important;
          margin-left: -1.5em !important;
          margin-right: 0.3em !important;
          text-align: right !important;
          white-space: nowrap !important;
          width: 1.2em !important;
        }
        .${editorIdRef.current} .ql-editor a {
          text-decoration: underline;
        }
        .${editorIdRef.current} .ql-editor strong {
          font-weight: 600;
        }
        .${editorIdRef.current} .ql-editor em {
          font-style: italic;
        }
        .${editorIdRef.current} .ql-editor u {
          text-decoration: underline;
        }
        .${editorIdRef.current} .ql-editor s {
          text-decoration: line-through;
        }
        .${editorIdRef.current} .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
        .${editorIdRef.current} .ql-toolbar {
          position: absolute;
          border: none;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          z-index: 10;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          pointer-events: none;
          white-space: nowrap;
        }
        .${editorIdRef.current} .ql-toolbar.show {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .${editorIdRef.current} .ql-toolbar .ql-formats {
          margin-right: 0.5rem;
        }
        .${editorIdRef.current} .ql-toolbar button {
          padding: 0.25rem;
          width: 1.5rem;
          height: 1.5rem;
        }
        .${editorIdRef.current} .ql-toolbar button:hover,
        .${editorIdRef.current} .ql-toolbar button.ql-active {
          color: #3b82f6;
        }
        .${editorIdRef.current} .ql-toolbar .ql-stroke {
          stroke: currentColor;
        }
        .${editorIdRef.current} .ql-toolbar .ql-fill {
          fill: currentColor;
        }
      `}</style>
    </>
  );
};
