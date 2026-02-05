import FAQPanel from "@/features/Sidebar/components/Panels/FAQPanel/FAQPanel";
import { LoggingIn } from "@/pageRoutes/Articles/LoggingIn";
import { HelpPanelItem } from "@/features/Sidebar/types/sidebar";

export const helpPanelItems: HelpPanelItem[] = [
  {
    id: 'logging-in',
    title: 'Logging In',
    component: <LoggingIn />
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    component: <FAQPanel />
  }
];