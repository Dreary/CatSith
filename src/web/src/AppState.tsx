import { editor } from "monaco-editor";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export interface FileTab {
  index: number;
  contentType: "text" | "image";
  name: string;
  value: string;
  changed: boolean;
}

export interface AppStateType {
  openedTabs: FileTab[];
  currentSelectedTab: FileTab;
  setOpenedTabs: React.Dispatch<React.SetStateAction<FileTab[]>>;
  setCurrentSelectedTab: React.Dispatch<React.SetStateAction<FileTab>>;
  addOpenFile: (file: FileTab) => void;
  removeOpenFile: (index: number) => void;
}

// Create the context
const AppState = createContext<AppStateType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [openedTabs, setOpenedTabs] = useState<FileTab[]>([]);
  const [currentSelectedTab, setCurrentSelectedTab] = useState<FileTab>(null);

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

  return (
    <AppState.Provider
      value={{
        openedTabs,
        currentSelectedTab,
        setOpenedTabs,
        setCurrentSelectedTab,
        addOpenFile,
        removeOpenFile,
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
