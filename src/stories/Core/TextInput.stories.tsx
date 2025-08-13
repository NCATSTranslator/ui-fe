import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Core/TextInput',
  component: TextInput,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text displayed above the input',
    },
    subtitle: {
      control: { type: 'text' },
      description: 'Subtitle text displayed below the label',
    },
    value: {
      control: { type: 'text' },
      description: 'Current value of the input',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text shown when input is empty',
    },
    rows: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of rows for textarea (if > 1, renders as textarea)',
    },
    error: {
      control: { type: 'boolean' },
      description: 'Whether to show error state',
    },
    errorText: {
      control: { type: 'text' },
      description: 'Error message text to display',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS class for the input',
    },
    maxLength: {
      control: { type: 'number', min: -1, max: 1000 },
      description: 'Maximum number of characters allowed (-1 for no limit)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    }
  },
  // Use `fn` to spy on the handleChange arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { 
    handleChange: fn(),
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Input Label',
    placeholder: 'Enter text...',
  },
};

export const WithLabelAndSubtitle: Story = {
  args: {
    label: 'Email Address',
    subtitle: 'We\'ll never share your email with anyone else',
    placeholder: 'Enter your email...',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Username',
    value: 'john_doe',
    placeholder: 'Enter username...',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    value: 'invalid-email',
    error: true,
    errorText: 'Please enter a valid email address',
    placeholder: 'Enter your email...',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'This input is disabled',
    disabled: true,
    placeholder: 'This input is disabled',
  },
};

export const WithMaxLength: Story = {
  args: {
    label: 'Limited Input',
    placeholder: 'Max 50 characters',
    maxLength: 50,
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search for something...',
    iconLeft: <SearchIcon />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Clearable Input',
    value: 'Some text',
    placeholder: 'Type something...',
    iconRight: <CloseIcon />,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Input with Icons',
    placeholder: 'Type here...',
    iconLeft: <SearchIcon />,
    iconRight: <InfoIcon />,
  },
};

export const Textarea: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
    rows: 4,
  },
};

export const TextareaWithValue: Story = {
  args: {
    label: 'Bio',
    value: 'This is a longer text that demonstrates how the textarea component handles multi-line content.',
    rows: 5,
  },
};

export const TextareaWithError: Story = {
  args: {
    label: 'Description',
    value: 'Too short',
    error: true,
    errorText: 'Description must be at least 50 characters long',
    rows: 3,
  },
};

export const MultipleInputs: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <TextInput
        label="Username"
        placeholder="Enter username"
        handleChange={fn()}
      />
      <TextInput
        label="Email"
        subtitle="We'll never share your email"
        placeholder="Enter email"
        iconLeft={<SearchIcon />}
        handleChange={fn()}
      />
      <TextInput
        label="Password"
        placeholder="Enter password"
        iconRight={<InfoIcon />}
        error={true}
        errorText="Password is required"
        handleChange={fn()}
      />
      <TextInput
        label="Bio"
        placeholder="Tell us about yourself"
        rows={3}
        handleChange={fn()}
      />
      <TextInput
        label="Disabled Field"
        value="This field is disabled"
        disabled={true}
        handleChange={fn()}
      />
    </div>
  ),
};

export const InteractiveExample: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState(false);
    
    const handleChange = (newValue: string) => {
      setValue(newValue);
      setError(newValue.length > 0 && newValue.length < 3);
    };
    
    return (
      <div style={{ width: '400px' }}>
        <TextInput
          label="Interactive Input"
          subtitle="Try typing - it will show an error if less than 3 characters"
          value={value}
          placeholder="Type at least 3 characters..."
          error={error}
          errorText="Input must be at least 3 characters long"
          handleChange={handleChange}
        />
      </div>
    );
  },
};
