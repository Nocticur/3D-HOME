// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchDialog } from './index';

vi.mock('@/hooks/use-media-query', () => ({ useMediaQuery: () => false }));

afterEach(() => cleanup());

describe('accessible blog navigation', () => {
  it('opens the search dialog from its visible trigger and lists public blog sections', async () => {
    const user = userEvent.setup();
    render(<SearchDialog />);

    await user.click(screen.getByRole('button', { name: '博客导航与搜索' }));

    expect(screen.getByRole('dialog', { name: '搜索终端' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: '博客分区' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '文章列表' }).getAttribute('href')).toBe(
      'https://blog.mourn.top/list/',
    );
    expect(screen.getByRole('link', { name: '动态日历' }).getAttribute('href')).toBe(
      'https://blog.mourn.top/calendar/',
    );
    expect(screen.getByRole('link', { name: '日常记录' }).getAttribute('href')).toBe(
      'https://blog.mourn.top/life/routines/',
    );
    expect(screen.getByRole('link', { name: '留言板' }).getAttribute('href')).toBe(
      'https://blog.mourn.top/guestbook/',
    );
  });
});
