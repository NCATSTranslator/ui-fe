import { FC } from 'react';
import styles from './LoginWarning.module.scss';
import { Link, useLocation } from 'react-router-dom';
import { getFormattedLoginURL } from '@/features/UserAuth/utils/userApi';

type LoginWarningProps = {
  displayLink?: boolean;
  text?: string;
}

const LoginWarning: FC<LoginWarningProps> = ({text = "", displayLink = true}) => {
  const location = useLocation();
  let temptext = !!text ? text : "You must be logged in to view this content.";
  
  return(
    <div className='container'>
      <h4 className={styles.heading}>{temptext}</h4>
      {
        displayLink && (
          <Link to={getFormattedLoginURL(location)} className={styles.link}>Log In</Link>
        )
      }
    </div>
  )
}

export default LoginWarning;