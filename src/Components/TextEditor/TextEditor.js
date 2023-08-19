import { useState, useEffect, useRef, useMemo } from "react";
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
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CustomAutoLinkPlugin from "./plugins/CustomAutoLinkPlugin";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { getUserSave, updateUserSave } from "../../Utilities/userApi";

const Placeholder = () => {
  return <div className="editor-placeholder">...</div>;
}

const TextEditor = ({bookmarkID}) => {

  const editorConfig = {
    // editorState: initialEditorState,
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
    console.log("Debounced editor state push", JSON.stringify(editorStateJSON));
    console.log(bookmarkID);
    let newNotes = JSON.stringify(editorStateJSON);
    if(newNotes.length <= 0)
      return;

    if(!bookmarkID) {
      // create new bookmark with notes
    } else {
      // update bookmark of given ID
      let newSave = await getUserSave(bookmarkID);
      if(newSave.notes === newNotes)
        return;
        
      console.log(newNotes);
      console.log(newSave);
      newSave.notes = newNotes;
      updateUserSave(bookmarkID, newSave);
    }
  }, 1000), []);

  const onChange = (editorStateJSON) => {
    if(bookmarkID === null) {
      console.warn("no bookmark ID supplied, unable to save");
      return;
    }
    console.log("change", editorStateJSON);
    updateNote(editorStateJSON, bookmarkID);
    // const editorStateJSON = editorState.toJSON();
    // sanitize here, or wait til debounced ?

    // setEditorState(JSON.stringify(editorStateJSON));
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
          <ClearEditorPlugin />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <LinkPlugin />
          <CustomAutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={onChange} bookmarkID={bookmarkID}/>
        </div>
      </div>
    </LexicalComposer>
  );
}

export default TextEditor;