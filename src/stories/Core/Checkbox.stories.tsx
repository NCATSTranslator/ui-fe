import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Core/Checkbox',
  component: Checkbox,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is checked',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled',
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the checkbox',
    },
    subtitle: {
      control: { type: 'text' },
      description: 'Subtitle for the checkbox',
    },
    name: {
      control: { type: 'text' },
      description: 'Name attribute for the checkbox input',
    },
    value: {
      control: { type: 'text' },
      description: 'Value attribute for the checkbox input',
    },
    title: {
      control: { type: 'text' },
      description: 'Title attribute for accessibility',
    },
    id: {
      control: { type: 'text' },
      description: 'ID for the checkbox input',
    },
    'aria-describedby': {
      control: { type: 'text' },
      description: 'ARIA describedby attribute for accessibility',
    },
    checkedClassName: {
      control: { type: 'text' },
      description: 'Additional CSS class when checked',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS class for the checkbox',
    },
    icon: {
      control: { type: 'object' },
      description: 'Custom icon to display in the checkbox',
    },
    children: {
      control: { type: 'text' },
      description: 'Label text for the checkbox',
    },
  },
  // Use `fn` to spy on the handleClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { 
    handleClick: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    label: 'Default Checkbox',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Checked Checkbox',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled Checkbox',
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    label: 'Disabled Checked Checkbox',
  },
};

export const WithCustomIcon: Story = {
  args: {
    icon: <CloseIcon />,
    label: 'Custom Icon Checkbox',
  },
};

export const WithCustomIconChecked: Story = {
  args: {
    icon: <CloseIcon />,
    checked: true,
    label: 'Custom Icon Checkbox (Checked)',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'This is a helpful tooltip',
    label: 'Checkbox with Title',
  },
};

export const WithNameAndValue: Story = {
  args: {
    name: 'example-checkbox',
    value: 'example-value',
    label: 'Checkbox with Name and Value',
  },
};

export const WithId: Story = {
  args: {
    id: 'custom-checkbox-id',
    label: 'Checkbox with Custom ID',
  },
};

export const WithAriaDescribedby: Story = {
  args: {
    'aria-describedby': 'checkbox-description',
    label: 'Checkbox with ARIA Description',
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'custom-checkbox-class',
    label: 'Checkbox with Custom Class',
  },
};

export const WithCheckedClassName: Story = {
  args: {
    checked: true,
    checkedClassName: 'custom-checked-class',
    label: 'Checkbox with Checked Class',
  },
};

export const LongLabel: Story = {
  args: {
    label: 'This is a very long checkbox label that might wrap to multiple lines to test how the component handles longer text content',
  },
};

export const MultipleCheckboxes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Checkbox handleClick={fn()} name="option1" value="1" label="Option 1" />
      <Checkbox handleClick={fn()} name="option2" value="2" checked label="Option 2 (Checked)" />
      <Checkbox handleClick={fn()} name="option3" value="3" disabled label="Option 3 (Disabled)" />
      <Checkbox handleClick={fn()} name="option4" value="4" icon={<CloseIcon />} label="Option 4 (Custom Icon)" />
    </div>
  ),
};
