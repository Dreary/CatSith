import { Input } from "@/web/components/ui/input";
import { Search } from "lucide-react";
import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";
import { useCallback, useEffect, useRef, useState } from "react";
import { NodeApi, Tree, TreeApi } from "react-arborist";
import useResizeObserver from "use-resize-observer";

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
import ImageIcon from "@/web/assets/Icons/image";
import XmlIcon from "@/web/assets/Icons/xml";
import ConfirmationDialog from "@/web/components/confirmation-dialog";
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
import { useToast } from "@/web/hooks/use-toast";
import { isImage, isXml } from "@/web/lib/utils";
import { useAppState } from "./AppState";
import { EditorPanel } from "./EditorPanel";

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
  const { toast } = useToast();

  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  const [packFileEntries, setPackFileEntries] = useState<PackFileEntry[]>([]);
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const { addOpenFile, closeAllTabs, currentSelectedTab, setOpenedTabs } =
    useAppState();

  const [confirmDialogAction, setConfirmDialogAction] =
    useState<() => void | null>(null);

  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  const treeRef = useRef<TreeApi<TreeDataItem>>();

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

  async function loadFile() {
    const loadFile = await window.electron.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "M2D", extensions: ["m2d"] }],
    });

    if (loadFile.canceled) {
      return;
    }

    const packFiles = await window.electron.openM2d(loadFile.filePaths[0]);

    // reset state
    closeAllTabs();
    setPackFileEntries([]);
    setTreeData([]);
    treeRef.current?.closeAll();

    setPackFileEntries(packFiles);

    // files have folders names as keys for example "achieve/achieve.xml" we need to convert it to a tree structure
    const treeData: TreeDataItem[] = [];
    packFiles.forEach((entry) => {
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
  }

  const onLoadFile = async () => {
    const hasChangedFiles = await window.electron.hasChangedFiles();
    if (hasChangedFiles) {
      setConfirmDialogAction(() => loadFile);
      return;
    }

    await loadFile();
  };

  const onSaveFile = async () => {
    const hasChangedFiles = await window.electron.hasChangedFiles();
    if (!hasChangedFiles) {
      toast({
        title: "No changes to save",
        duration: 2000,
      });
      return;
    }

    const savePath = await window.electron.showSaveDialog({
      filters: [{ name: "M2D", extensions: ["m2d"] }],
    });

    if (savePath.canceled) {
      return;
    }

    const filePath = savePath.filePath;
    const result = await window.electron.saveM2d(filePath);
    if (!result[0]) {
      toast({
        title: "Error saving file",
        description: result[1],
        duration: 5000,
      });
      return;
    }

    toast({
      title: `Saved successfully in ${result[1]}`,
      duration: 2000,
    });
  };

  const onSaveTab = async () => {
    if (!currentSelectedTab) {
      console.error("No tab selected");
      return;
    }

    if (!currentSelectedTab.changed) {
      console.error("No changes to save");
      return;
    }

    if (isXml(currentSelectedTab.name)) {
      const result = await window.electron.saveXmlPackFileEntry(
        currentSelectedTab.index,
        currentSelectedTab.value as string,
      );

      if (result[0]) {
        setOpenedTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.index === currentSelectedTab.index
              ? { ...tab, changed: false }
              : tab,
          ),
        );

        toast({
          title: `${currentSelectedTab.name.split("/").pop()} saved`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Error saving file",
          description: result[1],
          duration: 5000,
        });
      }

      return;
    }

    if (isImage(currentSelectedTab.name)) {
      const result = await window.electron.saveDataPackFileEntry(
        currentSelectedTab.index,
        currentSelectedTab.value as Buffer,
      );

      if (result[0]) {
        setOpenedTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.index === currentSelectedTab.index
              ? { ...tab, changed: false }
              : tab,
          ),
        );
        toast({
          title: "File saved",
          duration: 2000,
        });
      } else {
        toast({
          title: "Error saving file",
          description: result[1],
          duration: 5000,
        });
      }

      return;
    }
  };

  const onExit = async () => {
    const changedFiles = await window.electron.hasChangedFiles();
    if (changedFiles) {
      return setConfirmDialogAction(() => window.electron.exitApp);
    }

    return window.electron.exitApp();
  };

  useEffect(() => {
    window.addEventListener("keydown", onSaveTab);
    return () => {
      window.removeEventListener("keydown", onSaveTab);
    };
  }, [onSaveTab]);

  function getNodeIcon(node: NodeApi<TreeDataItem>) {
    if (node.isLeaf) {
      // get icons from here: https://github.com/material-extensions/vscode-material-icon-theme/tree/main/icons
      switch (node.data.name.split(".").pop()) {
        case "xml":
        case "xblock":
        case "flat":
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

  return (
    <div className="relative h-screen">
      <ConfirmationDialog
        isConfirmDialogOpen={confirmDialogAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogAction(null);
          }
        }}
        onCancel={() => setConfirmDialogAction(null)}
        onConfirm={confirmDialogAction}
      />
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
              <MenubarItem onClick={onSaveFile}>Save m2d</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onSaveTab}>
                Save File <MenubarShortcut>Ctrl + S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onExit}>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          {/* <MenubarMenu>
            <MenubarTrigger>Editor</MenubarTrigger>
            <MenubarSub>
              <MenubarSubTrigger>

              </MenubarSubTrigger>
            </MenubarSub>
          </MenubarMenu> */}
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
                    ref={treeRef}
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
