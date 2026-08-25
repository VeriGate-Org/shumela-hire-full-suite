import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkActionBar, { BulkSelect, BulkButton } from '../record/BulkActionBar';

/**
 * The bar is shared by the applications queue and the pipeline board, and the rule it encodes is
 * the reason it takes its actions as children: the bulk endpoints do not admit the same roles.
 * Status and stage are ADMIN/HR_MANAGER, rating also admits RECRUITER. A page that rendered every
 * action for every role would put controls in front of a recruiter that answer 403 — which reads
 * as a broken product rather than a permission boundary.
 */
describe('BulkActionBar', () => {
  it('stays out of the way until something is selected', () => {
    const { container } = render(
      <BulkActionBar count={0} onClear={jest.fn()}>
        <BulkButton onClick={jest.fn()}>Reject</BulkButton>
      </BulkActionBar>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('reports how many rows the next action will touch', () => {
    render(
      <BulkActionBar count={12} onClear={jest.fn()}>
        <BulkButton onClick={jest.fn()}>Reject</BulkButton>
      </BulkActionBar>,
    );

    expect(screen.getByText('12 selected')).toBeInTheDocument();
  });

  it('renders only the actions it was given', () => {
    // A recruiter's bar: rating is permitted, stage and reject are not, so they are not passed.
    render(
      <BulkActionBar count={3} onClear={jest.fn()}>
        {false}
        <BulkSelect
          label="Set rating"
          options={[{ value: '5', label: '5 stars' }]}
          onChoose={jest.fn()}
        />
        {false}
      </BulkActionBar>,
    );

    expect(screen.getByLabelText('Set rating')).toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move to stage')).not.toBeInTheDocument();
  });

  it('says so plainly when the role may use none of them', () => {
    // A hiring manager reaches the pipeline board but may run no bulk endpoint at all. An empty
    // bar would read as a rendering fault; this states the reason.
    render(
      <BulkActionBar count={4} onClear={jest.fn()}>
        {false}
        {false}
      </BulkActionBar>,
    );

    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('lets the selection be abandoned', async () => {
    const onClear = jest.fn();
    render(
      <BulkActionBar count={2} onClear={onClear}>
        <BulkButton onClick={jest.fn()}>Reject</BulkButton>
      </BulkActionBar>,
    );

    await userEvent.click(screen.getByLabelText('Clear selection'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('runs the action on choice and resets, so the same value can be applied twice', async () => {
    const onChoose = jest.fn();
    render(
      <BulkActionBar count={2} onClear={jest.fn()}>
        <BulkSelect
          label="Move to stage"
          options={[
            { value: 'screening', label: 'Screening' },
            { value: 'interviews', label: 'Interviews' },
          ]}
          onChoose={onChoose}
        />
      </BulkActionBar>,
    );

    const select = screen.getByLabelText('Move to stage') as HTMLSelectElement;

    await userEvent.selectOptions(select, 'screening');
    expect(onChoose).toHaveBeenCalledWith('screening');

    // The control is a trigger, not a stored filter. Leaving 'screening' selected would mean
    // moving a second batch to the same stage silently did nothing.
    expect(select.value).toBe('');
  });
});
