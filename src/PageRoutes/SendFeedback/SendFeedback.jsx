import { Link } from "react-router-dom";
import SendFeedbackForm from "../../Components/SendFeedbackForm/SendFeedbackForm";

const SendFeedbackPage = () => {

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 className="h4">Send Feedback</h1>
          <p>Enjoying Translator? Having an issue? Use this form to share your comments. For immediate assistance, please check out our <Link to='/help'>Help</Link> page for Translator tips, tricks, and tutorials.</p>
        </div>
      </div>
      <div className={`container`}>
        <SendFeedbackForm/>
      </div>
    </div>
  );
}

export default SendFeedbackPage;