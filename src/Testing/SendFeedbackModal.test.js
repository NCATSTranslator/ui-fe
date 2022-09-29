import { render, screen, fireEvent } from '@testing-library/react';
import SendFeedbackModal from '../Components/Modals/SendFeedbackModal';
import {Provider} from 'react-redux';
import {store} from '../Redux/store';
import userEvent from '@testing-library/user-event';

describe('Send Feedback Modal', () => {
  test('Submission tests', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
      <SendFeedbackModal />
      </Provider>
    );

    // attempting to submit before putting in information disables the submit button
    await user.click(screen.getByRole('button', {name: 'Send'}));
    expect(screen.getByText('Send')).toBeDisabled();

    // change to bug report
    await user.click(screen.getByTestId('category-select'));
    await user.click(screen.getByTestId('Bug Report'));
    expect(screen.getByRole('option', {name: 'Bug Report'}).selected).toBe(true);

    // Fill out steps and comments and upload an image
    const stepsToReproduce = screen.getByLabelText('Steps to Reproduce *');
    expect(stepsToReproduce).toBeInTheDocument();
    await user.type(stepsToReproduce, 'Step 1: lorem ipsum dolor');
    expect(screen.getByText(/Step 1: lorem/)).toBeInTheDocument();
    
    const comments = screen.getByTestId('comments');
    await user.type(comments, 'Lorem ipsum dolor sit amet...');
    expect(screen.getByText(/sit amet.../)).toBeInTheDocument();

    const files = [
      new File(['hello'], 'hello.png', {type: 'image/png'}),
      new File(['there'], 'there.png', {type: 'image/png'}),
    ]
    const input = screen.getByLabelText(/Browse Files/i)
    await user.upload(input, files)
    expect(input.files).toHaveLength(2)
    expect(input.files[0]).toBe(files[0])
    expect(input.files[1]).toBe(files[1])

    // confirm submit button is no longer disabled
    expect(screen.getByText('Send')).not.toBeDisabled();

  });
})