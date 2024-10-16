import { editor } from "monaco-editor";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface FileTab {
  index: number;
  name: string;
  value: string;
  changed: boolean;
}

export interface EditorSettings
  extends editor.IStandaloneEditorConstructionOptions {}

export interface AppStateType {
  openedTabs: FileTab[];
  currentSelectedTab: FileTab;
  editorSettings: EditorSettings;
  setOpenedTabs: React.Dispatch<React.SetStateAction<FileTab[]>>;
  setCurrentSelectedTab: React.Dispatch<React.SetStateAction<FileTab>>;
  addOpenFile: (file: FileTab) => void;
  removeOpenFile: (index: number) => void;
  closeAllTabs: () => void;
  setEditorSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
}

// Create the context
const AppState = createContext<AppStateType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [openedTabs, setOpenedTabs] = useState<FileTab[]>([]);
  const [currentSelectedTab, setCurrentSelectedTab] = useState<FileTab>(null);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    minimap: {
      enabled: true,
    },
    wordWrap: "on",
  });

  const addOpenFile = (file: FileTab) => {
    setOpenedTabs((prev) => {
      if (prev.find((tab) => tab.index === file.index)) {
        return prev;
      }

      return [...prev, file];
    });

    setCurrentSelectedTab(file);
  };

  const removeOpenFile = (index: number) => {
    setOpenedTabs((prev) => {
      const newTabs = prev.filter((_, i) => i !== index);

      if (newTabs.length === 0) {
        setCurrentSelectedTab(null);
      }

      return newTabs;
    });
  };

  const closeAllTabs = useCallback(() => {
    setOpenedTabs([]);
    setCurrentSelectedTab(null);
  }, []);

  useEffect(() => {
    (async () => {
      const settings = await window.electron.getEditorSettings();
      setEditorSettings(settings);
    })();
  }, []);

  return (
    <AppState.Provider
      value={{
        openedTabs,
        currentSelectedTab,
        editorSettings,
        setEditorSettings,
        setOpenedTabs,
        setCurrentSelectedTab,
        addOpenFile,
        removeOpenFile,
        closeAllTabs,
      }}
    >
      {children}
    </AppState.Provider>
  );
};

export const useAppState = (): AppStateType => {
  const context = useContext(AppState);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};
