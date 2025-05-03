"use client";

import {
  MDXEditor,
  MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkDialogPlugin, // Ajout du plugin de dialogue pour les liens
  linkPlugin,
  imagePlugin,
  tablePlugin,
  markdownShortcutPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  ListsToggle,
  InsertImage,
  CodeToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { FC } from "react";
import { cn } from "@/lib/utils";

interface EditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = ({ markdown, onChange, editorRef }) => {
  return (
    <MDXEditor
      onChange={(markdown) => onChange && onChange(markdown)}
      ref={editorRef}
      markdown={markdown}
      contentEditableClassName={cn(
        "prose prose-sm max-w-full focus:outline-none min-h-[150px] p-3",
        "text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
        "text-foreground"
      )}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(), // Plugin de base pour les liens
        linkDialogPlugin(), // Plugin de dialogue pour l'interface utilisateur des liens
        imagePlugin(),
        tablePlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <ListsToggle />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <CodeToggle />
            </>
          ),
        }),
      ]}
    />
  );
};

export default Editor;
