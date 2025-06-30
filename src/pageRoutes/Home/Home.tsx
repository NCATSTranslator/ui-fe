import styles from "./Home.module.scss";
import HomeOne from "@/assets/images/Home/home1.svg?react";
import HomeTwo from "@/assets/images/Home/home2.svg?react";
import HomeThree from "@/assets/images/Home/home3.svg?react";
import CombinedQueryInterface from "@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface";

const Home = () => {

  return (
    <div>
      <h1 className={styles.pageHeading}>Explore Translator</h1>
      <CombinedQueryInterface />
      <div className={styles.homePageContent}>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <h5 className={styles.heading}>Translator Workflow</h5>
            <div className={styles.images}>
              <HomeOne className={styles.image}/>
              <HomeTwo className={styles.image}/>
              <HomeThree className={styles.image}/>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <div className={styles.twoCol}>
              <div className={styles.colOne}>
                <h5>Goals of Translator</h5>
                <p>There is a vast amount of diverse data available to clinical, biomedical, and translational scientists that has the potential to improve human health and well-being. However, domain-specific language and nonstandardized formatting often make this data difficult to process.</p>
                <p>To address these challenges, the Biomedical Data Translator Consortium has developed a pilot Translator system. Translator takes existing biomedical data sets and decodes them into insights that can augment human reasoning and accelerate translational science research.</p>
                <p className={styles.noMargin}>The main goals of this knowledge graph-based system are to:</p>
                <ul>
                  <li>Build infrastructure to support and facilitate data-driven translational research on a large scale.</li>
                  <li>Integrate as many datasets as possible and allow them to be cross-queried and reasoned over by translational researchers with minimal barriers, scalability, and accuracy.</li>
                  <li>Leverage open data, including patient data and team science.</li>
                  <li>Promote “serendipitous” discovery.</li>
                </ul>
              </div>
              <div className={styles.colTwo}>
                <h5>Articles and News</h5>
                <p>Learn how the Biomedical Data Translator program aims to help researchers access and connect diverse data.</p>
                <a 
                  href="https://tracs.unc.edu/index.php/news-articles/1947-use-cases-show-translators-potential-to-expedite-clinical-research" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  Use cases show Translator's potential to expedite clinical research
                </a>
                <a 
                  href="https://www.statnews.com/2019/07/31/nih-funded-project-aims-to-build-a-google-for-biomedical-data/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  NIH-Funded Project Aims to Build a 'Google' for Biomedical Data
                </a>
                <a 
                  href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.12595" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  Deconstructing the Translational Tower of Babel
                </a>
                <a 
                  href="https://ascpt.onlinelibrary.wiley.com/doi/full/10.1111/cts.12591" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  Toward A Universal Biomedical Data Translator 
                </a>
                <a 
                  href="https://ascpt.onlinelibrary.wiley.com/doi/full/10.1111/cts.12592" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  The Biomedical Data Translator Program: Conception, Culture, and Community
                </a>
                <a 
                  href="https://ascpt.onlinelibrary.wiley.com/doi/10.1111/cts.12638" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  Clinical Data: Sources and Types, Regulatory Constraints, Applications
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;