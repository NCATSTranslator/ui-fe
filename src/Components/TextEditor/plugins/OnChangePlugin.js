import { useEffect, useRef } from "react";
import { $getRoot } from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { getUserSave } from "../../../Utilities/userApi";
import { CLEAR_EDITOR_COMMAND } from "lexical";

const OnChangePlugin = ({ onChange, bookmarkID, shouldClearEditor, onClearEditorComplete }) => {
  // Access the editor through the LexicalComposerContext
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);

  const clearEditor = (editor) => {
    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
  }

  useEffect(() => {
    const getNotesFromBookmark = async (bookmarkID) => {
      let shouldClearEditor = false;
      if(bookmarkID) {
        let save = await getUserSave(bookmarkID, ()=>{ return false; });
        let initialNotes = false;

        if(!save){
          shouldClearEditor = true;
        } else {
          if(save.notes.length > 0)
            initialNotes = save.notes;
  
          if(initialNotes !== false) {
            const editorStateJSON = initialNotes;
            const initialEditorState = editor.parseEditorState(editorStateJSON);
            editor.setEditorState(initialEditorState)
          } else {
            shouldClearEditor = true;
          }
        }
      } else {
        shouldClearEditor = true;
      }

      if(shouldClearEditor) {
        clearEditor(editor);
      }
    }
    
    getNotesFromBookmark(bookmarkID);

  }, [isFirstRender.current, bookmarkID, editor])

  // register listener for onChange
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      let editorStateObject = editor.getEditorState();
      onChange(editorStateObject.toJSON());
    });
  }, [editor, onChange]);

  useEffect(() => {
    if (shouldClearEditor) {
      clearEditor(editor);
      onClearEditorComplete();
    }
  }, [shouldClearEditor, onClearEditorComplete, editor]);

}

export default OnChangePlugin;