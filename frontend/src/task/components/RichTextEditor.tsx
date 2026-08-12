import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  List,
  ListOrdered,
  Pilcrow
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  compact?: boolean;
  onActivate?: () => void;
};

const allowedTags = new Set(['DIV', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'SPAN']);
const alignmentValues = new Set(['left', 'center', 'right', 'justify']);

export function RichTextEditor({ value, onChange, placeholder, compact = false, onActivate }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const normalizedValue = normalizeRichText(value);
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [value]);

  const toolbarButtons = useMemo(
    () => [
      { title: 'Bullets', icon: List, action: () => execEditorCommand('insertUnorderedList') },
      { title: 'Numbering', icon: ListOrdered, action: () => execEditorCommand('insertOrderedList') },
      { title: 'Align left', icon: AlignLeft, action: () => execEditorCommand('justifyLeft') },
      { title: 'Center', icon: AlignCenter, action: () => execEditorCommand('justifyCenter') },
      { title: 'Align right', icon: AlignRight, action: () => execEditorCommand('justifyRight') },
      { title: 'Justify', icon: AlignJustify, action: () => execEditorCommand('justifyFull') },
      { title: 'Paragraph', icon: Pilcrow, action: () => execEditorCommand('formatBlock', 'p') }
    ],
    []
  );

  function handleInput() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const normalizedValue = normalizeRichText(editor.innerHTML);
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
    onChange(normalizedValue);
  }

  function execEditorCommand(command: string, value?: string) {
    const editor = editorRef.current;
    if (!editor || typeof document === 'undefined') {
      return;
    }

    editor.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  const showPlaceholder = !value.trim() && !isFocused;

  return (
    <div className="grid gap-2">
      <div className={`flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 ${compact && !isFocused && !isExpanded ? 'opacity-80' : ''}`}>
        {toolbarButtons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.title}
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-white hover:text-zinc-950"
              title={button.title}
              onMouseDown={(event) => {
                event.preventDefault();
                setIsExpanded(true);
                onActivate?.();
                button.action();
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{button.title}</span>
            </button>
          );
        })}
      </div>

      <div
        className={`relative rounded-lg border bg-zinc-50 text-sm transition ${
          isFocused || isExpanded ? 'min-h-56 border-zinc-900 bg-white' : 'min-h-28 border-zinc-200'
        } ${compact ? 'min-h-32' : ''}`}
      >
        {showPlaceholder ? <div className="pointer-events-none absolute left-3 top-3 text-zinc-400">{placeholder}</div> : null}
        <div
          ref={editorRef}
          className="min-h-[inherit] w-full rounded-lg px-3 py-2.5 outline-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_p]:my-0 [&_li]:my-1"
          contentEditable
          suppressContentEditableWarning
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsExpanded(true);
            onActivate?.();
          }}
          onInput={handleInput}
        />
      </div>
    </div>
  );
}

export function normalizeRichText(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return trimmedValue;
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(trimmedValue, 'text/html');
  sanitizeNode(documentFragment.body);
  return documentFragment.body.innerHTML.trim();
}

export function richTextToPlainText(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return trimmedValue.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(trimmedValue, 'text/html');
  return documentFragment.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function sanitizeNode(root: HTMLElement) {
  const elements = [...root.querySelectorAll('*')];
  for (const element of elements) {
    if (!allowedTags.has(element.tagName)) {
      const textNode = document.createTextNode(element.textContent ?? '');
      element.replaceWith(textNode);
      continue;
    }

    for (const attribute of [...element.attributes]) {
      if (attribute.name !== 'style') {
        element.removeAttribute(attribute.name);
      }
    }

    const textAlign = getTextAlign(element.getAttribute('style'));
    if (textAlign) {
      element.setAttribute('style', `text-align: ${textAlign};`);
    } else {
      element.removeAttribute('style');
    }

    if (element.tagName === 'SPAN' && !element.attributes.length) {
      unwrapElement(element);
    }
  }
}

function getTextAlign(style: string | null) {
  if (!style) {
    return null;
  }

  const match = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
  const value = match?.[1]?.toLowerCase() ?? null;
  return value && alignmentValues.has(value) ? value : null;
}

function unwrapElement(element: Element) {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}
