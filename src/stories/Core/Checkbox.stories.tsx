import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import CheckmarkIcon from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import StarIcon from '@/assets/icons/navigation/Star/Star.svg?react';

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
    labelLeft: {
      control: { type: 'boolean' },
      description: 'Whether to show the label on the left side',
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
    children: 'Checkbox Label',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: 'Default Checkbox',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    children: 'Checked Checkbox',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Checkbox',
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    children: 'Disabled Checked Checkbox',
  },
};

export const LabelLeft: Story = {
  args: {
    labelLeft: true,
    children: 'Label on Left',
  },
};

export const LabelLeftChecked: Story = {
  args: {
    labelLeft: true,
    checked: true,
    children: 'Label on Left (Checked)',
  },
};

export const WithCustomIcon: Story = {
  args: {
    icon: <StarIcon />,
    children: 'Custom Icon Checkbox',
  },
};

export const WithCustomIconChecked: Story = {
  args: {
    icon: <StarIcon />,
    checked: true,
    children: 'Custom Icon Checkbox (Checked)',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'This is a helpful tooltip',
    children: 'Checkbox with Title',
  },
};

export const WithNameAndValue: Story = {
  args: {
    name: 'example-checkbox',
    value: 'example-value',
    children: 'Checkbox with Name and Value',
  },
};

export const WithId: Story = {
  args: {
    id: 'custom-checkbox-id',
    children: 'Checkbox with Custom ID',
  },
};

export const WithAriaDescribedby: Story = {
  args: {
    'aria-describedby': 'checkbox-description',
    children: 'Checkbox with ARIA Description',
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'custom-checkbox-class',
    children: 'Checkbox with Custom Class',
  },
};

export const WithCheckedClassName: Story = {
  args: {
    checked: true,
    checkedClassName: 'custom-checked-class',
    children: 'Checkbox with Checked Class',
  },
};

export const LongLabel: Story = {
  args: {
    children: 'This is a very long checkbox label that might wrap to multiple lines to test how the component handles longer text content',
  },
};

export const MultipleCheckboxes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Checkbox handleClick={fn()} name="option1" value="1">
        Option 1
      </Checkbox>
      <Checkbox handleClick={fn()} name="option2" value="2" checked>
        Option 2 (Checked)
      </Checkbox>
      <Checkbox handleClick={fn()} name="option3" value="3" disabled>
        Option 3 (Disabled)
      </Checkbox>
      <Checkbox handleClick={fn()} name="option4" value="4" icon={<StarIcon />}>
        Option 4 (Custom Icon)
      </Checkbox>
    </div>
  ),
};
