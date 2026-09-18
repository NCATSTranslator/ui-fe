import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ChangeEvent, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  LexicalEditor,
  LexicalNode,
  ElementFormatType
} from "lexical";
import {
  $wrapNodes
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages
} from "@lexical/code";

const LowPriority = 1;

const supportedBlockTypes = new Set([
  "paragraph",
  "quote",
  "code",
  "h1",
  "h2",
  "ul",
  "ol"
]);

const blockTypeToBlockName: Record<string, string> = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List"
};

function Divider(): ReactNode {
  return <div className="divider" />;
}

interface SelectProps {
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  className: string;
  options: string[];
  value: string;
}

function Select({ onChange, className, options, value }: SelectProps): ReactNode {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

interface BlockOptionsDropdownListProps {
  editor: LexicalEditor;
  blockType: string;
  toolbarRef: RefObject<HTMLDivElement>;
  setShowBlockOptionsDropDown: (show: boolean) => void;
}

function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown
}: BlockOptionsDropdownListProps): ReactNode {
  const dropDownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${left}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event: MouseEvent) => {
        const target = event.target as Node;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = (): void => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = (): void => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = (): void => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = (): void => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = (): void => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = (): void => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = (): void => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div className="dropdown" ref={dropDownRef}>
      <button className="item" onClick={formatParagraph}>
        <span className="icon paragraph" />
        <span className="text">Normal</span>
        {blockType === "paragraph" && <span className="active" />}
      </button>
      <button className="item" onClick={formatLargeHeading}>
        <span className="icon large-heading" />
        <span className="text">Large Heading</span>
        {blockType === "h1" && <span className="active" />}
      </button>
      <button className="item" onClick={formatSmallHeading}>
        <span className="icon small-heading" />
        <span className="text">Small Heading</span>
        {blockType === "h2" && <span className="active" />}
      </button>
      <button className="item" onClick={formatBulletList}>
        <span className="icon bullet-list" />
        <span className="text">Bullet List</span>
        {blockType === "ul" && <span className="active" />}
      </button>
      <button className="item" onClick={formatNumberedList}>
        <span className="icon numbered-list" />
        <span className="text">Numbered List</span>
        {blockType === "ol" && <span className="active" />}
      </button>
      <button className="item" onClick={formatQuote}>
        <span className="icon quote" />
        <span className="text">Quote</span>
        {blockType === "quote" && <span className="active" />}
      </button>
      <button className="item" onClick={formatCode}>
        <span className="icon code" />
        <span className="text">Code Block</span>
        {blockType === "code" && <span className="active" />}
      </button>
    </div>
  );
}

interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
}

const INITIAL_TEXT_FORMAT: TextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
};

function getBlockTypeInfo(
  anchorNode: LexicalNode,
  element: LexicalNode
): { blockType: string; codeLanguage: string } {
  if ($isListNode(element)) {
    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
    const type = parentList ? parentList.getTag() : element.getTag();
    return { blockType: type, codeLanguage: "" };
  }
  const blockType = $isHeadingNode(element) ? element.getTag() : element.getType();
  const codeLanguage = $isCodeNode(element)
    ? (element.getLanguage() || getDefaultCodeLanguage())
    : "";
  return { blockType, codeLanguage };
}

const TEXT_FORMAT_BUTTONS: { format: keyof TextFormatState; label: string }[] = [
  { format: "bold", label: "Format Bold" },
  { format: "italic", label: "Format Italics" },
  { format: "underline", label: "Format Underline" },
  { format: "strikethrough", label: "Format Strikethrough" },
  { format: "code", label: "Insert Code" },
];

const ALIGNMENT_BUTTONS: { format: ElementFormatType; label: string; icon: string; spaced: boolean }[] = [
  { format: "left", label: "Left Align", icon: "left-align", spaced: true },
  { format: "center", label: "Center Align", icon: "center-align", spaced: true },
  { format: "right", label: "Right Align", icon: "right-align", spaced: true },
  { format: "justify", label: "Justify Align", icon: "justify-align", spaced: false },
];

export default function ToolbarPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("");
  const [textFormat, setTextFormat] = useState<TextFormatState>(INITIAL_TEXT_FORMAT);

  const updateToolbar = useCallback((): void => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        const blockInfo = getBlockTypeInfo(anchorNode, element);
        setBlockType(blockInfo.blockType);
        if (blockInfo.codeLanguage) {
          setCodeLanguage(blockInfo.codeLanguage);
        }
      }
      setTextFormat({
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        strikethrough: selection.hasFormat("strikethrough"),
        code: selection.hasFormat("code"),
      });
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload: boolean) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload: boolean) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguges = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(e.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Redo"
      >
        <i className="format redo" />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType) && (
        <>
          <button
            className="toolbar-item block-controls"
            onClick={() =>
              setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
            }
            aria-label="Formatting Options"
          >
            <span className={"icon block-type " + blockType} />
            <span className="text">{blockTypeToBlockName[blockType]}</span>
            <i className="chevron-down" />
            {showBlockOptionsDropDown && toolbarRef.current !== null &&
              
                <BlockOptionsDropdownList
                  editor={editor}
                  blockType={blockType}
                  toolbarRef={toolbarRef as RefObject<HTMLDivElement>}
                  setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
                />
              }
          </button>
          <Divider />
        </>
      )}
      {blockType === "code" ? (
        <>
          <Select
            className="toolbar-item code-language"
            onChange={onCodeLanguageSelect}
            options={codeLanguges}
            value={codeLanguage}
          />
          <i className="chevron-down inside" />
        </>
      ) : (
        <>
          {TEXT_FORMAT_BUTTONS.map(({ format, label }) => (
            <button
              key={format}
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
              className={"toolbar-item spaced " + (textFormat[format] ? "active" : "")}
              aria-label={label}
            >
              <i className={`format ${format}`} />
            </button>
          ))}
          <Divider />
          {ALIGNMENT_BUTTONS.map(({ format, label, icon, spaced }) => (
            <button
              key={format}
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)}
              className={"toolbar-item" + (spaced ? " spaced" : "")}
              aria-label={label}
            >
              <i className={`format ${icon}`} />
            </button>
          ))}
        </>
      )}
    </div>
  );
} 