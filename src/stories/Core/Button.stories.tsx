import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Button from '@/features/Core/components/Button/Button';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import ExternalLinkIcon from '@/assets/icons/buttons/External Link.svg?react';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Core/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['secondary', undefined],
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    small: {
      control: { type: 'boolean' },
    },
    iconOnly: {
      control: { type: 'boolean' },
    },
    link: {
      control: { type: 'boolean' },
    },
    _blank: {
      control: { type: 'boolean' },
    },
  },
  // Use `fn` to spy on the handleClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { handleClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    children: 'Label',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Label',
  },
};

export const Small: Story = {
  args: {
    small: true,
    children: 'Label',
  },
};

export const SmallSecondary: Story = {
  args: {
    small: true,
    variant: 'secondary',
    children: 'Label',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Label',
  },
};

export const IconOnly: Story = {
  args: {
    iconOnly: true,
    iconLeft: <InfoIcon />,
    children: '',
  },
};

export const WithIcons: Story = {
  args: {
    iconLeft: <InfoIcon />,
    iconRight: <ExternalLinkIcon />,
    children: 'Open Folder',
  },
};

export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    _blank: true,
    children: 'External Link',
    iconRight: <ExternalLinkIcon />,
  },
};
