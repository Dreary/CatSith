import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getExtension = (fileName: string) => {
  return fileName.split(".").pop();
};

export const isImage = (fileName: string) => {
  return ["jpg", "jpeg", "png", "gif"].includes(getExtension(fileName));
};

export const isTexture = (fileName: string) => {
  return ["dds"].includes(getExtension(fileName));
};

export const isXml = (fileName: string) => {
  return ["xml", "xblock"].includes(getExtension(fileName));
};
