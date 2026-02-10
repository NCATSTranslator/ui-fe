import { Link } from "react-router-dom";
import styles from "./FeedbackPanel.module.scss";
import SendFeedbackForm from "@/features/Page/components/SendFeedbackForm/SendFeedbackForm";

const FeedbackPanel = () => {
  return (
    <div>
      <p className={styles.helpText}>For immediate assistance, please check out our <Link to='/help'>Help</Link> page for Translator tips, tricks, and tutorials.</p>
      <SendFeedbackForm/>
    </div>
  );
};

export default FeedbackPanel;