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
  const lastSelectionRef = useRef<{ index: number; length: number } | null>(null);
  const isUserTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userClickedRef = useRef(false);
  const isPastingRef = useRef(false);
  // Generate a safe CSS class name (only alphanumeric and hyphens)
  const editorIdRef = useRef(`wysiwyg-${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9-]/g, '')}`);

  // Function to restore cursor position
  const restoreCursorPosition = (quill: any, force = false) => {
    if (!lastSelectionRef.current || (isUserTypingRef.current && !force) || isPastingRef.current) return;
    
    const { index, length } = lastSelectionRef.current;
    const textLength = quill.getLength();
    
    // Ensure index is within bounds
    const safeIndex = Math.min(index, Math.max(0, textLength - 1));
    const safeLength = Math.min(length, textLength - safeIndex);
    
    // Use multiple requestAnimationFrame calls to ensure it sticks
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          quill.setSelection(safeIndex, safeLength, 'user');
          // Verify it was set correctly, if not try again
          setTimeout(() => {
            const currentSelection = quill.getSelection();
            if (currentSelection && currentSelection.index === 0 && currentSelection.length === 0 && safeIndex > 0) {
              // Cursor was reset to beginning, restore again
              try {
                quill.setSelection(safeIndex, safeLength, 'user');
              } catch (e) {
                // Ignore
              }
            }
          }, 50);
        } catch (e) {
          // If setSelection fails, try without the 'user' source
          try {
            quill.setSelection(safeIndex, safeLength);
          } catch (e2) {
            // Ignore errors if selection can't be set
          }
        }
      });
    });
  };

  useEffect(() => {
    if (autoFocus && quillRef.current) {
      const quill = quillRef.current.getEditor();
      // Wait for Quill to be ready, then focus and restore cursor
      setTimeout(() => {
        quill.focus();
        // Check if cursor is at beginning before restoring (only if user didn't click)
        setTimeout(() => {
          if (!userClickedRef.current) {
            const currentSelection = quill.getSelection();
            if (!currentSelection || (currentSelection.index === 0 && currentSelection.length === 0)) {
              restoreCursorPosition(quill);
            }
          }
        }, 50);
      }, 100);
    }
  }, [autoFocus]);

  // Restore cursor position when editor gains focus (but respect user clicks)
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

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
      // Only restore if user didn't just click and cursor is at beginning
      if (!hasRestoredOnFocus && lastSelectionRef.current && !userClickedRef.current) {
        setTimeout(() => {
          const currentSelection = quill.getSelection();
          // If cursor is at the beginning (index 0), restore saved position
          // This handles the case where ReactQuill reset it, but not if user clicked
          if (currentSelection && currentSelection.index === 0 && currentSelection.length === 0) {
            restoreCursorPosition(quill);
          }
          hasRestoredOnFocus = true;
        }, 50);
      } else if (userClickedRef.current) {
        // User clicked, so respect their click position - don't restore
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

    return () => {
      editorElement.removeEventListener('focus', handleFocus);
      editorElement.removeEventListener('blur', handleBlurInternal);
      editorElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Restore cursor position when value changes externally (not from user typing or clicking)
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Don't restore if user is actively typing, just clicked, or pasting
    if (isUserTypingRef.current || userClickedRef.current || isPastingRef.current) return;

    // Only restore if we have a saved selection and editor is focused
    if (lastSelectionRef.current && (document.activeElement === quill.root || quill.hasFocus())) {
      // Use a longer delay to ensure Quill has processed the value change
      setTimeout(() => {
        const currentSelection = quill.getSelection();
        // Only restore if cursor is at beginning (ReactQuill reset it)
        if (!currentSelection || (currentSelection.index === 0 && currentSelection.length === 0)) {
          restoreCursorPosition(quill);
        }
      }, 50);
    }
  }, [value]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Restore cursor when editor is ready (for initial mount with autoFocus)
    const checkAndRestore = () => {
      if (lastSelectionRef.current && (autoFocus || document.activeElement === quill.root)) {
        setTimeout(() => {
          const currentSelection = quill.getSelection();
          // If cursor is at beginning, restore saved position
          if (!currentSelection || (currentSelection.index === 0 && currentSelection.length === 0)) {
            restoreCursorPosition(quill);
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
      }
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

    const handlePaste = (e: ClipboardEvent) => {
      // Ensure paste works - don't prevent default, let Quill handle it
      isPastingRef.current = true;
      // Use a longer timeout to ensure paste completes before allowing blur
      setTimeout(() => {
        isPastingRef.current = false;
      }, 500);
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
      // Save cursor position
      const selection = quill.getSelection();
      if (selection) {
        lastSelectionRef.current = {
          index: selection.index,
          length: selection.length,
        };
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
        }, 150);
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

    return () => {
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
  }, [onSave, autoFocus]);

  // Handle blur to save cursor position
  const handleBlur = () => {
    // Don't trigger onBlur callback if user is pasting - this prevents
    // edit mode from exiting when pasting content
    if (isPastingRef.current) {
      return;
    }
    
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const selection = quill.getSelection();
      if (selection) {
        lastSelectionRef.current = {
          index: selection.index,
          length: selection.length,
        };
      }
    }
    onBlur?.();
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
    clipboard: {
      // Enable clipboard module (default behavior)
      matchVisual: false,
    },
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet'
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
