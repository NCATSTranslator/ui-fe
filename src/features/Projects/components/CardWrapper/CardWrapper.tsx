import { FC, ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  testId?: string;
}

const CardWrapper: FC<CardWrapperProps> = ({
  children,
  className,
  linkTo,
  linkTarget,
  onClick,
  testId
}) => {

  if(linkTo)
    return (
      <Link
        to={linkTo}
        target={linkTarget}
        className={className}
        data-testid={testId}
      >
        {children}
      </Link>
    );
  else
    return (
      <div 
        className={className}
        onClick={onClick}
        data-testid={testId}
      >
        {children}
      </div>
    );
};

export default CardWrapper;