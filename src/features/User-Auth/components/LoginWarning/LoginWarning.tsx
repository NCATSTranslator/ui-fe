import styles from './LoginWarning.module.scss';
import { FC } from 'react';

type LoginWarningProps = {
  text?: string;
}

const LoginWarning: FC<LoginWarningProps> = ({text = ""}) => {

  let temptext = !!text ? text : "You must be logged in to view this content.";
  
  return(
    <div className='container'>
      <h4 className={styles.heading}>{temptext}</h4>
    </div>
  )
}

export default LoginWarning;