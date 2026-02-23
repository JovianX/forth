import React, { useRef, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSave?: () => void;
  /** When provided, plain Enter creates new block instead of new paragraph */
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** When true, focus immediately (no delay) - for newly created blocks */
  focusImmediately?: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  onBlur,
  onSave,
  onEnter,
  placeholder = 'Write text...',
  className = '',
  autoFocus = false,
  focusImmediately = false,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  /** Safe getter - returns null if editor not yet instantiated (avoids "Accessing non-instantiated editor") */
  const getQuill = (): ReturnType<ReactQuill['getEditor']> | null => {
    try {
      return quillRef.current?.getEditor?.() ?? null;
    } catch {
      return null;
    }
  };
  const lastSelectionRef = useRef<{ index: number; length: number } | null>(null);
  const isUserTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userClickedRef = useRef(false);
  const isPastingRef = useRef(false);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  // Generate a safe CSS class name (only alphanumeric and hyphens)
  const editorIdRef = useRef(`wysiwyg-${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9-]/g, '')}`);

  // Function to restore cursor position (guards against "addRange: range isn't in document")
  const restoreCursorPosition = (quill: any, force = false) => {
    if (!lastSelectionRef.current || (isUserTypingRef.current && !force) || isPastingRef.current) return;
    if (!quill?.root?.isConnected) return;

    const { index, length } = lastSelectionRef.current;
    const textLength = quill.getLength();
    if (textLength <= 0) return;

    // Ensure index is within bounds (Quill doc has at least 1 for newline)
    const safeIndex = Math.min(index, Math.max(0, textLength - 1));
    const safeLength = Math.min(length, Math.max(0, textLength - safeIndex));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!quill?.root?.isConnected) return;
        try {
          quill.setSelection(safeIndex, safeLength, 'user');
          setTimeout(() => {
            if (!quill?.root?.isConnected) return;
            const currentSelection = quill.getSelection();
            if (currentSelection && currentSelection.index === 0 && currentSelection.length === 0 && safeIndex > 0) {
              try {
                quill.setSelection(safeIndex, safeLength, 'user');
              } catch {
                // Ignore - avoid "addRange" console noise
              }
            }
          }, 50);
        } catch {
          try {
            quill.setSelection(safeIndex, safeLength);
          } catch {
            // Ignore - selection can't be set (e.g. range not in document)
          }
        }
      });
    });
  };

  useEffect(() => {
    if (!autoFocus) return;
    let cancelled = false;
    const delay = focusImmediately ? 0 : 100;
    const retryMs = focusImmediately ? 25 : 50;
    const maxAttempts = 30;

    const focusEditor = (q: NonNullable<ReturnType<typeof getQuill>>) => {
      if (!q.root?.isConnected) return;
      try {
        q.root.focus();
        // Defer setSelection to avoid "addRange: range isn't in document" when DOM isn't ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !q.root?.isConnected) return;
            const len = q.getLength();
            if (len < 1) return; // Editor not ready yet
            // Don't overwrite cursor if user has already typed (avoids "strange behaviour on first type")
            if (len > 1) return;
            try {
              q.setSelection(0, 0, 'silent');
            } catch {
              // Ignore - avoid addRange console warning when doc not ready
            }
          });
        });
      } catch {
        try {
          q.focus();
        } catch {
          // Ignore (e.g. addRange when doc not ready)
        }
      }
    };

    const attempt = (n = 0) => {
      if (cancelled || n >= maxAttempts) return;
      const quill = getQuill();
      if (quill?.root?.isConnected) {
        const run = () => {
          if (cancelled || !quill) return;
          focusEditor(quill);
        };
        delay > 0 ? setTimeout(run, delay) : requestAnimationFrame(() => requestAnimationFrame(run));
      } else {
        setTimeout(() => attempt(n + 1), retryMs);
      }
    };
    attempt();
    return () => { cancelled = true; };
  }, [autoFocus, focusImmediately]);

  // Restore cursor position when editor gains focus (but respect user clicks)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const trySetup = (attempt = 0) => {
      const quill = getQuill();
      if (!quill) {
        if (attempt < 10) setTimeout(() => trySetup(attempt + 1), 50);
        return;
      }

    let hasRestoredOnFocus = false;

    const handleMouseDown = () => {
      // User is clicking, so we should respect their click position
      userClickedRef.current = true;
      // Reset the flag after a short delay
      setTimeout(() => {
        userClickedRef.current = false;
      }, 100);
    };

    const handleFocus = () => {
      if (!hasRestoredOnFocus && lastSelectionRef.current && !userClickedRef.current) {
        setTimeout(() => {
          try {
            const currentSelection = quill.getSelection();
            if (currentSelection && currentSelection.index === 0 && currentSelection.length === 0) {
              restoreCursorPosition(quill);
            }
          } catch {
            // Ignore when range isn't in document
          }
          hasRestoredOnFocus = true;
        }, 50);
      } else if (userClickedRef.current) {
        hasRestoredOnFocus = true;
      }
    };

    const handleBlurInternal = () => {
      // Reset flag when editor loses focus
      hasRestoredOnFocus = false;
      userClickedRef.current = false;
    };

    const editorElement = quill.root;
    editorElement.addEventListener('focus', handleFocus);
    editorElement.addEventListener('blur', handleBlurInternal);
    editorElement.addEventListener('mousedown', handleMouseDown);

    cleanup = () => {
      editorElement.removeEventListener('focus', handleFocus);
      editorElement.removeEventListener('blur', handleBlurInternal);
      editorElement.removeEventListener('mousedown', handleMouseDown);
    };
    };
    trySetup();
    return () => cleanup?.();
  }, []);

  // Restore cursor position when value changes externally (not from user typing or clicking)
  useEffect(() => {
    const quill = getQuill();
    if (!quill || !quill.root?.isConnected) return;
    if (isUserTypingRef.current || userClickedRef.current || isPastingRef.current) return;

    if (lastSelectionRef.current && (document.activeElement === quill.root || quill.hasFocus())) {
      setTimeout(() => {
        try {
          const currentSelection = quill.getSelection();
          if (!currentSelection || (currentSelection.index === 0 && currentSelection.length === 0)) {
            restoreCursorPosition(quill);
          }
        } catch {
          // Ignore when range isn't in document
        }
      }, 50);
    }
  }, [value]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const trySetup = (attempt = 0) => {
      const quill = getQuill();
      if (!quill) {
        if (attempt < 10) setTimeout(() => trySetup(attempt + 1), 50);
        return;
      }

    const checkAndRestore = () => {
      if (lastSelectionRef.current && (autoFocus || document.activeElement === quill.root)) {
        setTimeout(() => {
          // Don't restore if user has been typing recently - would jump cursor before typed text
          if (isUserTypingRef.current) return;
          try {
            const currentSelection = quill.getSelection();
            if (!currentSelection || (currentSelection.index === 0 && currentSelection.length === 0)) {
              restoreCursorPosition(quill);
            }
          } catch {
            // Ignore when range isn't in document
          }
        }, 100);
      }
    };

    // Check after a delay to ensure Quill is ready
    let readyTimeout: NodeJS.Timeout | null = setTimeout(checkAndRestore, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSave?.();
        return;
      }
      // Plain Enter is handled by Quill keyboard binding when onEnter is provided
      // Handle paste shortcuts - set flag before paste happens
      // Don't prevent default - let Quill handle paste natively
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        isPastingRef.current = true;
        // Reset flag after paste completes (text-change and paste event will also handle this)
        setTimeout(() => {
          isPastingRef.current = false;
        }, 500);
      }
    };

    const handleContextMenu = () => {
      // Allow the default context menu (which includes paste) to work
      // Don't prevent default - let the browser show the context menu
      // This enables right-click paste functionality
      // Set paste flag when context menu is shown (user might paste from menu)
      // Note: The actual paste event will also set this flag, but we set it here
      // as a precaution in case the paste event doesn't fire
      isPastingRef.current = true;
      setTimeout(() => {
        isPastingRef.current = false;
      }, 1000);
    };

    const handlePaste = (_e: ClipboardEvent) => {
      // Ensure paste works - don't prevent default, let Quill handle it
      isPastingRef.current = true;
      // Use a longer timeout to ensure paste completes before allowing blur
      setTimeout(() => {
        isPastingRef.current = false;
      }, 500);
    };

    const updateToolbarPosition = () => {
      if (!quill.root?.isConnected) return;
      const toolbar = document.querySelector(`.${editorIdRef.current} .ql-toolbar`) as HTMLElement;
      if (!toolbar) return;

      let selection: { index: number; length: number } | null = null;
      try {
        selection = quill.getSelection();
      } catch {
        toolbar.classList.remove('show');
        return;
      }
      const hasTextSelection = selection && selection.length > 0;

      if (hasTextSelection && selection) {
        try {
          const docLength = quill.getLength();
          if (selection.index >= docLength || selection.index < 0) {
            toolbar.classList.remove('show');
            return;
          }
          const bounds = quill.getBounds(selection.index, Math.min(selection.length, docLength - selection.index));
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
          // Allow negative values so toolbar can appear above container when selection is in first line
          const topPosition = editorOffsetTop + bounds.top - toolbarHeight - offset;
          
          // Don't clamp to 0 - allow toolbar to go above container to stay above first line selection
          const finalTop = topPosition;
          
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
      try {
        const selection = quill.getSelection();
        if (selection) {
          lastSelectionRef.current = { index: selection.index, length: selection.length };
        }
      } catch {
        // Ignore when range isn't in document (e.g. during React re-render)
      }
      updateToolbarPosition();
    };

    const handleTextChange = (delta: any, _oldDelta: any, source: string) => {
      // Detect if this is a paste operation
      if (source === 'user' && delta.ops) {
        // Check if this looks like a paste (large insertion)
        const hasLargeInsertion = delta.ops.some((op: any) => 
          op.insert && typeof op.insert === 'string' && op.insert.length > 1
        );
        if (hasLargeInsertion && isPastingRef.current) {
          // This is likely a paste, keep the flag set
          setTimeout(() => {
            isPastingRef.current = false;
          }, 300);
        }
      }
      
      // Mark that user is typing
      isUserTypingRef.current = true;
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        updateToolbarPosition();
        // Reset typing flag after user stops typing
        typingTimeoutRef.current = setTimeout(() => {
          isUserTypingRef.current = false;
        }, 300);
      }, 0);
    };

    const editorElement = quill.root;
    editorElement.addEventListener('keydown', handleKeyDown);
    editorElement.addEventListener('paste', handlePaste);
    editorElement.addEventListener('contextmenu', handleContextMenu);
    quill.on('selection-change', handleSelectionChange);
    quill.on('text-change', handleTextChange);
    
    // Also update on scroll to keep toolbar positioned correctly
    const handleScroll = () => {
      updateToolbarPosition();
    };
    editorElement.addEventListener('scroll', handleScroll);

    // Check initial selection state
    handleSelectionChange();

    cleanup = () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
      editorElement.removeEventListener('paste', handlePaste);
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      editorElement.removeEventListener('scroll', handleScroll);
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (readyTimeout) {
        clearTimeout(readyTimeout);
      }
    };
    };
    trySetup();
    return () => cleanup?.();
  }, [onSave, autoFocus]);

  const handleBlur = () => {
    if (isPastingRef.current) return;

    const quill = getQuill();
    if (quill) {
      try {
        const selection = quill.getSelection();
        if (selection) {
          lastSelectionRef.current = { index: selection.index, length: selection.length };
        }
      } catch {
        // Ignore when range isn't in document
      }
    }
    onBlur?.();
  };

  const modules = useMemo(() => {
    const base: Record<string, unknown> = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ],
      clipboard: {
        matchVisual: false,
      },
    };
    // When onEnter is provided, override Enter to create new block instead of new line.
    // Config bindings run before Quill's defaults; shiftKey:false = plain Enter only.
    if (onEnter) {
      base.keyboard = {
        bindings: {
          enterNewBlock: {
            key: 'Enter',
            shiftKey: false,
            metaKey: false,
            ctrlKey: false,
            handler: function(this: { quill: { root: HTMLElement } }, _range: { index: number; length: number }) {
              const cb = onEnterRef.current;
              if (cb) {
                cb();
                return false; // Prevent Quill from inserting newline
              }
              return true;
            },
          },
        },
      };
    }
    return base;
  }, [onEnter]);

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list'
  ];

  return (
    <>
      <div 
        className={`${className} ${editorIdRef.current}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          onBlur={handleBlur}
          className="wysiwyg-editor"
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </div>
      <style>{`
        .${editorIdRef.current} {
          position: relative;
          overflow: visible;
        }
        .${editorIdRef.current} .ql-container {
          border: none;
          font-size: inherit;
          font-family: inherit;
          width: 100%;
          min-width: 0;
        }
        .${editorIdRef.current} .ql-editor {
          padding: 0.25rem 0.25rem;
          min-height: 1.5rem;
          color: #374151 !important;
          line-height: 1.42;
          font-size: inherit;
          font-weight: inherit;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
        }
        .${editorIdRef.current} .ql-editor * {
          color: inherit;
          font-size: inherit;
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
        /* Match display mode list styling exactly - must be identical for seamless edit/read switching */
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
        /* Both ul and ol render as bullets; center bullet vertically with first line */
        .${editorIdRef.current} .ql-editor ul li::before,
        .${editorIdRef.current} .ql-editor ol li::before {
          content: "\\2022" !important;
          position: absolute !important;
          left: 0 !important;
          color: #374151 !important;
          font-size: 1.4em !important;
          font-weight: bold !important;
          line-height: 1 !important;
          top: 0 !important;
        }
        /* Hide Quill's .ql-ui - we use li::before for consistent edit/read appearance */
        .${editorIdRef.current} .ql-editor li[data-list=bullet] > .ql-ui::before,
        .${editorIdRef.current} .ql-editor li[data-list=ordered] > .ql-ui::before {
          content: none !important;
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
