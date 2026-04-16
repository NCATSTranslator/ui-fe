import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ViewNotFound.module.scss';
import Button from '@/features/Core/components/Button/Button';

interface ViewNotFoundProps {
  entity: string;
  id: string;
}

const ViewNotFound: FC<ViewNotFoundProps> = ({ entity, id }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.viewNotFound}>
      <h5 className={styles.title}>Not Found</h5>
      <p className={styles.message}>
        The {entity} "{id}" was not found in the current results.
      </p>
      <Button variant="textOnly" handleClick={() => navigate(-1) ?? navigate("/")}>
        Go Back
      </Button>
    </div>
  );
};

export default ViewNotFound;
