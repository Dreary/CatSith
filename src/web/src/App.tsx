import { Input } from "@/web/components/ui/input";
import { Search } from "lucide-react";
import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";
import { useCallback, useEffect, useState } from "react";
import { NodeApi, Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { Monaco } from "@monaco-editor/react";

// #region Monaco Editor
// @ts-expect-error
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// @ts-expect-error
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
// @ts-expect-error
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// @ts-expect-error
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// @ts-expect-error
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/web/components/ui/menubar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/web/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { BinaryBuffer } from "maple2-file/dist/crypto/common/BinaryBuffer";
import { editor } from "monaco-editor";
import { EditorPanel } from "./EditorPanel";
import { AppProvider, useAppState } from "./AppState";
import XmlIcon from "@/web/assets/Icons/xml";
import ImageIcon from "@/web/assets/Icons/image";
import { isXml } from "@/web/lib/utils";

self.MonacoEnvironment = {
  getWorker(_, label: string) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};
// #endregion

interface TreeDataItem {
  id: string;
  name: string;
  children?: TreeDataItem[];
}

function App() {
  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  const [packFileEntries, setPackFileEntries] = useState<PackFileEntry[]>([]);
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const { addOpenFile, closeAllTabs, currentSelectedTab } = useAppState();

  useEffect(() => {
    (async () => {
      const version = await window.electron.getAppVersion();
      setAppVersion(version);
    })();
  }, []);

  const handleNodeSelect = useCallback(
    async (node: NodeApi<TreeDataItem>[]) => {
      if (node?.[0]?.children) {
        return;
      }
      const id = node?.[0]?.id;
      if (!id) {
        return;
      }
      const fileEntry = packFileEntries[+id.split("-")[0] - 1];
      if (!fileEntry) {
        console.error("File entry not found");
        return;
      }
      if (isXml(fileEntry.name)) {
        const xml = await window.electron.getXmlPackFileEntry(fileEntry.index);

        addOpenFile({
          index: fileEntry.index,
          name: fileEntry.name,
          value: xml,
          changed: false,
        });
        return;
      }

      const data = await window.electron.getDataPackFileEntry(fileEntry.index);

      addOpenFile({
        index: fileEntry.index,
        name: fileEntry.name,
        value: data,
        changed: false,
      });
    },
    [packFileEntries],
  );

  const onLoadFile = async () => {
    const result = await window.electron.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "M2D", extensions: ["m2d"] }],
    });

    const packFileEntries = await window.electron.readerM2d(
      result.filePaths[0],
    );
    closeAllTabs();
    setPackFileEntries([]);
    setTreeData([]);
    setPackFileEntries(packFileEntries);

    // files have folders names as keys for example "achieve/achieve.xml" we need to convert it to a tree structure
    const treeData: TreeDataItem[] = [];
    packFileEntries.forEach((entry) => {
      const path = entry.name.split("/");
      let parent = treeData;
      path.forEach((folderName, index) => {
        const isFile = index === path.length - 1 && folderName.includes(".");
        const existingFolder = parent.find(
          (folder) => folder.name === folderName,
        );
        if (existingFolder) {
          parent = existingFolder.children!;
          return;
        }

        const newFolder: TreeDataItem = {
          id: `${entry.index}-${folderName}`,
          name: folderName,
          children: isFile ? undefined : ([] as TreeDataItem[]),
        };
        parent.push(newFolder);
        if (!isFile) {
          parent = newFolder.children!;
        }
      });
    });
    treeData.sort((a, b) => a.name.localeCompare(b.name));

    setTreeData(treeData);
  };

  function getNodeIcon(node: NodeApi<TreeDataItem>) {
    if (node.isLeaf) {
      // get icons from here: https://github.com/material-extensions/vscode-material-icon-theme/tree/main/icons
      switch (node.data.name.split(".").pop()) {
        case "xml":
        case "xblock":
          return <XmlIcon className="h-4 w-4" />;
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "bmp":
        case "webp":
        case "svg":
        case "ico":
        case "dds":
          return <ImageIcon className="h-4 w-4" />;
        default:
          return "🍁";
      }
    }

    if (node.isClosed) {
      return "🗀";
    } else {
      return "🗁";
    }
  }

  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div className="relative h-screen">
      <div className="h-full w-full text-white">
        <Menubar>
          <MenubarMenu>
            <a
              href="https://github.com/AngeloTadeucci/CatSith"
              target="_blank"
              className="mx-2"
              draggable="false"
            >
              CatSith
            </a>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onLoadFile}>Load m2d</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => window.electron.exitApp()}>
                Exit
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>About</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>v{appVersion}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <div
            className="h-full w-full flex-grow"
            style={{
              //@ts-expect-error
              WebkitAppRegion: "drag",
            }}
          />
        </Menubar>

        <ResizablePanelGroup
          direction="horizontal"
          style={{
            height: "calc(100% - 40px)", // 40px is the height of the menubar, but why is it hardcoded? i dont understand
          }}
        >
          <ResizablePanel minSize={25} maxSize={70}>
            {treeData.length > 0 ? (
              <div className="ml-2 flex h-full flex-col pt-2">
                <div className="pb-2 pr-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-8 pr-4"
                    />
                  </div>
                </div>
                <div
                  ref={ref}
                  className="flex-grow"
                  style={{
                    minBlockSize: 0,
                  }}
                >
                  <Tree
                    data={treeData}
                    onSelect={handleNodeSelect}
                    openByDefault={false}
                    width={width}
                    height={height}
                    disableDrag
                    disableDrop
                    searchTerm={searchQuery}
                    searchMatch={(node: NodeApi<TreeDataItem>, term: string) =>
                      node.data.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    }
                  >
                    {({ node, style }) => {
                      const nodeIsSelected =
                        currentSelectedTab?.name ===
                          packFileEntries[+node.data.id.split("-")[0] - 1]
                            .name && node.isLeaf;

                      return (
                        <div
                          style={style}
                          className={`flex cursor-pointer select-none items-center ${
                            nodeIsSelected
                              ? "bg-gray-800"
                              : "hover:bg-gray-800 hover:bg-opacity-40"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            node.toggle();
                            node.select();
                          }}
                        >
                          <div className="flex-shrink-0">
                            {getNodeIcon(node)}
                          </div>
                          <span className="ml-1 overflow-hidden overflow-ellipsis whitespace-nowrap">
                            {node.data.name}
                          </span>
                        </div>
                      );
                    }}
                  </Tree>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                No M2d loaded
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <EditorPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;
