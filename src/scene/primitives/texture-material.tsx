import { useTexture } from '@react-three/drei';
import { Component, Suspense, type ReactNode } from 'react';

interface TextureMaterialProps {
  url: string;
  fallbackColor: string;
  toneMapped?: boolean;
}

class TextureErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  public state = { failed: false };

  public static getDerivedStateFromError() {
    return { failed: true };
  }

  public render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function LoadedTextureMaterial({ url, toneMapped }: { url: string; toneMapped: boolean }) {
  const texture = useTexture(url);
  return <meshBasicMaterial map={texture} toneMapped={toneMapped} />;
}

export function TextureMaterial({ url, fallbackColor, toneMapped = true }: TextureMaterialProps) {
  const fallback = <meshBasicMaterial color={fallbackColor} toneMapped={toneMapped} />;

  return (
    <TextureErrorBoundary key={url} fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedTextureMaterial url={url} toneMapped={toneMapped} />
      </Suspense>
    </TextureErrorBoundary>
  );
}
