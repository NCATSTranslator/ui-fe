import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { Theme } from "./Theme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { SerializedEditorState, SerializedLexicalNode } from "lexical";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CustomAutoLinkPlugin from "./plugins/CustomAutoLinkPlugin";
import EditorRefPlugin from "./plugins/EditorRefPlugin";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { getUserSave, updateUserSave, Save } from "@/features/UserAuth/utils/userApi";
import { emptyEditor } from "@/features/UserAuth/utils/userDefaults";
import { debounce } from "lodash";

interface TextEditorProps {
  bookmarkID: string | null;
  isOpen?: boolean;
  handleSave: () => void;
  shouldClearEditor?: boolean;
  onClearEditorComplete?: () => void;
  onNoteSaved?: (save: Save) => void;
  saveNowRef?: RefObject<(() => Promise<void>) | null>;
}

const Placeholder = (): ReactNode => {
  return <div className="editor-placeholder">...</div>;
}

const TextEditor = ({
  bookmarkID,
  isOpen,
  handleSave,
  shouldClearEditor,
  onClearEditorComplete,
  onNoteSaved,
  saveNowRef,
}: TextEditorProps): ReactNode => {
  const editorRef = useRef<import("lexical").LexicalEditor | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const editorConfig = {
    namespace: 'TextEditor',
    theme: Theme,
    onError(error: Error): void {
      throw error;
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode
    ]
  };

  const applyNoteUpdate = useCallback(async (
    editorStateJSON: SerializedEditorState<SerializedLexicalNode>,
    bid: string | null
  ): Promise<void> => {
    const newNotes = JSON.stringify(editorStateJSON);
    if (newNotes === emptyEditor || !bid) return;

    const newSave: Save = await getUserSave(bid);
    if (!isMounted.current) return;
    if (newSave.notes === newNotes) return;

    newSave.notes = newNotes;
    updateUserSave(bid, newSave);
    handleSave();
    onNoteSaved?.(newSave);
  }, [handleSave, onNoteSaved]);

  const updateNote = useMemo(
    () => debounce(applyNoteUpdate, 750),
    [applyNoteUpdate]
  );

  useEffect(() => {
    if (!saveNowRef) return;
    saveNowRef.current = async () => {
      updateNote.cancel();
      const editor = editorRef.current;
      if (!editor || !bookmarkID) return;
      await applyNoteUpdate(editor.getEditorState().toJSON(), bookmarkID);
    };
    return () => {
      saveNowRef.current = null;
    };
  }, [saveNowRef, bookmarkID, applyNoteUpdate, updateNote]);

  useEffect(() => {
    return () => {
      updateNote.cancel();
    };
  }, [updateNote]);

  const onChange = (editorStateJSON: SerializedEditorState<SerializedLexicalNode>): void => {
    if (bookmarkID === null) return;
    updateNote(editorStateJSON, bookmarkID);
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <EditorRefPlugin editorRef={editorRef} />
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ClearEditorPlugin  />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <LinkPlugin />
          <CustomAutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin
            onChange={onChange}
            bookmarkID={bookmarkID}
            isOpen={isOpen}
            shouldClearEditor={shouldClearEditor}
            onClearEditorComplete={onClearEditorComplete}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}

export default TextEditor; 