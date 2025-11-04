import { Link } from 'react-router-dom';
import styles from './LoginWarning.module.scss';
import { FC } from 'react';

type LoginWarningProps = {
  displayLink?: boolean;
  text?: string;
}

const LoginWarning: FC<LoginWarningProps> = ({text = "", displayLink = true}) => {

  let temptext = !!text ? text : "You must be logged in to view this content.";
  
  return(
    <div className='container'>
      <h4 className={styles.heading}>{temptext}</h4>
      {
        displayLink && (
          <Link to="/login" className={styles.link}>Log In</Link>
        )
      }
    </div>
  )
}

export default LoginWarning;