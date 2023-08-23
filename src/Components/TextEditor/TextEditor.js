import { useMemo } from "react";
import { Theme } from "./Theme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
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
import _ from "lodash";

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CustomAutoLinkPlugin from "./plugins/CustomAutoLinkPlugin";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { getUserSave, updateUserSave, emptyEditor } from "../../Utilities/userApi";

const Placeholder = () => {
  return <div className="editor-placeholder">...</div>;
}

const TextEditor = ({bookmarkID, handleSave, shouldClearEditor, onClearEditorComplete}) => {

  const editorConfig = {
    theme: Theme,
    onError(error) {
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

  const updateNote = useMemo(() => _.debounce(async (editorStateJSON, bookmarkID) => {
    let newNotes = JSON.stringify(editorStateJSON);

    if(newNotes === emptyEditor)
      return;

    if(bookmarkID) {
      console.log("update bookmark of id:", bookmarkID);
      // update bookmark of given ID
      let newSave = await getUserSave(bookmarkID);
      if(newSave.notes === newNotes)
        return;
        
      newSave.notes = newNotes;
      console.log(newSave);
      updateUserSave(bookmarkID, newSave);
      handleSave();
    }

  }, 750), []);

  const onChange = (editorStateJSON) => {
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