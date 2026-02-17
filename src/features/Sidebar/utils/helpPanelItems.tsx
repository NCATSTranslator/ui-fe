import { HelpPanelItem } from "@/features/Sidebar/types/sidebar";
import { SortingAndFiltering } from "@/pageRoutes/Articles/SortingAndFiltering";
import { SecurityAndPrivacy } from "@/pageRoutes/Articles/SecurityAndPrivacy";
import { FrequentlyAskedQuestions } from "@/pageRoutes/Articles/FrequentlyAskedQuestions";
import { QueryHistoryArticle } from "@/pageRoutes/Articles/QueryHistoryArticle";
import { AccountAndSettings } from "@/pageRoutes/Articles/AccountAndSettings";
import { ProjectsArticle } from "@/pageRoutes/Articles/ProjectsArticle";
import { SharingResults } from "@/pageRoutes/Articles/SharingResults";
import { BookmarksAndNotes } from "@/pageRoutes/Articles/BookmarksAndNotes";
import { RelationshipEvidence } from "@/pageRoutes/Articles/RelationshipEvidence";
import { PathsAndGraphs } from "@/pageRoutes/Articles/PathsAndGraphs";
import { LoadingAndSyncing } from "@/pageRoutes/Articles/LoadingAndSyncing";
import { SubmittingQueries } from "@/pageRoutes/Articles/SubmittingQueries";
import { HowToUseTranslator } from "@/pageRoutes/Articles/HowToUseTranslator";
import { AboutTranslator } from "@/pageRoutes/Articles/AboutTranslator";

export const helpPanelItems: HelpPanelItem[] = [
  {
    id: 'about-translator',
    title: 'About Translator',
    component: <AboutTranslator />
  },
  {
    id: 'how-to-use-translator',
    title: 'How to Use Translator',
    component: <HowToUseTranslator />
  },
  {
    id: 'submitting-queries',
    title: 'Submitting Queries',
    component: <SubmittingQueries />
  },
  {
    id: 'loading-and-syncing',
    title: 'Loading and Syncing',
    component: <LoadingAndSyncing />
  },
  {
    id: 'paths-and-graphs',
    title: 'Paths and Graphs',
    component: <PathsAndGraphs />
  },
 
  {
    id: 'relationship-evidence',
    title: 'Relationship Evidence',
    component: <RelationshipEvidence />
  },
  {
    id: 'sorting-and-filtering',
    title: 'Sorting and Filtering',
    component: <SortingAndFiltering />
  },
  {
    id: 'bookmarks-and-notes',
    title: 'Bookmarks and Notes',
    component: <BookmarksAndNotes />
  },
  {
    id: 'sharing-results',
    title: 'Sharing Results',
    component: <SharingResults />
  },
  {
    id: 'projects-article',
    title: 'Projects',
    component: <ProjectsArticle />
  },
  {
    id: 'query-history-article',
    title: 'Query History',
    component: <QueryHistoryArticle />
  },
  {
    id: 'account-and-settings',
    title: 'Account and Settings',
    component: <AccountAndSettings />
  },
  {
    id: 'frequently-asked-questions',
    title: 'Frequently Asked Questions',
    component: <FrequentlyAskedQuestions />
  },
  {
    id: 'security-and-privacy',
    title: 'Security and Privacy',
    component: <SecurityAndPrivacy />
  },
];