import { FC, ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  testId?: string;
  title?: string;
}

const CardWrapper: FC<CardWrapperProps> = ({
  children,
  className,
  linkTo,
  linkTarget,
  onClick,
  testId,
  title
}) => {

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if(onClick){
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  const commonProps = {
    className,
    onClick: handleClick,
    'data-testid': testId,
    title
  }

  if(linkTo)
    return (
      <Link
        to={linkTo}
        target={linkTarget}
        {...commonProps}
      >
        {children}
      </Link>
    );

    return (
      <div 
        {...commonProps}
      >
        {children}
      </div>
    );
};

export default CardWrapper;