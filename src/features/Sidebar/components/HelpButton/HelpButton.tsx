import { useActiveHelpItem } from "@/features/Sidebar/hooks/useActiveHelpItem";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import Button from "@/features/Core/components/Button/Button";
import FullScreen from "@/assets/icons/buttons/Full Screen.svg?react";

const HelpButton = () => {
  const activeHelpItemId = useActiveHelpItem();
  const { closePanel } = useSidebar();
  const href = activeHelpItemId ? `/${activeHelpItemId}` : '/frequently-asked-questions';
  return (
    <Button
      iconLeft={<FullScreen />}
      iconOnly
      small
      href={href}
      handleClick={closePanel}
      link
      variant="textOnly"
      title="Frequently Asked Questions"
    />
  );
};

export default HelpButton