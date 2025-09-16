import { Dispatch, ReactNode, SetStateAction, useMemo } from "react";
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
import OnChangePlugin from "./plugins/OnChangePlugin";
import { getUserSave, updateUserSave, Save } from "@/features/UserAuth/utils/userApi";
import { emptyEditor } from "@/features/UserAuth/utils/userDefaults";
import { debounce } from "lodash";

interface TextEditorProps {
  bookmarkID: string | null;
  setSaveItem: Dispatch<SetStateAction<Save | null>>;
  handleSave: () => void;
  shouldClearEditor?: boolean;
  onClearEditorComplete?: () => void;
}

const Placeholder = (): ReactNode => {
  return <div className="editor-placeholder">...</div>;
}

const TextEditor = ({ 
  bookmarkID, 
  setSaveItem,
  handleSave, 
  shouldClearEditor, 
  onClearEditorComplete 
}: TextEditorProps): ReactNode => {

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

  const updateNote = useMemo(() => debounce(async (editorStateJSON: SerializedEditorState<SerializedLexicalNode>, bookmarkID: string | null): Promise<void> => {
    let newNotes = JSON.stringify(editorStateJSON);

    if(newNotes === emptyEditor)
      return;

    if(bookmarkID) {
      console.log("update bookmark of id:", bookmarkID);
      // update bookmark of given ID
      let newSave: Save = await getUserSave(bookmarkID);
      if(newSave.notes === newNotes)
        return;
        
      newSave.notes = newNotes;
      updateUserSave(bookmarkID, newSave);
      setSaveItem(newSave);
      handleSave();
    }

  }, 750), [handleSave]);

  const onChange = (editorStateJSON: SerializedEditorState<SerializedLexicalNode>): void => {
    if(bookmarkID === null) 
      return;
    
    updateNote(editorStateJSON, bookmarkID);
  }

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
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
            shouldClearEditor={shouldClearEditor} 
            onClearEditorComplete={onClearEditorComplete}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}

export default TextEditor; 