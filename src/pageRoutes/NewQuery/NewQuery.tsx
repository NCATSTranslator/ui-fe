import CombinedQueryInterface from "@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface";
import styles from "./NewQuery.module.scss";
import { joinClasses } from "@/features/Core/utils/classHelpers";

const NewQuery = () => {
  const headingClasses = joinClasses(styles.heading, 'h5');
  return (
    <div className={styles.newQuery}>
      <h1 className={headingClasses}>Explore Translator</h1>
      <CombinedQueryInterface />
    </div>
  )
}

export default NewQuery;