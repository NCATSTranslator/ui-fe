import { ReactNode, useEffect } from "react";
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { getUserSave } from "@/features/UserAuth/utils/userApi";
import { CLEAR_EDITOR_COMMAND, LexicalEditor, SerializedEditorState, SerializedLexicalNode } from "lexical";

interface OnChangePluginProps {
  onChange: (editorStateJSON: SerializedEditorState<SerializedLexicalNode>) => void;
  bookmarkID: string | null;
  shouldClearEditor?: boolean;
  onClearEditorComplete?: () => void;
}

const OnChangePlugin = ({ onChange, bookmarkID, shouldClearEditor, onClearEditorComplete }: OnChangePluginProps): ReactNode | null => {
  const [editor] = useLexicalComposerContext();

  const clearEditor = (editor: LexicalEditor) => {
    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
  }

  useEffect(() => {
    const getNotesFromBookmark = async (bookmarkID: string | null) => {
      let shouldClearEditor = false;
      if(bookmarkID) {
        let save = await getUserSave(bookmarkID, ()=>{ return false; });
        let initialNotes: string | false = false;

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

  }, [bookmarkID, editor])

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
      onClearEditorComplete?.();
    }
  }, [shouldClearEditor, onClearEditorComplete, editor]);

  return null;
}

export default OnChangePlugin; 