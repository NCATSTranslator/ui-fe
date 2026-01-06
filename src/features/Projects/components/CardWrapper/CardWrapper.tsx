import { FC, ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
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

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if(onClick){
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  if(linkTo)
    return (
      <Link
        to={linkTo}
        target={linkTarget}
        className={className}
        data-testid={testId}
        onClick={handleClick}
      >
        {children}
      </Link>
    );

    return (
      <div 
        className={className}
        onClick={handleClick}
        data-testid={testId}
      >
        {children}
      </div>
    );
};

export default CardWrapper;