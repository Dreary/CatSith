import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DDSLoader } from "three-stdlib";

THREE.DefaultLoadingManager.addHandler(/\.dds$/i, new DDSLoader());

interface DDSViewerProps {
  value: string; // Base64 string
}

interface ResponsivePlaneProps {
  texture: THREE.CompressedTexture;
}

const ResponsivePlane = ({ texture }: ResponsivePlaneProps) => {
  const { viewport } = useThree();

  if (!texture) return null;

  // Calculate aspect ratios
  const containerAspect = viewport.width / viewport.height;
  const textureAspect = texture.image.width / texture.image.height;

  // Calculate dimensions to fit texture while maintaining aspect ratio
  let width = viewport.width;
  let height = viewport.height;

  if (containerAspect > textureAspect) {
    // Container is wider than texture
    width = height * textureAspect;
  } else {
    // Container is taller than texture
    height = width / textureAspect;
  }

  return (
    <mesh rotation={[0, 0, Math.PI]}>
      <planeGeometry args={[width, height]} />
      {texture && <meshBasicMaterial map={texture} side={THREE.DoubleSide} />}
    </mesh>
  );
};

export const DDSViewer = ({ value }: DDSViewerProps) => {
  if (!value) return null;

  const [texture, setTexture] = useState(null);
  const containerRef = useRef();

  const base64ToBytes = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  useEffect(() => {
    (async () => {
      const startTime = performance.now();

      const ddsBytes = base64ToBytes(value);
      console.log(`base64ToBytes took ${performance.now() - startTime} ms`);

      // Create blob from bytes
      const blobStartTime = performance.now();
      const blob = new Blob([ddsBytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      console.log(`Blob creation took ${performance.now() - blobStartTime} ms`);

      // Load the texture
      const loader = new DDSLoader();
      const loadStartTime = performance.now();
      loader.load(url, (loadedTexture) => {
        console.log(
          `Texture loading took ${performance.now() - loadStartTime} ms`,
        );

        // Fix texture orientation
        const fixStartTime = performance.now();
        loadedTexture.flipY = false; // Prevents the automatic flip
        loadedTexture.repeat.set(-1, 1); // Mirror horizontally
        loadedTexture.offset.set(1, 0); // Adjust offset for mirroring
        console.log(`Texture fix took ${performance.now() - fixStartTime} ms`);

        setTexture(loadedTexture);
        URL.revokeObjectURL(url);

        console.log(
          `Total useEffect execution took ${performance.now() - startTime} ms`,
        );
      });
    })();
  }, [value]);

  if (!texture) return null;

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{
          position: [0, 0, 5],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        <ambientLight intensity={1} />
        <ResponsivePlane texture={texture} />
      </Canvas>
    </div>
  );
};
