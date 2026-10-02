// @vitest-environment jsdom

import { useTexture } from '@react-three/drei';
import type * as DreiModule from '@react-three/drei';
import { create, type ReactThreeTest } from '@react-three/test-renderer';
import { act, Component, type ReactNode } from 'react';
import { Color } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Monitor } from './index';
import { linksConfig } from '@/config';
import { useRoomStore } from '@/stores/room-store';

// Font loading is independent of the image failure being exercised here.
vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof DreiModule>();
  return {
    ...original,
    Text: ({ children }: { children: ReactNode }) => (
      <group name={typeof children === 'string' ? children : ''} />
    ),
  };
});

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  public state = { failed: false };

  public static getDerivedStateFromError() {
    return { failed: true };
  }

  public componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  public render() {
    return this.state.failed ? null : this.props.children;
  }
}

let renderer: ReactThreeTest.Renderer | undefined;
const initialRoomState = useRoomStore.getState();

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  useRoomStore.setState({ isLinkClusterOpen: true, panel: null, selectedLinkId: null });
});

afterEach(async () => {
  await renderer?.unmount();
  renderer = undefined;
  linksConfig.forEach((link) => useTexture.clear(link.image));
  useRoomStore.setState(initialRoomState);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('monitor image failures', () => {
  it.each([
    { id: 'about', theme: 'light' },
    { id: 'about', theme: 'dark' },
    { id: 'blog', theme: 'light' },
  ] as const)(
    'keeps links usable when the $id image fails in $theme mode',
    async ({ id, theme }) => {
      useRoomStore.setState({ theme });
      const failedLink = linksConfig.find((link) => link.id === id);
      expect(failedLink).toBeDefined();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
        this: HTMLImageElement,
        url: string,
      ) {
        queueMicrotask(() => {
          this.dispatchEvent(new Event(url === failedLink?.image ? 'error' : 'load'));
        });
      });
      const onError = vi.fn();

      renderer = await create(
        <SceneErrorBoundary onError={onError}>
          <Monitor />
        </SceneErrorBoundary>,
      );
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(onError).not.toHaveBeenCalled();
      const aboutTitle = renderer.scene.findByProps({ name: '关于' });
      expect(aboutTitle.parent).not.toBeNull();
      if (aboutTitle.parent === null)
        throw new Error('The about link is missing its clickable group');
      const failedTitle = renderer.scene.findByProps({ name: failedLink?.title });
      const imageMesh = failedTitle.parent
        ?.findAllByType('Mesh')
        .find((mesh) => mesh.instance.position.x === -0.54);
      expect(imageMesh?.instance).toHaveProperty('material.map', null);
      expect(imageMesh?.instance).toHaveProperty(
        'material.color',
        new Color(theme === 'light' ? '#f4f4f4' : '#080a0c'),
      );
      const lifeTitle = renderer.scene.findByProps({ name: '生活' });
      const lifeImage = lifeTitle.parent
        ?.findAllByType('Mesh')
        .find((mesh) => mesh.instance.position.x === -0.54);
      expect(lifeImage?.instance).toHaveProperty(
        'material.map',
        expect.objectContaining({ isTexture: true }),
      );
      if (id === 'blog') {
        const screen = renderer.scene
          .findAllByType('Mesh')
          .find((mesh) => mesh.instance.position.z === 0.068);
        expect(screen?.instance).toHaveProperty('material.map', null);
        expect(screen?.instance).toHaveProperty('material.toneMapped', false);
      }
      await renderer.fireEvent(aboutTitle.parent, 'click', { stopPropagation: () => undefined });
      expect(useRoomStore.getState().selectedLinkId).toBe('about');
    },
  );
});
