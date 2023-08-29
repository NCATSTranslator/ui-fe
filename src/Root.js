import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Root = () => {

  const navigate = useNavigate();

  useEffect(() => {
    if(window.location.pathname === "/") 
      navigate("/demo");
    
  }, [navigate]);
  
  return (
    <div className={`root`}>
     <Outlet/>
    </div>
  );
}

export default Root;
