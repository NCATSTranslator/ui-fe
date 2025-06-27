import { QueryItem } from "@/features/Query/components/QueryBar/QueryBar";

export type QueryHistoryItem = {
  item?: QueryItem;
  date: string;
  id: string;
  time?: string;
}