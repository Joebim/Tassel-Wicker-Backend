declare module "react-draft-wysiwyg" {
  import { ComponentType } from "react";
  import { EditorState } from "draft-js";

  export interface EditorProps {
    editorState: EditorState;
    onEditorStateChange?: (editorState: EditorState) => void;
    placeholder?: string;
    readOnly?: boolean;
    toolbar?: any;
    editorClassName?: string;
    wrapperClassName?: string;
    toolbarClassName?: string;
    [key: string]: any;
  }

  export const Editor: ComponentType<EditorProps>;
}



