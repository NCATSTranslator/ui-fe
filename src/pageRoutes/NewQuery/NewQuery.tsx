import CombinedQueryInterface from "@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface";
import styles from "./NewQuery.module.scss";

const NewQuery = () => {
  return (
    <div className={styles.newQuery}>
      <h1 className="h5">Explore Translator</h1>
      <CombinedQueryInterface className={styles.combinedQueryInterface} />
    </div>
  )
}

export default NewQuery;