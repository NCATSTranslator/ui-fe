import { RefObject, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";

interface EditorRefPluginProps {
  editorRef: RefObject<LexicalEditor | null>;
}

/**
 * Plugin that exposes the Lexical editor instance via a ref
 * so the parent can call getEditorState() for immediate save (e.g. on modal close).
 */
const EditorRefPlugin = ({ editorRef }: EditorRefPluginProps): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
};

export default EditorRefPlugin;
