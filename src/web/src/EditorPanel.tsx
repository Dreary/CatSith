import { Editor, Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "./AppState";
import { isImage, isXml } from "@/web/lib/utils";

export const EditorPanel = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
  const {
    openedTabs,
    currentSelectedTab,
    setOpenedTabs,
    setCurrentSelectedTab,
    addOpenFile,
    removeOpenFile,
  } = useAppState();

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!openedTabs.find((tab) => tab.index === currentSelectedTab?.index)) {
      setCurrentSelectedTab(openedTabs[0]);
    }
  }, [openedTabs, currentSelectedTab]);

  const handleEditorChange = useCallback(
    (value: string, event: editor.IModelContentChangedEvent) => {
      currentSelectedTab.changed = true;
      currentSelectedTab.value = value;
    },
    [currentSelectedTab],
  );

  return (
    <div className="relative h-full w-full">
      {/* vs-code styled tab bar with the name, onClick to switch tabs and a close button. Middle click to close */}
      {openedTabs.length > 0 && (
        <div className="flex flex-row flex-wrap bg-gray-800 text-white">
          {openedTabs.map((tab, index) => {
            const fileName = tab.name.split("/").pop();
            const isSelected = tab.index === currentSelectedTab?.index;
            return (
              <div
                key={tab.index}
                className={`flex cursor-pointer items-center gap-1 px-2 py-1 ${isSelected ? "border-t border-blue-400 bg-gray-700" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (isSelected) {
                    return;
                  }
                  setCurrentSelectedTab(tab);
                }}
                onAuxClick={(e) => {
                  if (e.button !== 1) {
                    return;
                  }
                  e.preventDefault();
                  removeOpenFile(index);
                }}
              >
                <div className="flex-grow text-sm">{fileName}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOpenFile(index);
                  }}
                >
                  &times;
                </button>
                {tab.changed && <div className="text-xs text-red-500">*</div>}
              </div>
            );
          })}
        </div>
      )}
      {!!currentSelectedTab && isXml(currentSelectedTab.name) && (
        <Editor
          className={`h-full w-full`}
          theme="vs-dark"
          path={currentSelectedTab?.name}
          defaultLanguage="xml"
          defaultValue={currentSelectedTab?.value as string}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      )}
      {!!currentSelectedTab && isImage(currentSelectedTab.name) && (
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={`data:image/png;base64,${btoa(String.fromCharCode(...(currentSelectedTab.value as Buffer)))}`}
            alt={currentSelectedTab.name}
          />
        </div>
      )}
      {!currentSelectedTab && (
        <div className="absolute left-0 right-0 top-0 flex h-full items-center justify-center text-gray-500">
          Select a file to view its content
        </div>
      )}
    </div>
  );
};
