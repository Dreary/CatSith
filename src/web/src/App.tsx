import { TreeDataItem, TreeView } from "@/web/components/tree-view";
import { Button, buttonVariants } from "@/web/components/ui/button";
import { Input } from "@/web/components/ui/input";
import { Editor, loader } from "@monaco-editor/react";
import { Search } from "lucide-react";
import { PackFileEntry } from "maple2-file/dist/crypto/common/PackFileEntry";
import { useCallback, useEffect, useState } from "react";
import { NodeApi, Tree } from "react-arborist";

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

function App() {
  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  const [packFileEntries, setPackFileEntries] = useState<PackFileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<PackFileEntry | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>();
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    (async () => {
      const version = await window.electron.getAppVersion();
      setAppVersion(version);
    })();
  }, []);

  const handleNodeSelect = useCallback(
    async (node: NodeApi<TreeDataItem>[]) => {
      console.log("🚀 ~ handleNodeSelect ~ node:", node);
      const id = node?.[0]?.id;
      if (!id) {
        return;
      }
      console.log("🚀 ~ Number(node[0].id):", id.split("-")[0]);
      const fileEntry = packFileEntries[+id.split("-")[0] - 1];
      console.log("🚀 ~ fileEntry:", fileEntry);
      if (!fileEntry) {
        console.error("File entry not found");
        return;
      }
      const xml = await window.electron.getXmlPackFileEntry(fileEntry.index);

      console.log("🚀 ~ xml:", xml);

      setSelectedFileContent(xml);
      setSelectedFile(fileEntry);
    },
    [packFileEntries],
  );

  return (
    <>
      <div className="relative h-screen w-screen">
        <div className="flex h-full w-full flex-col gap-2 text-white">
          <h1 className="z-10 flex w-full justify-between bg-black/50 p-4 text-[1rem] font-bold drop-shadow-md">
            <a href="https://github.com/AngeloTadeucci/CatSith" target="_blank">
              CatSith
            </a>
            v{appVersion}
          </h1>
          <Button
            onClick={async () => {
              const result = await window.electron.showOpenDialog({
                properties: ["openFile"],
                filters: [{ name: "M2D", extensions: ["m2d"] }],
              });

              const packFileEntries = await window.electron.readerM2d(
                result.filePaths[0],
              );
              console.log("🚀 ~ onClick={ ~ packFileEntries:", packFileEntries);
              setPackFileEntries([]);
              setTreeData([]);
              setPackFileEntries(packFileEntries);

              // files have folders names as keys for example "achieve/achieve.xml" we need to convert it to a tree structure
              const treeData: TreeDataItem[] = [];
              packFileEntries.forEach((entry) => {
                const path = entry.name.split("/");
                let parent = treeData;
                path.forEach((folderName, index) => {
                  const isFile =
                    index === path.length - 1 && folderName.includes(".");
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
            }}
          >
            Load m2d
          </Button>

          <div className="flex h-full flex-col">
            <div className="border-b p-4">
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
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 overflow-auto border-r">
                {treeData.length > 0 ? (
                  <Tree
                    data={treeData}
                    onSelect={handleNodeSelect}
                    searchTerm={searchQuery}
                    searchMatch={(node: NodeApi<TreeDataItem>, term: string) =>
                      node.data.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No M2d loaded
                  </div>
                )}
              </div>
              <div className="h-full w-2/3 overflow-auto p-4">
                {selectedFile != null ? (
                  false ? (
                    <div className="relative h-full w-full">
                      <img
                        // src={`/api/images/${selectedFile.id}`}
                        alt={selectedFile.name}
                      />
                    </div>
                  ) : (
                    <Editor
                      className="h-full w-full"
                      defaultLanguage="xml"
                      theme="vs-dark"
                      value={selectedFileContent}
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Select a file to view its content
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
