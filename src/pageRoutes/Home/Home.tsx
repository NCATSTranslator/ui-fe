import { useState } from "react";
import styles from "./Home.module.scss";
import CombinedQueryInterface from "@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface";
import TaxonIcon from "@/assets/icons/queries/Taxon.svg?react";
import LightBulbIcon from "@/assets/icons/buttons/Lightbulb.svg?react";
import DatabaseIcon from "@/assets/icons/navigation/Database.svg?react";
import PlayButtonIcon from "@/assets/icons/buttons/PlayButton.svg?react";
import VideoPoster from "@/assets/images/VideoPoster.png";
import { Link } from "react-router-dom";

const Home = () => {
  const [showVideo, setShowVideo] = useState(false);
  
  return (
    <div>
      <h1 className={styles.pageHeading}>Explore Biomedical Knowledge</h1>
      <p className={styles.intro}>Translator integrates known relationships in research literature and hundreds of diverse data sources to reveal multi-step pathways between biomedical entities and novel connections that you can't find anywhere else. <Link to="/how-to-use-translator">Learn How to Use Translator</Link></p>
      <CombinedQueryInterface />
      <div className={styles.homePageContent}>
        <div className={`${styles.section} ${styles.iconSection}`}>
          <div className={`${styles.container} container`}>
            <div className={`${styles.iconGrid} ${styles.threeCol}`}>
              <div className={styles.iconCol}>
                <DatabaseIcon />
                <p className="sub-one">Diverse Data Sources</p>
                <p>Access evidence from curated databases, authoritative dictionaries, and other sources</p>
              </div>
              <div className={styles.iconCol}>
                <TaxonIcon />
                <p className="sub-one">Complex Reasoning</p>
                <p>Translator's advanced reasoning algorithms create networks of biomedical relationships</p>
              </div>
              <div className={styles.iconCol}>
                <LightBulbIcon className={styles.lightBulbIcon} />
                <p className="sub-one">Novel Insights</p>
                <p>Previously unknown insights are displayed in  rich pathways and knowledge graphs</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.section} ${styles.videoSection}`}>
          <div className={`${styles.container} container`}>
            <div className={styles.twoCol}>
              <div className={styles.colOne}>
                {showVideo ? (
                  <div className={styles.iframeContainer}>
                    <iframe
                      src="https://drive.google.com/file/d/1f4Wn3MGH1_SSAg3YIK41Szdbt389PqiL/preview?autoplay=1"
                      title="About Translator"
                      allow="autoplay"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    className={styles.videoThumbnail}
                    onClick={() => setShowVideo(true)}
                    aria-label="Play video"
                  >
                    <img src={VideoPoster} alt="About Translator" />
                    <PlayButtonIcon className={styles.playButton} />
                  </button>
                )}
              </div>
              <div className={styles.colTwo}>
                <h5>About Translator</h5>
                <p className={styles.aboutTranslatorText}>The Biomedical Data Translator is an open-access research platform that helps researchers <strong>explore relationships between drugs, genes, diseases, and other biomedical entities</strong>. Developed by a consortium of scientists, physicians, bioinformaticians, programmers, and funded by the <a href="https://ncats.nih.gov/research/research-activities/translator/about" target="_blank" rel="noreferrer">National Center for Advancement of Translational Sciences</a>, Translator integrates diverse data sources and uses <Link to="/about-translator#reasoning-agents">reasoning agents</Link> to reveal both direct and inferred relationships that support <Link to="/relationship-evidence">evidence-based discovery</Link> in translational research.</p>
                <Link to="/about-translator" className={styles.learnMoreLink}>Learn More About Translator</Link>
              </div>
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
              <div className={`${styles.colTwo} ${styles.articlesCol}`}>
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