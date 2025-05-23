import { useEffect } from "react";
import QueryPathfinder from "../../Components/QueryPathfinder/QueryPathfinder";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { currentConfig } from "../../Redux/slices/userSlice";

const Pathfinder = () => {
  const config = useSelector(currentConfig);
  const navigate = useNavigate();

  useEffect(() => {
    if(config?.include_pathfinder === false)
      navigate("/");
  }, [config, navigate]);

  return (
    <div>
      <QueryPathfinder />
    </div>
  );
}

export default Pathfinder;