import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import Query3 from "../../Components/Query/Query3";
import styles from "./Home.module.scss";

const Home = () => {

  return (
    <div>
      <Query3 />
      <div className={styles.homePageContent}>
        <div className={styles.one}>

        </div>
        <div className={styles.two}>

        </div>
        <div className={styles.three}>

        </div>
      </div>
    </div>
  );
}

export default Home;