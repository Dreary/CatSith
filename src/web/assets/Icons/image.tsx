import { SVGProps } from "react";
const ImageIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
    <path
      fill="#26a69a"
      d="M8.5 6h4l-4-4v4M3.875 1H9.5l4 4v8.6c0 .773-.616 1.4-1.375 1.4h-8.25c-.76 0-1.375-.627-1.375-1.4V2.4c0-.777.612-1.4 1.375-1.4M4 13.6h8V8l-2.625 2.8L8 9.4l-4 4.2m1.25-7.7c-.76 0-1.375.627-1.375 1.4 0 .773.616 1.4 1.375 1.4.76 0 1.375-.627 1.375-1.4 0-.773-.616-1.4-1.375-1.4z"
    />
  </svg>
);
export default ImageIcon;