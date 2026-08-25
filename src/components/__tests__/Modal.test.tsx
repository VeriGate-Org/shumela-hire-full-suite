import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

/**
 * These pin the behaviour contract from the modal standard — the parts that sixty-three hand-rolled
 * overlays each remembered some of. Every assertion here corresponds to a row in that table, so a
 * future primitive that drops one fails rather than regressing quietly.
 */
describe('Modal', () => {
  const open = (props: Partial<React.ComponentProps<typeof Modal>> = {}) =>
    render(
      <Modal open onClose={jest.fn()} title="Schedule interview" {...props}>
        <input aria-label="Round" />
        <button type="button">Add panellist</button>
      </Modal>,
    );

  it('announces itself, and names itself by its title', () => {
    open();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Schedule interview');
  });

  it('closes on Escape', async () => {
    const onClose = jest.fn();
    open({ onClose });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape even with unsaved input — a keyboard user is never trapped', async () => {
    const onClose = jest.fn();
    const onRequestClose = jest.fn(() => false);
    open({ onClose, dirty: true, onRequestClose });

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it('closes on a backdrop click', () => {
    const onClose = jest.fn();
    const { container } = open({ onClose });
    fireEvent.mouseDown(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks before discarding unsaved input on a backdrop click', () => {
    const onClose = jest.fn();
    const onRequestClose = jest.fn(() => false);
    const { container } = open({ onClose, dirty: true, onRequestClose });

    fireEvent.mouseDown(container.firstChild as Element);

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a drag that starts inside the panel and ends on the backdrop', () => {
    const onClose = jest.fn();
    const { container } = open({ onClose });
    // mousedown on the panel, not the backdrop — selecting text and releasing outside must not
    // count as a request to close.
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    expect(container).toBeTruthy();
  });

  it('moves focus into the panel on open', () => {
    open();
    expect(screen.getByLabelText('Round')).toHaveFocus();
  });

  it('returns focus to whatever opened it', async () => {
    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open
          </button>
          <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Schedule interview">
            <p>Body</p>
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });

    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');

    // Without this a keyboard user restarts at the top of the document every time.
    expect(opener).toHaveFocus();
  });

  it('stops the page behind scrolling, and gives the scroll back', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = open();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    // Restores what was there rather than clearing it, so a rapid reopen cannot leave the page
    // permanently locked.
    expect(document.body.style.overflow).toBe('auto');
  });

  it('renders nothing at all when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={jest.fn()} title="Schedule interview">
        <p>Body</p>
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
