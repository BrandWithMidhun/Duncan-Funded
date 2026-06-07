'use client';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
  InsertCodeBlock,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './markdown-editor.css';

interface Props {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

/**
 * The actual MDXEditor instance. Configured with:
 *
 *   - headings (H1-H6 via the block-type dropdown)
 *   - bullet + numbered lists, including toggling
 *   - blockquotes
 *   - thematic breaks (---)
 *   - markdown keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
 *   - link dialog (Cmd/Ctrl+K to insert/edit a link)
 *   - image insertion by URL — file upload deferred until R2 is ready;
 *     for now `imageUploadHandler` is unset so the dialog only takes a URL
 *   - GitHub-style tables
 *   - fenced code blocks with syntax highlighting (codemirror)
 *
 * Storage stays as markdown — the same format the blog already renders
 * via react-markdown. Zero changes to the public renderer.
 */
export default function MarkdownEditorInner({ value, onChange, placeholder }: Props) {
  return (
    <div className="duncan-mdx-editor border border-gold/25 rounded-sm overflow-hidden bg-pine/60">
      <MDXEditor
        markdown={value || ''}
        onChange={onChange}
        placeholder={placeholder || 'Write your article…'}
        className="dark-theme"
        contentEditableClassName="prose prose-invert max-w-none min-h-[400px] px-5 py-4 font-body text-[15px] leading-relaxed text-wool focus:outline-none"
        plugins={[
          // Content plugins — order doesn't matter for these
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          // Image insertion by URL only (no upload yet — R2 not wired)
          imagePlugin(),
          tablePlugin(),
          // Code blocks with syntax highlighting
          codeBlockPlugin({ defaultCodeBlockLanguage: 'ts' }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              ts: 'TypeScript',
              js: 'JavaScript',
              tsx: 'TSX',
              jsx: 'JSX',
              json: 'JSON',
              css: 'CSS',
              html: 'HTML',
              md: 'Markdown',
              bash: 'Bash',
              sql: 'SQL',
              py: 'Python',
            },
          }),
          // Toolbar must come LAST — it references handlers exported by
          // the other plugins above
          toolbarPlugin({
            toolbarClassName: 'duncan-mdx-toolbar',
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
